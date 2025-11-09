// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Interfaces for SonicSwap on Fantom
interface ISonicRouter {
    function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts);
    function swapExactFTMForTokensSupportingFeeOnTransferTokens(
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external payable;
    function swapExactTokensForFTMSupportingFeeOnTransferTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external;
    function factory() external pure returns (address);
}

interface ISonicFactory {
    function getPair(address tokenA, address tokenB) external view returns (address pair);
    function createPair(address tokenA, address tokenB) external returns (address pair);
}

interface ISonicPair {
    function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast);
    function token0() external view returns (address);
    function token1() external view returns (address);
}

contract FantomSniper {
    // SonicSwap Router and Factory addresses for Fantom
    address public constant SONIC_ROUTER = 0xF6558CF94Bf779B2C07432d9AB59FfA897Bd3358; // SonicSwap router
    address public constant WFTM = 0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83; // Wrapped FTM
    
    // Contract state variables
    uint256 public minimumLiquidity = 20; // 20% minimum liquidity lock
    uint256 public minimumLockTime = 90 days; // 90 days minimum lock time
    uint256 public maxTotalSupply = 10_000_000_000 * 10**18; // 10 billion tokens max supply
    uint256 public minTokenPrice = 1e-11 ether; // $0.00000001 minimum token price
    uint256 public emergencyExitThreshold = 15; // 15% price drop threshold
    uint256 public takeEarlyProfitThreshold = 1000; // 1000% profit for early exit
    uint256 public normalExitTime = 72 hours; // 72 hours normal exit time
    address public deployer;
    
    struct SnipedToken {
        address tokenAddress;
        uint256 purchaseAmount;
        uint256 tokensReceived;
        uint256 purchaseTimestamp;
        uint256 initialPrice;
        bool sold;
        uint256 profit;
    }
    
    mapping(address => bool) public blacklistedTokens;
    SnipedToken[] public snipedTokens;
    
    event TokenSniped(address indexed token, uint256 amount, uint256 tokensReceived);
    event TokenSold(address indexed token, uint256 tokensReceived, uint256 profit);
    event BlacklistedToken(address indexed token, string reason);
    event ParamsUpdated(string paramName, uint256 oldValue, uint256 newValue);
    
    constructor() {
        deployer = msg.sender;
    }
    
    receive() external payable {}
    
    function snipeToken(address tokenAddress, uint256 amountToSpend, uint256 slippage) external payable {
        require(msg.sender == deployer, "Only deployer can call");
        require(amountToSpend > 0, "Amount must be greater than 0");
        require(!blacklistedTokens[tokenAddress], "Token is blacklisted");
        
        // Validate token parameters
        require(validateToken(tokenAddress), "Token validation failed");
        
        // Calculate minimum tokens to receive based on slippage
        uint256 minTokensToReceive = calculateMinTokensToReceive(tokenAddress, amountToSpend, slippage);
        
        // Create the path for the swap
        address[] memory path = new address[](2);
        path[0] = WFTM;
        path[1] = tokenAddress;
        
        // Calculate initial price
        uint256 initialPrice = getTokenPrice(tokenAddress);
        require(initialPrice >= minTokenPrice, "Token price too low");
        
        // Execute the swap
        ISonicRouter router = ISonicRouter(SONIC_ROUTER);
        
        // Get tokens before swap
        uint256 tokensBefore = IERC20(tokenAddress).balanceOf(address(this));
        
        // Execute swap
        router.swapExactFTMForTokensSupportingFeeOnTransferTokens{value: amountToSpend}(
            minTokensToReceive,
            path,
            address(this),
            block.timestamp + 300
        );
        
        // Get tokens after swap
        uint256 tokensAfter = IERC20(tokenAddress).balanceOf(address(this));
        uint256 tokensReceived = tokensAfter - tokensBefore;
        
        require(tokensReceived > 0, "No tokens received");
        
        // Store sniped token information
        SnipedToken memory snipedToken = SnipedToken({
            tokenAddress: tokenAddress,
            purchaseAmount: amountToSpend,
            tokensReceived: tokensReceived,
            purchaseTimestamp: block.timestamp,
            initialPrice: initialPrice,
            sold: false,
            profit: 0
        });
        
        snipedTokens.push(snipedToken);
        
        emit TokenSniped(tokenAddress, amountToSpend, tokensReceived);
    }
    
    function validateToken(address tokenAddress) public view returns (bool) {
        IERC20 token = IERC20(tokenAddress);
        
        // Check total supply
        try token.totalSupply() returns (uint256 totalSupply) {
            if (totalSupply > maxTotalSupply) {
                return false;
            }
        } catch {
            return false;
        }
        
        // Check liquidity lock
        if (!checkLiquidityLock(tokenAddress)) {
            return false;
        }
        
        // Check if token can be sold (honeypot check)
        if (!canSellToken(tokenAddress)) {
            return false;
        }
        
        return true;
    }
    
    function checkLiquidityLock(address tokenAddress) internal view returns (bool) {
        ISonicFactory factory = ISonicFactory(ISonicRouter(SONIC_ROUTER).factory());
        address pairAddress = factory.getPair(tokenAddress, WFTM);
        
        if (pairAddress == address(0)) {
            return false;
        }
        
        ISonicPair pair = ISonicPair(pairAddress);
        (uint112 reserve0, uint112 reserve1,) = pair.getReserves();
        
        address token0 = pair.token0();
        uint256 tokenReserve = token0 == tokenAddress ? reserve0 : reserve1;
        
        // Check if liquidity is sufficient (at least 20% of total supply)
        IERC20 token = IERC20(tokenAddress);
        uint256 totalSupply = token.totalSupply();
        
        return (tokenReserve * 100 / totalSupply) >= minimumLiquidity;
    }
    
    function canSellToken(address tokenAddress) internal view returns (bool) {
        // Check if we can sell a small amount of tokens (honeypot check)
        address[] memory path = new address[](2);
        path[0] = tokenAddress;
        path[1] = WFTM;
        
        uint256 amountIn = 1000; // Small amount for testing
        
        try ISonicRouter(SONIC_ROUTER).getAmountsOut(amountIn, path) returns (uint[] memory amounts) {
            return amounts[1] > 0;
        } catch {
            return false;
        }
    }
    
    function calculateMinTokensToReceive(address tokenAddress, uint256 amountToSpend, uint256 slippage) internal view returns (uint256) {
        address[] memory path = new address[](2);
        path[0] = WFTM;
        path[1] = tokenAddress;
        
        uint[] memory amounts = ISonicRouter(SONIC_ROUTER).getAmountsOut(amountToSpend, path);
        
        // Apply slippage tolerance (100 - slippage)
        return amounts[1] * (100 - slippage) / 100;
    }
    
    function getTokenPrice(address tokenAddress) public view returns (uint256) {
        address[] memory path = new address[](2);
        path[0] = tokenAddress;
        path[1] = WFTM;
        
        uint256 amountIn = 10**18; // 1 token
        
        try ISonicRouter(SONIC_ROUTER).getAmountsOut(amountIn, path) returns (uint[] memory amounts) {
            return amounts[1];
        } catch {
            return 0;
        }
    }
    
    function sellToken(uint256 snipedTokenIndex) external {
        require(msg.sender == deployer, "Only deployer can call");
        require(snipedTokenIndex < snipedTokens.length, "Invalid token index");
        
        SnipedToken storage snipedToken = snipedTokens[snipedTokenIndex];
        require(!snipedToken.sold, "Token already sold");
        
        address tokenAddress = snipedToken.tokenAddress;
        uint256 tokenBalance = IERC20(tokenAddress).balanceOf(address(this));
        require(tokenBalance >= snipedToken.tokensReceived, "Insufficient token balance");
        
        // Approve router to spend tokens
        IERC20(tokenAddress).approve(SONIC_ROUTER, snipedToken.tokensReceived);
        
        // Create the path for the swap
        address[] memory path = new address[](2);
        path[0] = tokenAddress;
        path[1] = WFTM;
        
        // Get FTM balance before swap
        uint256 ftmBefore = address(this).balance;
        
        // Execute swap
        ISonicRouter(SONIC_ROUTER).swapExactTokensForFTMSupportingFeeOnTransferTokens(
            snipedToken.tokensReceived,
            0, // Accept any amount
            path,
            address(this),
            block.timestamp + 300
        );
        
        // Get FTM balance after swap
        uint256 ftmAfter = address(this).balance;
        uint256 ftmReceived = ftmAfter - ftmBefore;
        
        // Calculate profit
        uint256 profit = 0;
        if (ftmReceived > snipedToken.purchaseAmount) {
            profit = ftmReceived - snipedToken.purchaseAmount;
        }
        
        // Update sniped token information
        snipedToken.sold = true;
        snipedToken.profit = profit;
        
        // Transfer FTM back to deployer
        payable(deployer).transfer(ftmReceived);
        
        emit TokenSold(tokenAddress, ftmReceived, profit);
    }
    
    function checkSellConditions(uint256 snipedTokenIndex) external view returns (bool shouldSell, string memory reason) {
        require(snipedTokenIndex < snipedTokens.length, "Invalid token index");
        
        SnipedToken storage snipedToken = snipedTokens[snipedTokenIndex];
        
        if (snipedToken.sold) {
            return (false, "Token already sold");
        }
        
        address tokenAddress = snipedToken.tokenAddress;
        
        // Get current price
        uint256 currentPrice = getTokenPrice(tokenAddress);
        if (currentPrice == 0) {
            return (false, "Cannot determine current price");
        }
        
        // Check emergency exit threshold (15% price drop)
        if (currentPrice < snipedToken.initialPrice && 
            (snipedToken.initialPrice - currentPrice) * 100 / snipedToken.initialPrice >= emergencyExitThreshold) {
            return (true, "Emergency exit - price dropped below threshold");
        }
        
        // Check early profit threshold (1000% increase)
        if (currentPrice > snipedToken.initialPrice && 
            (currentPrice - snipedToken.initialPrice) * 100 / snipedToken.initialPrice >= takeEarlyProfitThreshold) {
            return (true, "Take early profit - price increased above threshold");
        }
        
        // Check normal exit time (72 hours)
        if (block.timestamp >= snipedToken.purchaseTimestamp + normalExitTime) {
            return (true, "Normal exit - holding time exceeded");
        }
        
        return (false, "Hold conditions still met");
    }
    
    function blacklistToken(address tokenAddress, string calldata reason) external {
        require(msg.sender == deployer, "Only deployer can call");
        blacklistedTokens[tokenAddress] = true;
        emit BlacklistedToken(tokenAddress, reason);
    }
    
    function updateParams(
        uint256 _minimumLiquidity,
        uint256 _minimumLockTime,
        uint256 _maxTotalSupply,
        uint256 _minTokenPrice,
        uint256 _emergencyExitThreshold,
        uint256 _takeEarlyProfitThreshold,
        uint256 _normalExitTime
    ) external {
        require(msg.sender == deployer, "Only deployer can call");
        
        if (_minimumLiquidity != minimumLiquidity) {
            emit ParamsUpdated("minimumLiquidity", minimumLiquidity, _minimumLiquidity);
            minimumLiquidity = _minimumLiquidity;
        }
        
        if (_minimumLockTime != minimumLockTime) {
            emit ParamsUpdated("minimumLockTime", minimumLockTime, _minimumLockTime);
            minimumLockTime = _minimumLockTime;
        }
        
        if (_maxTotalSupply != maxTotalSupply) {
            emit ParamsUpdated("maxTotalSupply", maxTotalSupply, _maxTotalSupply);
            maxTotalSupply = _maxTotalSupply;
        }
        
        if (_minTokenPrice != minTokenPrice) {
            emit ParamsUpdated("minTokenPrice", minTokenPrice, _minTokenPrice);
            minTokenPrice = _minTokenPrice;
        }
        
        if (_emergencyExitThreshold != emergencyExitThreshold) {
            emit ParamsUpdated("emergencyExitThreshold", emergencyExitThreshold, _emergencyExitThreshold);
            emergencyExitThreshold = _emergencyExitThreshold;
        }
        
        if (_takeEarlyProfitThreshold != takeEarlyProfitThreshold) {
            emit ParamsUpdated("takeEarlyProfitThreshold", takeEarlyProfitThreshold, _takeEarlyProfitThreshold);
            takeEarlyProfitThreshold = _takeEarlyProfitThreshold;
        }
        
        if (_normalExitTime != normalExitTime) {
            emit ParamsUpdated("normalExitTime", normalExitTime, _normalExitTime);
            normalExitTime = _normalExitTime;
        }
    }
    
    function withdraw() external {
        require(msg.sender == deployer, "Only deployer can call");
        payable(deployer).transfer(address(this).balance);
    }
    
    function rescueTokens(address tokenAddress) external {
        require(msg.sender == deployer, "Only deployer can call");
        IERC20 token = IERC20(tokenAddress);
        uint256 balance = token.balanceOf(address(this));
        token.transfer(deployer, balance);
    }
}