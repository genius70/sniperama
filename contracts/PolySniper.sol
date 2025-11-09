// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Import required interfaces for Polygon interactions
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

// QuickSwap interfaces (Polygon's main DEX)
interface IQuickSwapFactory {
    function getPair(address tokenA, address tokenB) external view returns (address pair);
    function allPairs(uint) external view returns (address pair);
    function allPairsLength() external view returns (uint);
}

interface IQuickSwapPair {
    function token0() external view returns (address);
    function token1() external view returns (address);
    function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast);
    function totalSupply() external view returns (uint);
}

interface IQuickSwapRouter {
    function factory() external pure returns (address);
    function WMATIC() external pure returns (address);
    
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
    
    function swapExactMATICForTokens(
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external payable returns (uint[] memory amounts);
    
    function swapExactTokensForMATIC(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
    
    function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts);
}

// UniswapV3 interfaces for additional DEX support on Polygon
interface IUniswapV3Factory {
    function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool);
}

interface IUniswapV3Pool {
    function token0() external view returns (address);
    function token1() external view returns (address);
    function liquidity() external view returns (uint128);
}

// Custom interface for liquidity locker inspection
interface ILiquidityLocker {
    function lockInfos(address lpToken, address user) external view returns (uint256 amount, uint256 unlockTime);
    function userLpLockInfo(address user, uint256 index) external view returns (address lpToken, uint256 amount, uint256 unlockTime);
}

contract PolySniper is ReentrancyGuard {
    // Polygon-specific addresses
    address public constant WMATIC = 0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270;
    address public constant QUICK_ROUTER = 0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff;
    address public constant QUICK_FACTORY = 0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32;
    address public constant UNIV3_FACTORY = 0x1F98431c8aD98523631AE4a59f267346ea31F984;
    
    // Common liquidity lockers on Polygon
    address public constant TEAM_FINANCE = 0x1C498531331ff7CA61916c2E3ef57644d0B42514;
    address public constant UNICRYPT = 0xE4a4C714f5601182f01258E5C42DDF1943AA2f43;
    
    // Trading parameters
    uint256 public minLiquidityLockDays = 90; // 90 days minimum liquidity lock
    uint256 public minLiquidityPercentage = 20; // 20% minimum liquidity locked
    uint256 public maxTotalSupply = 10_000_000_000 * 10**18; // 10 billion tokens
    uint256 public minTokenPrice = 1; // 0.00000001 (scaled by 10^10)
    
    // Profit-taking parameters
    uint256 public profitTakePercentage = 1000; // 10x (1000%)
    uint256 public stopLossPercentage = 15; // 15% drop
    uint256 public maxHoldingTime = 72 hours; // 72 hours maximum holding time
    
    // Fee parameters
    uint256 public snipeFeePercentage = 50; // 0.5% fee on snipe amount
    uint256 public profitFeePercentage = 500; // 5% fee on profit
    address public feeReceiver;
    
    // Slippage control
    uint256 public maxSlippage = 500; // 5% max slippage
    
    // MEV protection
    uint256 public blockDeadline = 3; // Number of blocks for transaction to be valid
    
    // Trading state
    struct Trade {
        address token;
        uint256 buyTimestamp;
        uint256 buyPrice;
        uint256 amountBought;
        bool active;
        uint256 highestPrice;
        uint256 investedMatic;
    }
    
    mapping(address => Trade[]) public userTrades;
    mapping(address => uint256) public userTradeCount;  // Gas optimization for querying
    mapping(address => bool) public knownScams;
    mapping(bytes32 => bool) public processedTransactions; // Anti front-running
    
    address public owner;
    bool private locked; // Reentrancy guard state
    
    // Honeypot detection flags
    bytes4[] public suspiciousSelectors = [
        bytes4(keccak256("setMaxTxAmount(uint256)")),
        bytes4(keccak256("setFeeExempt(address,bool)")),
        bytes4(keccak256("blacklist(address)")),
        bytes4(keccak256("blacklistAddress(address)")),
        bytes4(keccak256("setTradingEnabled(bool)")),
        bytes4(keccak256("setMaxWallet(uint256)"))
    ];
    
    // Events
    event TokenSniped(address indexed user, address indexed token, uint256 amount, uint256 buyPrice, uint256 fee);
    event TokenSold(address indexed user, address indexed token, uint256 amount, uint256 sellPrice, uint256 profit, uint256 fee, string reason);
    event ScamDetected(address indexed token, string reason);
    event TradeParametersUpdated(string paramName, uint256 newValue);
    event FeeUpdated(string feeType, uint256 newValue);
    event FeeReceiverUpdated(address newReceiver);
    
    constructor() ReentrancyGuard() {
        // Approve max token spending to routers
        IERC20(WMATIC).approve(QUICK_ROUTER, type(uint256).max);
        owner = msg.sender;
        feeReceiver = msg.sender; // Default fee receiver is owner
    }
    
    // Simple modifier to replace Ownable
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    // Anti front-running modifier
    modifier protectAgainstMEV(bytes32 txHash) {
        require(!processedTransactions[txHash], "Transaction already processed");
        require(block.number <= tx.gasprice + blockDeadline, "Transaction expired");
        processedTransactions[txHash] = true;
        _;
    }
    
    receive() external payable {}
    
    /**
     * @dev Start sniping a newly detected token with MEV protection
     * @param tokenAddress Address of the token to snipe
     * @param amount Amount of MATIC to use for sniping
     * @param maxGasPrice Maximum gas price to prevent front-running
     * @param salt Random value to make transaction hash unique
     */
    function snipeToken(
        address tokenAddress, 
        uint256 amount, 
        uint256 maxGasPrice,
        uint256 salt
    ) external payable nonReentrant {
        require(tx.gasprice <= maxGasPrice, "Gas price too high");
        require(amount > 0, "Amount must be greater than 0");
        
        // Calculate required MATIC including fee
        uint256 fee = (amount * snipeFeePercentage) / 10000;
        uint256 totalRequired = amount + fee;
        require(msg.value >= totalRequired, "Insufficient MATIC sent");
        
        // Create unique transaction hash to prevent front-running
        bytes32 txHash = keccak256(abi.encodePacked(
            msg.sender,
            tokenAddress,
            amount,
            salt,
            block.number
        ));
        
        // Anti MEV protection
        protectAgainstMEV(txHash);
        
        // Verify the token meets our criteria
        require(verifyTokenMetrics(tokenAddress), "Token does not meet required metrics");
        require(!isHoneypot(tokenAddress), "Token appears to be a honeypot");
        require(isLiquidityLocked(tokenAddress), "Liquidity is not sufficiently locked");
        
        // Transfer fee to receiver
        if (fee > 0) {
            payable(feeReceiver).transfer(fee);
        }
        
        // Perform the swap with slippage control
        uint256 tokensBought = swapMaticForTokens(tokenAddress, amount);
        uint256 currentPrice = getTokenPrice(tokenAddress);
        
        // Record the trade
        Trade memory newTrade = Trade({
            token: tokenAddress,
            buyTimestamp: block.timestamp,
            buyPrice: currentPrice,
            amountBought: tokensBought,
            active: true,
            highestPrice: currentPrice,
            investedMatic: amount
        });
        
        userTrades[msg.sender].push(newTrade);
        userTradeCount[msg.sender]++;
        
        // Refund excess MATIC
        uint256 refundAmount = msg.value - totalRequired;
        if (refundAmount > 0) {
            payable(msg.sender).transfer(refundAmount);
        }
        
        emit TokenSniped(msg.sender, tokenAddress, tokensBought, currentPrice, fee);
    }
    
    /**
     * @dev Check and potentially exit trades based on our criteria
     * @param userAddress Address of the user whose trades to check
     */
    function checkAndExitTrades(address userAddress) external nonReentrant {
        Trade[] storage trades = userTrades[userAddress];
        uint256 count = userTradeCount[userAddress];
        
        for (uint256 i = 0; i < trades.length; i++) {
            if (!trades[i].active) continue;
            
            uint256 currentPrice = getTokenPrice(trades[i].token);
            
            // Update highest observed price
            if (currentPrice > trades[i].highestPrice) {
                trades[i].highestPrice = currentPrice;
            }
            
            // Check for exit conditions
            string memory exitReason = "";
            bool shouldExit = false;
            
            // Check if we've hit our profit target (1000%)
            if (currentPrice >= trades[i].buyPrice * (100 + profitTakePercentage) / 100) {
                exitReason = "Profit target reached";
                shouldExit = true;
            }
            // Check for stop loss (15% drop from highest price)
            else if (currentPrice <= trades[i].highestPrice * (100 - stopLossPercentage) / 100) {
                exitReason = "Stop loss triggered";
                shouldExit = true;
            }
            // Check if max holding time elapsed (72 hours)
            else if (block.timestamp >= trades[i].buyTimestamp + maxHoldingTime) {
                exitReason = "Maximum holding time reached";
                shouldExit = true;
            }
            
            if (shouldExit) {
                // Execute the trade exit
                _exitTrade(userAddress, i, currentPrice, exitReason);
                userTradeCount[userAddress]--;
            }
        }
    }
    
    /**
     * @dev Exit a specific trade (internal function to reduce gas costs)
     */
    function _exitTrade(
        address userAddress, 
        uint256 tradeIndex, 
        uint256 currentPrice, 
        string memory exitReason
    ) internal {
        Trade storage trade = userTrades[userAddress][tradeIndex];
        
        // Sell the tokens
        uint256 tokensToSell = IERC20(trade.token).balanceOf(address(this));
        uint256 maticReceived = swapTokensForMatic(trade.token, tokensToSell);
        
        // Calculate profit
        uint256 profit = 0;
        if (maticReceived > trade.investedMatic) {
            profit = maticReceived - trade.investedMatic;
        }
        
        // Calculate profit fee if there's profit
        uint256 fee = 0;
        if (profit > 0) {
            fee = (profit * profitFeePercentage) / 10000;
            if (fee > 0) {
                payable(feeReceiver).transfer(fee);
                maticReceived -= fee;
            }
        }
        
        // Mark trade as inactive
        trade.active = false;
        
        // Send MATIC back to user
        if (maticReceived > 0) {
            payable(userAddress).transfer(maticReceived);
        }
        
        emit TokenSold(
            userAddress, 
            trade.token, 
            tokensToSell, 
            currentPrice, 
            profit, 
            fee, 
            exitReason
        );
    }
    
    /**
     * @dev Force exit a specific trade (for emergencies or user manual exit)
     */
    function forceExitTrade(uint256 tradeIndex) external nonReentrant {
        require(tradeIndex < userTrades[msg.sender].length, "Invalid trade index");
        require(userTrades[msg.sender][tradeIndex].active, "Trade not active");
        
        uint256 currentPrice = getTokenPrice(userTrades[msg.sender][tradeIndex].token);
        _exitTrade(msg.sender, tradeIndex, currentPrice, "Manual exit");
        userTradeCount[msg.sender]--;
    }
    
    /**
     * @dev Verify token metrics meet our criteria
     * @param tokenAddress Address of the token to verify
     * @return bool True if token meets criteria
     */
    function verifyTokenMetrics(address tokenAddress) public view returns (bool) {
        IERC20 token = IERC20(tokenAddress);
        
        // Check total supply
        uint256 totalSupply;
        try token.totalSupply() returns (uint256 supply) {
            totalSupply = supply;
        } catch {
            return false; // Invalid token contract
        }
        
        if (totalSupply > maxTotalSupply) {
            return false; // Supply exceeds our maximum
        }
        
        // Check token price
        uint256 tokenPrice = getTokenPrice(tokenAddress);
        if (tokenPrice < minTokenPrice) {
            return false; // Price too low
        }
        
        // Check if trading is enabled (not paused)
        if (!isTokenTradeable(tokenAddress)) {
            return false; // Trading not enabled
        }
        
        return true;
    }
    
    /**
     * @dev Check if token trading is enabled
     * @param tokenAddress Address of the token to check
     * @return bool True if token is tradeable
     */
    function isTokenTradeable(address tokenAddress) public view returns (bool) {
        address pairAddress = IQuickSwapFactory(QUICK_FACTORY).getPair(tokenAddress, WMATIC);
        if (pairAddress == address(0)) {
            return false; // No liquidity pair exists
        }
        
        // Try a test swap query to see if it would succeed
        address[] memory path = new address[](2);
        path[0] = WMATIC;
        path[1] = tokenAddress;
        
        try IQuickSwapRouter(QUICK_ROUTER).getAmountsOut(10**15, path) returns (uint256[] memory) {
            return true; // Test query succeeded
        } catch {
            return false; // Test query failed, trading likely disabled
        }
    }
    
    /**
     * @dev Enhanced honeypot detection
     * @param tokenAddress Address of the token to check
     * @return bool True if token appears to be a honeypot
     */
    function isHoneypot(address tokenAddress) public view returns (bool) {
        // Check for known scams
        if (knownScams[tokenAddress]) {
            return true;
        }
        
        // Check for excessive fees
        if (hasExcessiveFees(tokenAddress)) {
            return true;
        }
        
        // Check for blacklist functions
        if (hasBlacklistFunction(tokenAddress)) {
            return true;
        }
        
        return false;
    }
    
    /**
     * @dev Check if token has excessive transfer fees
     * @param tokenAddress Address of the token to check
     * @return bool True if token has excessive fees
     */
    function hasExcessiveFees(address tokenAddress) internal view returns (bool) {
        // Get pair and reserves
        address pairAddress = IQuickSwapFactory(QUICK_FACTORY).getPair(tokenAddress, WMATIC);
        if (pairAddress == address(0)) return false;
        
        IQuickSwapPair pair = IQuickSwapPair(pairAddress);
        (uint112 reserve0, uint112 reserve1, ) = pair.getReserves();
        
        // Get token indices
        address token0 = pair.token0();
        
        uint112 tokenReserve = token0 == tokenAddress ? reserve0 : reserve1;
        uint112 maticReserve = token0 == tokenAddress ? reserve1 : reserve0;
        
        // Calculate expected output for a small swap
        uint256 amountIn = 10**15; // 0.001 MATIC
        uint256 amountOutExpected = (amountIn * tokenReserve) / maticReserve;
        
        // Calculate effective fee by comparing expected vs actual
        address[] memory path = new address[](2);
        path[0] = WMATIC;
        path[1] = tokenAddress;
        
        uint256 amountOutActual;
        try IQuickSwapRouter(QUICK_ROUTER).getAmountsOut(amountIn, path) returns (uint256[] memory amounts) {
            amountOutActual = amounts[1];
        } catch {
            return true; // Failed, likely restricted
        }
        
        // If actual output is less than 85% of expected, fees are excessive
        return amountOutActual < (amountOutExpected * 85 / 100);
    }
    
    /**
     * @dev Check if token has blacklist functions by examining its code
     * @param tokenAddress Address of the token to check
     * @return bool True if token has suspicious functions
     */
    function hasBlacklistFunction(address tokenAddress) internal view returns (bool) {
        // Get contract bytecode
        bytes memory bytecode;
        assembly {
            // retrieve the size of the code
            let size := extcodesize(tokenAddress)
            // allocate output byte array
            bytecode := mload(0x40)
            // new "memory end" including padding
            mstore(0x40, add(bytecode, and(add(add(size, 0x20), 0x1f), not(0x1f))))
            // store length in memory
            mstore(bytecode, size)
            // actually retrieve the code
            extcodecopy(tokenAddress, add(bytecode, 0x20), 0, size)
        }
        
        // Check for suspicious function signatures
        for (uint i = 0; i < suspiciousSelectors.length; i++) {
            bytes4 selector = suspiciousSelectors[i];
            bytes memory selectorBytes = abi.encodePacked(selector);
            
            bool found = false;
            for (uint j = 0; j < bytecode.length - 4; j++) {
                if (bytecode[j] == selectorBytes[0] && 
                    bytecode[j+1] == selectorBytes[1] && 
                    bytecode[j+2] == selectorBytes[2] && 
                    bytecode[j+3] == selectorBytes[3]) {
                    found = true;
                    break;
                }
            }
            
            if (found) {
                return true;
            }
        }

        return false;
    }
    
    /**
     * @dev Check if sufficient liquidity is locked
     * @param tokenAddress Address of the token to check
     * @return bool True if sufficient liquidity is locked
     */
    function isLiquidityLocked(address tokenAddress) public view returns (bool) {
        // Get pair address
        address pairAddress = IQuickSwapFactory(QUICK_FACTORY).getPair(tokenAddress, WMATIC);
        if (pairAddress == address(0)) {
            return false; // No pair exists
        }
        
        // Check liquidity amount
        IQuickSwapPair pair = IQuickSwapPair(pairAddress);
        uint256 totalLiquidity = pair.totalSupply();
        
        // Check common lockers
        uint256 lockedAmount = 0;
        uint256 lockEndTime = 0;
        
        // Check TeamFinance locker
        try ILiquidityLocker(TEAM_FINANCE).lockInfos(pairAddress, address(0)) returns (uint256 amount, uint256 unlockTime) {
            lockedAmount += amount;
            if (unlockTime > lockEndTime) {
                lockEndTime = unlockTime;
            }
        } catch {}
        
        // Check Unicrypt locker
        try ILiquidityLocker(UNICRYPT).lockInfos(pairAddress, address(0)) returns (uint256 amount, uint256 unlockTime) {
            lockedAmount += amount;
            if (unlockTime > lockEndTime) {
                lockEndTime = unlockTime;
            }
        } catch {}
        
        // Check if enough liquidity is locked
        uint256 lockPercentage = (lockedAmount * 100) / totalLiquidity;
        if (lockPercentage < minLiquidityPercentage) {
            return false; // Not enough liquidity locked
        }
        
        // Check if locked for long enough
        if (lockEndTime < block.timestamp + (minLiquidityLockDays * 1 days)) {
            return false; // Not locked for long enough
        }
        
        return true;
    }
    
    /**
     * @dev Swap MATIC for tokens with slippage protection
     * @param tokenAddress Address of the token to buy
     * @param amount Amount of MATIC to swap
     * @return uint256 Amount of tokens bought
     */
    function swapMaticForTokens(address tokenAddress, uint256 amount) internal returns (uint256) {
        address[] memory path = new address[](2);
        path[0] = WMATIC;
        path[1] = tokenAddress;
        
        // Calculate minimum amount of tokens to receive (with slippage protection)
        uint256[] memory expectedAmounts = IQuickSwapRouter(QUICK_ROUTER).getAmountsOut(amount, path);
        uint256 minOutput = expectedAmounts[1] * (10000 - maxSlippage) / 10000;
        
        uint256[] memory amounts = IQuickSwapRouter(QUICK_ROUTER).swapExactMATICForTokens{value: amount}(
            minOutput, // 5% slippage protection
            path,
            address(this),
            block.timestamp + 300 // 5 minute deadline
        );
        
        return amounts[1];
    }
    
    /**
     * @dev Swap tokens for MATIC with slippage protection
     * @param tokenAddress Address of the token to sell
     * @param amount Amount of tokens to swap
     * @return uint256 Amount of MATIC received
     */
    function swapTokensForMatic(address tokenAddress, uint256 amount) internal returns (uint256) {
        // Approve the router to spend tokens
        IERC20(tokenAddress).approve(QUICK_ROUTER, amount);
        
        address[] memory path = new address[](2);
        path[0] = tokenAddress;
        path[1] = WMATIC;
        
        // Calculate minimum amount of MATIC to receive (with slippage protection)
        uint256[] memory expectedAmounts = IQuickSwapRouter(QUICK_ROUTER).getAmountsOut(amount, path);
        uint256 minOutput = expectedAmounts[1] * (10000 - maxSlippage) / 10000;
        
        uint256 maticBefore = address(this).balance;
        
        IQuickSwapRouter(QUICK_ROUTER).swapExactTokensForMATIC(
            amount,
            minOutput, // 5% slippage protection
            path,
            address(this),
            block.timestamp + 300 // 5 minute deadline
        );
        
        return address(this).balance - maticBefore;
    }
    
    /**
     * @dev Get current token price in MATIC
     * @param tokenAddress Address of the token to check
     * @return uint256 Current token price
     */
    function getTokenPrice(address tokenAddress) public view returns (uint256) {
        address[] memory path = new address[](2);
        path[0] = tokenAddress;
        path[1] = WMATIC;
        
        uint256[] memory amounts = IQuickSwapRouter(QUICK_ROUTER).getAmountsOut(10**18, path);
        return amounts[1]; // Price of 1 token in MATIC
    }
    
    /**
     * @dev Add a token to the known scams list
     * @param tokenAddress Address of the token to mark as scam
     * @param reason Reason for marking as scam
     */
    function markAsScam(address tokenAddress, string calldata reason) external onlyOwner {
        knownScams[tokenAddress] = true;
        emit ScamDetected(tokenAddress, reason);
    }
    
    /**
     * @dev Add suspicious function selectors to check for
     */
    function addSuspiciousSelectors(bytes4[] calldata selectors) external onlyOwner {
        for (uint i = 0; i < selectors.length; i++) {
            suspiciousSelectors.push(selectors[i]);
        }
    }
    
    /**
     * @dev Update trading parameters
     * @param _minLiquidityLockDays Minimum days liquidity should be locked
     * @param _minLiquidityPercentage Minimum percentage of liquidity locked
     * @param _maxTotalSupply Maximum total supply allowed
     * @param _minTokenPrice Minimum token price allowed
     * @param _profitTakePercentage Percentage gain at which to take profits
     * @param _stopLossPercentage Percentage drop at which to cut losses
     * @param _maxHoldingTime Maximum time to hold tokens in seconds
     */
    function updateTradingParameters(
        uint256 _minLiquidityLockDays,
        uint256 _minLiquidityPercentage,
        uint256 _maxTotalSupply,
        uint256 _minTokenPrice,
        uint256 _profitTakePercentage,
        uint256 _stopLossPercentage,
        uint256 _maxHoldingTime
    ) external onlyOwner {
        minLiquidityLockDays = _minLiquidityLockDays;
        minLiquidityPercentage = _minLiquidityPercentage;
        maxTotalSupply = _maxTotalSupply;
        minTokenPrice = _minTokenPrice;
        profitTakePercentage = _profitTakePercentage;
        stopLossPercentage = _stopLossPercentage;
        maxHoldingTime = _maxHoldingTime;
        
        emit TradeParametersUpdated("Parameters", block.timestamp);
    }
    
    /**
     * @dev Update fee parameters
     * @param _snipeFeePercentage Fee percentage for sniping (in basis points, 1% = 100)
     * @param _profitFeePercentage Fee percentage on profits (in basis points, 1% = 100)
     * @param _feeReceiver Address to receive fees
     */
    function updateFeeParameters(
        uint256 _snipeFeePercentage,
        uint256 _profitFeePercentage,
        address _feeReceiver
    ) external onlyOwner {
        require(_snipeFeePercentage <= 1000, "Snipe fee too high"); // Max 10%
        require(_profitFeePercentage <= 2000, "Profit fee too high"); // Max 20%
        require(_feeReceiver != address(0), "Invalid fee receiver");
        
        snipeFeePercentage = _snipeFeePercentage;
        profitFeePercentage = _profitFeePercentage;
        feeReceiver = _feeReceiver;
        
        emit FeeUpdated("SnipeFee", _snipeFeePercentage);
        emit FeeUpdated("ProfitFee", _profitFeePercentage);
        emit FeeReceiverUpdated(_feeReceiver);
    }
    
    /**
     * @dev Update slippage parameters
     * @param _maxSlippage Maximum slippage allowed (in basis points, 1% = 100)
     */
    function updateSlippageParameters(uint256 _maxSlippage) external onlyOwner {
        require(_maxSlippage <= 3000, "Slippage too high"); // Max 30%
        maxSlippage = _maxSlippage;
        emit TradeParametersUpdated("Slippage", _maxSlippage);
    }
    
    /**
     * @dev Update MEV protection parameters
     * @param _blockDeadline Number of blocks after which transaction is invalid
     */
    function updateMEVProtection(uint256 _blockDeadline) external onlyOwner {
        blockDeadline = _blockDeadline;
        emit TradeParametersUpdated("MEV Protection", _blockDeadline);
    }
    
    /**
     * @dev Emergency withdrawal of funds
     * @param tokenAddress Address of token to withdraw (or zero address for MATIC)
     */
    function emergencyWithdraw(address tokenAddress) external onlyOwner {
        if (tokenAddress == address(0)) {
            payable(owner).transfer(address(this).balance);
        } else {
            IERC20 token = IERC20(tokenAddress);
            token.transfer(owner, token.balanceOf(address(this)));
        }
    }
    
    /**
     * @dev Transfer ownership of the contract
     * @param newOwner Address of the new owner
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid new owner");
        owner = newOwner;
    }
    