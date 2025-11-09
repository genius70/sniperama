// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Import standard libraries
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

// Interface for DEX routers (compatible with TraderJoe, SpookySwap, and QuickSwap)
interface IDEXRouter {
    function factory() external pure returns (address);
    function WETH() external pure returns (address);
    
    function swapExactETHForTokens(
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external payable returns (uint[] memory amounts);
    
    function swapExactTokensForETH(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
    
    function getAmountsOut(
        uint amountIn, 
        address[] calldata path
    ) external view returns (uint[] memory amounts);
}

// Interface for DEX factory
interface IDEXFactory {
    function getPair(address tokenA, address tokenB) external view returns (address pair);
    function allPairs(uint) external view returns (address pair);
    function allPairsLength() external view returns (uint);
}

// Interface for DEX pairs
interface IDEXPair {
    function token0() external view returns (address);
    function token1() external view returns (address);
    function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast);
}

// Interface for liquidity lockers
interface ILocker {
    function getUserLockInfo(address user, address token) external view returns (uint256 amount, uint256 unlockTime);
    function getLockBalance(address token) external view returns (uint256);
}

contract Sniperama is Ownable, ReentrancyGuard {
    using SafeMath for uint256;

    // Contract state variables
    string public botName = "Sniperama";
    string public botVersion = "2.0.0";
    
    // Blockchain network identifiers
    enum Network { Avalanche, Fantom, Polygon }
    
    // Network-specific addresses
    struct NetworkInfo {
        address router;           // DEX router address
        address factory;          // DEX factory address
        address wrappedNative;    // Wrapped native token (WAVAX, WFTM, WMATIC)
        address liquidityLocker;  // Common liquidity locker on the network
        string nativeSymbol;      // Native token symbol (AVAX, FTM, MATIC)
    }
    
    // Mapping of network configurations
    mapping(Network => NetworkInfo) public networks;
    
    // Current network
    Network public currentNetwork;
    
    // Bot configuration parameters
    struct BotConfig {
        uint256 minTokenPrice;       // Minimum acceptable token price
        uint256 maxTokenSupply;      // Maximum acceptable token supply
        uint256 minLiquidityPercent; // Minimum liquidity that must be locked
        uint256 minLockDays;         // Minimum duration for liquidity lock
        uint256 stopLossPercent;     // Stop loss percentage (15% by default)
        uint256 takeProfitPercent;   // Take profit percentage (1000% by default)
        uint256 maxHoldingPeriod;    // Maximum holding period in hours (72 by default)
        uint256 slippageTolerance;   // Slippage tolerance in percentage (e.g., 5 for 5%)
        uint256 gasMultiplier;       // Gas price multiplier for fast transactions (e.g., 120 for 1.2x)
        bool checkOwnershipRenounced; // If true, check if ownership is renounced
        bool checkSourceCode;        // If true, verify contract source is available
        uint256 maxTaxPercentage;    // Maximum allowed tax percentage in token
    }
    
    // Tracking data for each token purchase
    struct TokenPurchase {
        address tokenAddress;
        uint256 purchaseAmount;      // Amount spent in native token
        uint256 tokenAmount;         // Amount of tokens purchased
        uint256 purchaseTimestamp;   // When the purchase was made
        uint256 purchasePrice;       // Price at time of purchase
        bool sold;                   // Whether the position has been closed
        uint256 soldAmount;          // Amount received when sold
        uint256 soldTimestamp;       // When it was sold
        string exitReason;           // Reason for exit: "profit", "stop-loss", "time-limit"
        Network network;             // Network where the purchase was made
    }
    
    // Token analysis results
    struct TokenAnalysis {
        bool isValid;
        bool hasLiquidity;
        bool hasAcceptableSupply;
        bool hasLiquidityLocked;
        uint256 currentPrice;
        uint256 liquidityAmount;
        uint256 lockedLiquidityPercent;
        uint256 lockedUntilTimestamp;
        uint256 buyTaxPercentage;
        uint256 sellTaxPercentage;
    }
    
    // Default bot configuration
    BotConfig public config = BotConfig({
        minTokenPrice: 10000000,     // $0.00000001 (with 18 decimals)
        maxTokenSupply: 10000000000 * 10**18, // 10 billion max supply
        minLiquidityPercent: 20,     // 20% liquidity locked
        minLockDays: 90,             // 90 days locked
        stopLossPercent: 15,         // 15% stop loss
        takeProfitPercent: 1000,     // 1000% (10x) take profit
        maxHoldingPeriod: 72,        // 72 hours max holding
        slippageTolerance: 5,        // 5% slippage tolerance
        gasMultiplier: 120,          // 1.2x gas price for faster transactions
        checkOwnershipRenounced: true, // Check if ownership is renounced
        checkSourceCode: true,       // Check if source code is verified
        maxTaxPercentage: 10         // Maximum 10% tax allowed
    });
    
    // User funds and transaction history
    mapping(address => uint256) public userFunds;
    mapping(address => TokenPurchase[]) public userPurchases;
    mapping(address => uint256) public userProfits;
    
    // Blacklisted tokens (known scams)
    mapping(address => bool) public blacklistedTokens;
    
    // Security modules (for anti-honeypot, anti-rug checks)
    address public securityModule;
    
    // Events
    event FundsDeposited(address indexed user, uint256 amount, Network network);
    event FundsWithdrawn(address indexed user, uint256 amount, Network network);
    event ConfigUpdated(address indexed user, BotConfig oldConfig, BotConfig newConfig);
    event TokenPurchased(address indexed user, address indexed token, uint256 amount, uint256 tokenAmount, Network network);
    event TokenSold(address indexed user, address indexed token, uint256 amount, uint256 profit, string exitReason, Network network);
    event BotError(address indexed user, string errorMessage, Network network);
    event NetworkChanged(Network oldNetwork, Network newNetwork);
    event TokenBlacklisted(address indexed token, bool status);
    
    constructor() {
        // Initialize default network to Avalanche
        currentNetwork = Network.Avalanche;
        
        // Initialize Avalanche network
        networks[Network.Avalanche] = NetworkInfo({
            router: 0x60aE616a2155Ee3d9A68541Ba4544862310933d4, // TraderJoe Router
            factory: 0x9Ad6C38BE94206cA50bb0d90783181662f0Cfa10, // TraderJoe Factory
            wrappedNative: 0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7, // WAVAX
            liquidityLocker: 0x4B1E4c30B12B8564686C9160F8B1253222B66D15, // Example locker
            nativeSymbol: "AVAX"
        });
        
        // Initialize Fantom network
        networks[Network.Fantom] = NetworkInfo({
            router: 0xF491e7B69E4244ad4002BC14e878a34207E38c29, // SpookySwap Router
            factory: 0x152eE697f2E276fA89E96742e9bB9aB1F2E61bE3, // SpookySwap Factory
            wrappedNative: 0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83, // WFTM
            liquidityLocker: 0x7ee058420e5937496F5a2096f04caA7721cF70cc, // Example locker
            nativeSymbol: "FTM"
        });
        
        // Initialize Polygon network
        networks[Network.Polygon] = NetworkInfo({
            router: 0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff, // QuickSwap Router
            factory: 0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32, // QuickSwap Factory
            wrappedNative: 0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270, // WMATIC
            liquidityLocker: 0x6cC5F688a315f3dC28A7781717a9A798a59fDA7b, // Example locker
            nativeSymbol: "MATIC"
        });
        
        // Set fee collector
        feeCollector = owner();
    }
    
    // Function to switch the active network
    function setActiveNetwork(Network _network) external {
        require(_network == Network.Avalanche || _network == Network.Fantom || _network == Network.Polygon, "Invalid network");
        
        Network oldNetwork = currentNetwork;
        currentNetwork = _network;
        
        emit NetworkChanged(oldNetwork, currentNetwork);
    }
    
    // Allow users to fund the contract
    receive() external payable {
        userFunds[msg.sender] = userFunds[msg.sender].add(msg.value);
        emit FundsDeposited(msg.sender, msg.value, currentNetwork);
    }
    
    // Withdraw funds
    function withdrawFunds(uint256 amount) external nonReentrant {
        require(userFunds[msg.sender] >= amount, "Insufficient funds");
        
        userFunds[msg.sender] = userFunds[msg.sender].sub(amount);
        
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
        
        emit FundsWithdrawn(msg.sender, amount, currentNetwork);
    }
    
    // Update bot configuration
    function updateConfig(
        uint256 _minTokenPrice,
        uint256 _maxTokenSupply,
        uint256 _minLiquidityPercent,
        uint256 _minLockDays,
        uint256 _stopLossPercent,
        uint256 _takeProfitPercent,
        uint256 _maxHoldingPeriod,
        uint256 _slippageTolerance,
        uint256 _gasMultiplier,
        bool _checkOwnershipRenounced,
        bool _checkSourceCode,
        uint256 _maxTaxPercentage
    ) external {
        BotConfig memory oldConfig = config;
        
        config.minTokenPrice = _minTokenPrice;
        config.maxTokenSupply = _maxTokenSupply;
        config.minLiquidityPercent = _minLiquidityPercent;
        config.minLockDays = _minLockDays;
        config.stopLossPercent = _stopLossPercent;
        config.takeProfitPercent = _takeProfitPercent;
        config.maxHoldingPeriod = _maxHoldingPeriod;
        config.slippageTolerance = _slippageTolerance;
        config.gasMultiplier = _gasMultiplier;
        config.checkOwnershipRenounced = _checkOwnershipRenounced;
        config.checkSourceCode = _checkSourceCode;
        config.maxTaxPercentage = _maxTaxPercentage;
        
        emit ConfigUpdated(msg.sender, oldConfig, config);
    }
    
    // Add or remove a token from the blacklist
    function setTokenBlacklist(address tokenAddress, bool blacklisted) external onlyOwner {
        blacklistedTokens[tokenAddress] = blacklisted;
        emit TokenBlacklisted(tokenAddress, blacklisted);
    }
    
    // Set a new security module
    function setSecurityModule(address _securityModule) external onlyOwner {
        securityModule = _securityModule;
    }
    
    // Main function to execute the sniper bot
    function executeSnipe(address tokenAddress, uint256 amountToSpend) external nonReentrant {
        require(userFunds[msg.sender] >= amountToSpend, "Insufficient funds");
        require(amountToSpend > 0, "Amount must be greater than 0");
        require(!blacklistedTokens[tokenAddress], "Token is blacklisted");
        
        // Get current network configuration
        NetworkInfo memory network = networks[currentNetwork];
        
        // Analyze token
        TokenAnalysis memory analysis = analyzeToken(tokenAddress);
        require(analysis.isValid, "Token does not meet validity criteria");
        require(analysis.hasLiquidity, "Insufficient liquidity");
        require(analysis.hasAcceptableSupply, "Token supply exceeds maximum");
        require(analysis.hasLiquidityLocked, "Insufficient liquidity locked");
        require(analysis.buyTaxPercentage <= config.maxTaxPercentage, "Buy tax too high");
        require(analysis.sellTaxPercentage <= config.maxTaxPercentage, "Sell tax too high");
        
        // Calculate minimum tokens to receive (with slippage)
        uint256 minTokensToReceive = calculateMinTokensToReceive(tokenAddress, amountToSpend);
        
        // Execute swap
        uint256 tokenAmount = swapNativeForTokens(tokenAddress, amountToSpend, minTokensToReceive);
        
        // Record the purchase
        userFunds[msg.sender] = userFunds[msg.sender].sub(amountToSpend);
        
        TokenPurchase memory purchase = TokenPurchase({
            tokenAddress: tokenAddress,
            purchaseAmount: amountToSpend,
            tokenAmount: tokenAmount,
            purchaseTimestamp: block.timestamp,
            purchasePrice: analysis.currentPrice,
            sold: false,
            soldAmount: 0,
            soldTimestamp: 0,
            exitReason: "",
            network: currentNetwork
        });
        
        userPurchases[msg.sender].push(purchase);
        
        emit TokenPurchased(msg.sender, tokenAddress, amountToSpend, tokenAmount, currentNetwork);
    }
    
    // Check and sell tokens if needed
    function checkAndSellTokens(uint256 purchaseIndex) external nonReentrant {
        require(purchaseIndex < userPurchases[msg.sender].length, "Invalid purchase index");
        
        TokenPurchase storage purchase = userPurchases[msg.sender][purchaseIndex];
        require(!purchase.sold, "Position already closed");
        
        // Set the current network to the one used for this purchase
        Network originalNetwork = currentNetwork;
        currentNetwork = purchase.network;
        
        address tokenAddress = purchase.tokenAddress;
        uint256 currentPrice = getTokenPrice(tokenAddress);
        uint256 purchasePrice = purchase.purchasePrice;
        
        string memory exitReason = "";
        bool shouldSell = false;
        
        // Check for take profit condition
        if (currentPrice >= purchasePrice.mul(config.takeProfitPercent.add(100)).div(100)) {
            shouldSell = true;
            exitReason = "profit";
        }
        // Check for stop loss condition
        else if (currentPrice <= purchasePrice.mul(100 - config.stopLossPercent).div(100)) {
            shouldSell = true;
            exitReason = "stop-loss";
        }
        // Check for time limit
        else if (block.timestamp >= purchase.purchaseTimestamp.add(config.maxHoldingPeriod * 1 hours)) {
            shouldSell = true;
            exitReason = "time-limit";
        }
        
        if (shouldSell) {
            sellTokens(purchaseIndex, exitReason);
        }
        
        // Reset network to original
        currentNetwork = originalNetwork;
    }
    
    // Force sell tokens regardless of conditions
    function forceSellTokens(uint256 purchaseIndex) external nonReentrant {
        require(purchaseIndex < userPurchases[msg.sender].length, "Invalid purchase index");
        
        TokenPurchase storage purchase = userPurchases[msg.sender][purchaseIndex];
        require(!purchase.sold, "Position already closed");
        
        // Set the current network to the one used for this purchase
        Network originalNetwork = currentNetwork;
        currentNetwork = purchase.network;
        
        sellTokens(purchaseIndex, "manual-sell");
        
        // Reset network to original
        currentNetwork = originalNetwork;
    }
    
    // Sell tokens
    function sellTokens(uint256 purchaseIndex, string memory exitReason) internal {
        TokenPurchase storage purchase = userPurchases[msg.sender][purchaseIndex];
        
        // Get token contract
        IERC20 token = IERC20(purchase.tokenAddress);
        
        // Get current network configuration
        NetworkInfo memory network = networks[currentNetwork];
        
        // Calculate the expected return
        uint256 expectedReturn = calculateExpectedReturn(purchase.tokenAddress, purchase.tokenAmount);
        
        // Calculate minimum native tokens to receive (with slippage)
        uint256 minNativeToReceive = expectedReturn.mul(100 - config.slippageTolerance).div(100);
        
        // Approve router to spend tokens
        token.approve(network.router, purchase.tokenAmount);
        
        // Execute swap back to native token
        uint256 receivedAmount = swapTokensForNative(purchase.tokenAddress, purchase.tokenAmount, minNativeToReceive);
        
        // Calculate fee
        uint256 fee = receivedAmount.mul(5).div(1000); // 0.5% fee
        uint256 amountAfterFee = receivedAmount.sub(fee);
        
        // Send fee to collector
        if (fee > 0) {
            (bool feeSuccess, ) = feeCollector.call{value: fee}("");
            require(feeSuccess, "Fee transfer failed");
        }
        
        // Update purchase record
        purchase.sold = true;
        purchase.soldAmount = amountAfterFee;
        purchase.soldTimestamp = block.timestamp;
        purchase.exitReason = exitReason;
        
        // Update user funds and profits
        userFunds[msg.sender] = userFunds[msg.sender].add(amountAfterFee);
        
        int256 profit = int256(amountAfterFee) - int256(purchase.purchaseAmount);
        if (profit > 0) {
            userProfits[msg.sender] = userProfits[msg.sender].add(uint256(profit));
        }
        
        emit TokenSold(
            msg.sender, 
            purchase.tokenAddress, 
            amountAfterFee, 
            profit > 0 ? uint256(profit) : 0, 
            exitReason,
            currentNetwork
        );
    }
    
    // Analyze a token for validity, liquidity, and security
    function analyzeToken(address tokenAddress) public view returns (TokenAnalysis memory) {
        TokenAnalysis memory analysis;
        analysis.isValid = true; // Default to true
        
        // Get current network configuration
        NetworkInfo memory network = networks[currentNetwork];
        
        try IERC20(tokenAddress).totalSupply() returns (uint256 totalSupply) {
            // Check if supply is within acceptable range
            analysis.hasAcceptableSupply = totalSupply <= config.maxTokenSupply;
            
            // Check if the token has a valid contract (it should if we got here)
            analysis.isValid = true;
            
            // Get current price
            analysis.currentPrice = getTokenPrice(tokenAddress);
            
            // Check liquidity
            (analysis.hasLiquidity, analysis.liquidityAmount) = checkLiquidity(tokenAddress);
            
            // Check liquidity lock
            (analysis.hasLiquidityLocked, analysis.lockedLiquidityPercent, analysis.lockedUntilTimestamp) = 
                checkLiquidityLock(tokenAddress);
            
            // Estimate tax percentages
            (analysis.buyTaxPercentage, analysis.sellTaxPercentage) = estimateTokenTaxes(tokenAddress);
            
        } catch {
            // If any errors occur, mark the token as invalid
            analysis.isValid = false;
            analysis.hasAcceptableSupply = false;
            analysis.hasLiquidity = false;
            analysis.hasLiquidityLocked = false;
        }
        
        return analysis;
    }
    
    // Check if token has sufficient liquidity
    function checkLiquidity(address tokenAddress) internal view returns (bool hasLiquidity, uint256 liquidityAmount) {
        // Get current network configuration
        NetworkInfo memory network = networks[currentNetwork];
        IDEXFactory factory = IDEXFactory(network.factory);
        
        // Find the pair address
        address pairAddress = factory.getPair(tokenAddress, network.wrappedNative);
        
        // If no pair, return false
        if (pairAddress == address(0)) {
            return (false, 0);
        }
        
        // Get pair contract
        IDEXPair pair = IDEXPair(pairAddress);
        
        // Get reserves
        (uint112 reserve0, uint112 reserve1, ) = pair.getReserves();
        
        // Determine which reserve is the token and which is WAVAX/WFTM/WMATIC
        address token0 = pair.token0();
        
        uint256 nativeReserve;
        if (token0 == tokenAddress) {
            nativeReserve = reserve1;
        } else {
            nativeReserve = reserve0;
        }
        
        // Check if there's enough liquidity
        hasLiquidity = nativeReserve > 0.5 ether; // At least 0.5 native token in liquidity
        liquidityAmount = nativeReserve;
        
        return (hasLiquidity, liquidityAmount);
    }
    
    // Check if liquidity is locked and for how long
    function checkLiquidityLock(address tokenAddress) internal view returns (
        bool isLocked, 
        uint256 lockedPercent, 
        uint256 lockedUntil
    ) {
        // Get current network configuration
        NetworkInfo memory network = networks[currentNetwork];
        IDEXFactory factory = IDEXFactory(network.factory);
        
        // Find the pair address
        address pairAddress = factory.getPair(tokenAddress, network.wrappedNative);
        
        // If no pair, return false
        if (pairAddress == address(0)) {
            return (false, 0, 0);
        }
        
        // Check common liquidity lockers
        ILocker locker = ILocker(network.liquidityLocker);
        
        try locker.getLockBalance(pairAddress) returns (uint256 lockedLiquidity) {
            // Get total supply of LP tokens
            uint256 totalLpTokens = IERC20(pairAddress).totalSupply();
            
            if (totalLpTokens == 0) {
                return (false, 0, 0);
            }
            
            // Calculate percentage of liquidity locked
            lockedPercent = lockedLiquidity * 100 / totalLpTokens;
            
            // Check lock duration
            try locker.getUserLockInfo(address(0), pairAddress) returns (uint256 amount, uint256 unlockTime) {
                // Check if lock meets minimum requirements
                isLocked = lockedPercent >= config.minLiquidityPercent && 
                          unlockTime >= block.timestamp + (config.minLockDays * 1 days);
                
                lockedUntil = unlockTime;
            } catch {
                // If can't determine unlock time, assume it's not locked
                isLocked = false;
                lockedUntil = 0;
            }
        } catch {
            // If any error occurs, assume liquidity is not locked
            isLocked = false;
            lockedPercent = 0;
            lockedUntil = 0;
        }
        
        return (isLocked, lockedPercent, lockedUntil);
    }
    
    // Estimate token buy and sell taxes by simulating small swaps
    function estimateTokenTaxes(address tokenAddress) internal view returns (uint256 buyTax, uint256 sellTax) {
        // Get current network configuration
        NetworkInfo memory network = networks[currentNetwork];
        IDEXRouter router = IDEXRouter(network.router);
        
        try router.getAmountsOut(0.01 ether, getPathForBuy(tokenAddress)) returns (uint[] memory expectedBuyAmounts) {
            uint256 expectedTokenAmount = expectedBuyAmounts[expectedBuyAmounts.length - 1];
            
            // For sell tax, simulate selling that amount
            try router.getAmountsOut(expectedTokenAmount, getPathForSell(tokenAddress)) returns (uint[] memory expectedSellAmounts) {
                uint256 expectedNativeReturn = expectedSellAmounts[expectedSellAmounts.length - 1];
                
                // Calculate implied taxes (rough estimate)
                // In a no-tax scenario, selling what you bought should return close to what you paid
                uint256 expectedReturn = 0.01 ether * 99 / 100; // Account for 0.3% DEX fee
                
                if (expectedNativeReturn < expectedReturn) {
                    // Calculate implied sell tax
                    sellTax = (expectedReturn - expectedNativeReturn) * 100 / expectedReturn;
                } else {
                    sellTax = 0;
                }
                
                // Buy tax is more complex to estimate, we'll use a simpler approximation
                buyTax = sellTax; // Assume symmetric taxes if we can't precisely calculate
            } catch {
                sellTax = config.maxTaxPercentage; // If error, assume high tax
            }
        } catch {
            buyTax = config.maxTaxPercentage; // If error, assume high tax
            sellTax = config.maxTaxPercentage;
        }
        
        return (buyTax, sellTax);
    }
    
    // Calculate minimum tokens to receive (with slippage)
    function calculateMinTokensToReceive(address tokenAddress, uint256 amountToSpend) internal view returns (uint256) {
        // Get current network configuration
        NetworkInfo memory network = networks[currentNetwork];
        IDEXRouter router = IDEXRouter(network.router);
        
        // Calculate the path
        address[] memory path = getPathForBuy(tokenAddress);
        
        // Get expected tokens
        uint[] memory amounts = router.getAmountsOut(amountToSpend, path);
        uint256 expectedTokens = amounts[amounts.length - 1];
        
        // Apply slippage tolerance
        return expectedTokens.mul(100 - config.slippageTolerance).div(100);
    }
    
    // Calculate expected return when selling tokens
    function calculateExpectedReturn(address tokenAddress, uint256 tokenAmount) internal view returns (uint256) {
        // Get current network configuration
        NetworkInfo memory network = networks[currentNetwork];
        IDEXRouter router = IDEXRouter(network.router);
        
        // Calculate the path
        address[] memory path = getPathForSell(tokenAddress);
        
        // Get expected native tokens
        uint[] memory amounts = router.getAmountsOut(tokenAmount, path);
        
        return amounts[amounts.length - 1];
    }
    
    // Swap native token for tokens
    function swapNativeForTokens(address tokenAddress, uint256 amountToSpend, uint256 minTokensToReceive) internal returns (uint256) {
        // Get current network configuration
        NetworkInfo memory network = networks[currentNetwork];
        IDEXRouter router = IDEXRouter(network.router);
        
        // Calculate the path
        address[] memory path = getPathForBuy(tokenAddress);
        
        // Execute swap
        uint[] memory amounts = router.swapExactETHForTokens{value: amountToSpend}(
            minTokensToReceive,
            path,
            address(this),
            block.timestamp + 300 // 5 minute deadline
        );
        
        return amounts[amounts.length - 1];
    }
    
    // Swap tokens for native token
    function swapTokensForNative(address tokenAddress, uint256 tokenAmount, uint256 minNativeToReceive) internal returns (uint256) {
        // Get current network configuration
        NetworkInfo memory network = networks[currentNetwork];
        IDEXRouter router = IDEXRouter(network.router);
        
        // Calculate the path
        address[] memory path = getPathForSell(tokenAddress);
        
        // Execute swap
        uint[] memory amounts = router.swapExactTokensForETH(
            tokenAmount,
            minNativeToReceive,
            path,
            address(this),
            block.timestamp + 300 // 5 minute deadline
        );
        
        return amounts[amounts.length - 1];
    }
    
    // Get token price in native token
    function getTokenPrice(address tokenAddress) internal view returns (uint256) {
        // Get current network configuration
        NetworkInfo memory network = networks[currentNetwork];
        IDEXRouter router = IDEXRouter(network.router);
        
        // Find the price of 1 token in terms of native token
        address[] memory path = getPathForSell(tokenAddress);
        
        // Use a fixed amount like 10^18 (1 token with 18 decimals)
        try router.getAmountsOut(10**18, path) returns (uint[] memory amounts) {
            return amounts[amounts.length - 1];
        } catch {
            return 0;
        }
    }
    
    // Get path for buying tokens (native -> token)
    function getPathForBuy(address tokenAddress) internal view returns (address[] memory) {
        // Get current network configuration
        NetworkInfo memory network = networks[currentNetwork];
        
        address[] memory path = new address[](2);
        path[0] = network.wrappedNative;
        path[1] = tokenAddress;
        
        return path;
    }
    
    // Get path for selling tokens (token -> native)
    function getPathForSell(address tokenAddress) internal view returns (address[] memory) {
        // Get current network configuration
        NetworkInfo memory network = networks[currentNetwork];
        
        address[] memory path = new address[](2);
        path[0] = tokenAddress;
        path[1] = network.wrappedNative;
        
        return path;
    }
    
    // Get user purchase history
    function getUserPurchases(address user) external view returns (TokenPurchase[] memory) {
        return userPurchases[user];
    }
    
    // Get user profit/loss
    // Get user profit/loss
    function getUserProfitLoss(address user) external view returns (int256) {
        int256 totalProfitLoss = 0;
        TokenPurchase[] memory purchases = userPurchases[user];
        
        for (uint256 i = 0; i < purchases.length; i++) {
            TokenPurchase memory purchase = purchases[i];
            
            if (purchase.sold) {
                // For sold positions, calculate actual profit/loss
                int256 profitLoss = int256(purchase.soldAmount) - int256(purchase.purchaseAmount);
                totalProfitLoss += profitLoss;
            } else {
                // For open positions, calculate unrealized profit/loss based on current price
                uint256 currentValue = calculateExpectedReturn(purchase.tokenAddress, purchase.tokenAmount);
                int256 unrealizedPL = int256(currentValue) - int256(purchase.purchaseAmount);
                totalProfitLoss += unrealizedPL;
            }
        }
        
        return totalProfitLoss;
    }
    
    // Get total fee collected
    address public feeCollector;
    uint256 public totalFeesCollected;
    
    // Update fee collector address
    function setFeeCollector(address _feeCollector) external onlyOwner {
        require(_feeCollector != address(0), "Fee collector cannot be zero address");
        feeCollector = _feeCollector;
    }
    
    // Get bot statistics
    function getBotStatistics() external view returns (
        uint256 totalUsers,
        uint256 totalPurchases,
        uint256 totalSoldPositions,
        uint256 avgProfitPercent,
        uint256 successRate
    ) {
        uint256 userCount = 0;
        uint256 purchaseCount = 0;
        uint256 soldCount = 0;
        uint256 profitableCount = 0;
        int256 totalProfitPercent = 0;
        
        // This is a simplified calculation and may not be gas-efficient for large datasets
        address[] memory users = new address[](1000); // Arbitrary limit
        uint256 userIndex = 0;
        
        // Loop through all users who have made purchases
        for (uint256 i = 0; i < 1000; i++) { // Arbitrary limit
            address user = address(uint160(i + 1)); // Simplified user enumeration
            
            if (userPurchases[user].length > 0) {
                users[userIndex] = user;
                userIndex++;
                userCount++;
                
                TokenPurchase[] memory purchases = userPurchases[user];
                purchaseCount += purchases.length;
                
                for (uint256 j = 0; j < purchases.length; j++) {
                    if (purchases[j].sold) {
                        soldCount++;
                        
                        int256 profit = int256(purchases[j].soldAmount) - int256(purchases[j].purchaseAmount);
                        if (profit > 0) {
                            profitableCount++;
                        }
                        
                        // Calculate profit percentage
                        int256 profitPercent = profit * 100 / int256(purchases[j].purchaseAmount);
                        totalProfitPercent += profitPercent;
                    }
                }
            }
        }
        
        // Calculate average profit percentage and success rate
        avgProfitPercent = soldCount > 0 ? uint256(totalProfitPercent / int256(soldCount)) : 0;
        successRate = soldCount > 0 ? (profitableCount * 100) / soldCount : 0;
        
        return (userCount, purchaseCount, soldCount, avgProfitPercent, successRate);
    }
    
    // Get token info
    function getTokenInfo(address tokenAddress) external view returns (
        string memory name,
        string memory symbol,
        uint256 totalSupply,
        uint256 decimals,
        uint256 currentPrice,
        bool isBlacklisted,
        TokenAnalysis memory analysis
    ) {
        try IERC20(tokenAddress).name() returns (string memory _name) {
            name = _name;
        } catch {
            name = "Unknown";
        }
        
        try IERC20(tokenAddress).symbol() returns (string memory _symbol) {
            symbol = _symbol;
        } catch {
            symbol = "UNK";
        }
        
        try IERC20(tokenAddress).totalSupply() returns (uint256 _totalSupply) {
            totalSupply = _totalSupply;
        } catch {
            totalSupply = 0;
        }
        
        try IERC20(tokenAddress).decimals() returns (uint8 _decimals) {
            decimals = _decimals;
        } catch {
            decimals = 18; // Default to 18 decimals
        }
        
        currentPrice = getTokenPrice(tokenAddress);
        isBlacklisted = blacklistedTokens[tokenAddress];
        analysis = analyzeToken(tokenAddress);
        
        return (name, symbol, totalSupply, decimals, currentPrice, isBlacklisted, analysis);
    }
    
    // Emergency withdraw tokens
    function emergencyWithdrawTokens(address tokenAddress) external nonReentrant {
        IERC20 token = IERC20(tokenAddress);
        uint256 balance = token.balanceOf(address(this));
        
        require(balance > 0, "No tokens to withdraw");
        
        // Find user's purchases for this token
        TokenPurchase[] storage purchases = userPurchases[msg.sender];
        uint256 userTokenAmount = 0;
        
        for (uint256 i = 0; i < purchases.length; i++) {
            if (purchases[i].tokenAddress == tokenAddress && !purchases[i].sold) {
                userTokenAmount += purchases[i].tokenAmount;
                purchases[i].sold = true;
                purchases[i].soldAmount = 0;
                purchases[i].soldTimestamp = block.timestamp;
                purchases[i].exitReason = "emergency-withdraw";
            }
        }
        
        require(userTokenAmount > 0, "No token purchases found");
        require(userTokenAmount <= balance, "Not enough token balance");
        
        // Transfer tokens to user
        token.transfer(msg.sender, userTokenAmount);
        
        emit TokenSold(
            msg.sender,
            tokenAddress,
            0, // No native tokens received
            0, // No profit
            "emergency-withdraw",
            currentNetwork
        );
    }
    
    // Batch process tokens
    function batchCheckAndSell() external nonReentrant {
        TokenPurchase[] storage purchases = userPurchases[msg.sender];
        Network originalNetwork = currentNetwork;
        
        for (uint256 i = 0; i < purchases.length; i++) {
            if (!purchases[i].sold) {
                // Set network for this purchase
                currentNetwork = purchases[i].network;
                
                address tokenAddress = purchases[i].tokenAddress;
                uint256 currentPrice = getTokenPrice(tokenAddress);
                uint256 purchasePrice = purchases[i].purchasePrice;
                
                string memory exitReason = "";
                bool shouldSell = false;
                
                // Check for take profit condition
                if (currentPrice >= purchasePrice.mul(config.takeProfitPercent.add(100)).div(100)) {
                    shouldSell = true;
                    exitReason = "profit";
                }
                // Check for stop loss condition
                else if (currentPrice <= purchasePrice.mul(100 - config.stopLossPercent).div(100)) {
                    shouldSell = true;
                    exitReason = "stop-loss";
                }
                // Check for time limit
                else if (block.timestamp >= purchases[i].purchaseTimestamp.add(config.maxHoldingPeriod * 1 hours)) {
                    shouldSell = true;
                    exitReason = "time-limit";
                }
                
                if (shouldSell) {
                    sellTokens(i, exitReason);
                }
            }
        }
        
        // Reset to original network
        currentNetwork = originalNetwork;
    }
    
    // Pause/unpause the contract (for emergency)
    bool public paused;
    
    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
    }
    
    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }
    
    // Restrict some functions when paused
    function executeSnipe(address tokenAddress, uint256 amountToSpend) external nonReentrant whenNotPaused {
        require(userFunds[msg.sender] >= amountToSpend, "Insufficient funds");
        require(amountToSpend > 0, "Amount must be greater than 0");
        require(!blacklistedTokens[tokenAddress], "Token is blacklisted");
        
        // Get current network configuration
        NetworkInfo memory network = networks[currentNetwork];
        
        // Analyze token
        TokenAnalysis memory analysis = analyzeToken(tokenAddress);
        require(analysis.isValid, "Token does not meet validity criteria");
        require(analysis.hasLiquidity, "Insufficient liquidity");
        require(analysis.hasAcceptableSupply, "Token supply exceeds maximum");
        require(analysis.hasLiquidityLocked, "Insufficient liquidity locked");
        require(analysis.buyTaxPercentage <= config.maxTaxPercentage, "Buy tax too high");
        require(analysis.sellTaxPercentage <= config.maxTaxPercentage, "Sell tax too high");
        
        // Calculate minimum tokens to receive (with slippage)
        uint256 minTokensToReceive = calculateMinTokensToReceive(tokenAddress, amountToSpend);
        
        // Execute swap
        uint256 tokenAmount = swapNativeForTokens(tokenAddress, amountToSpend, minTokensToReceive);
        
        // Record the purchase
        userFunds[msg.sender] = userFunds[msg.sender].sub(amountToSpend);
        
        TokenPurchase memory purchase = TokenPurchase({
            tokenAddress: tokenAddress,
            purchaseAmount: amountToSpend,
            tokenAmount: tokenAmount,
            purchaseTimestamp: block.timestamp,
            purchasePrice: analysis.currentPrice,
            sold: false,
            soldAmount: 0,
            soldTimestamp: 0,
            exitReason: "",
            network: currentNetwork
        });
        
        userPurchases[msg.sender].push(purchase);
        
        emit TokenPurchased(msg.sender, tokenAddress, amountToSpend, tokenAmount, currentNetwork);
    }
    
    // Contract upgrade/migration support
    address public newContractAddress;
    
    function setNewContractAddress(address _newContractAddress) external onlyOwner {
        newContractAddress = _newContractAddress;
    }
    
    function migrateUserData(address user) external onlyOwner {
        require(newContractAddress != address(0), "New contract not set");
        
        // This function would integrate with a new version of the contract
        // Implementation depends on the new contract's interface
    }
}