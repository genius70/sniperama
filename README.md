# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

git status
git add .
git commit -m "Committing all local changes before pulling" OR
git commit -m "Committing all local changes before pushing"
git pull origin main --rebase
git push origin main


## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```
# Iron Condor Options Strategy Calculator: User Manual

## Introduction

The Iron Condor Options Strategy Calculator is a powerful tool designed to help options traders plan, analyze, and optimize iron condor trades. This user manual will guide you through using the calculator effectively, from setting up your first trade to interpreting the results and optimizing your strategy.

## What is an Iron Condor?

An iron condor is an options trading strategy that involves four different options contracts:
- Selling an out-of-the-money put (short put)
- Buying a further out-of-the-money put (long put)
- Selling an out-of-the-money call (short call)
- Buying a further out-of-the-money call (long call)

This creates a position that profits when the underlying stock stays within a range, with defined maximum profit and loss. Iron condors are typically used when a trader expects the stock to remain relatively stable.

## Getting Started

### Step 1: Set Market Parameters

1. **Stock Price**: Enter the current market price of the underlying stock.
   - Example: For a stock trading at $100, enter "100" in the Stock Price field.

2. **Annual Volatility**: Enter the implied volatility percentage for the stock.
   - Lower values (20-30%) indicate a less volatile stock
   - Higher values (40%+) indicate a more volatile stock
   - If unsure, 30% is a reasonable starting point

3. **Days to Expiration**: Select your desired expiration timeframe.
   - Options: 30, 35, 40, or 45 days
   - The 30-45 day window is optimal for iron condors, balancing time decay and risk

### Step 2: Configure Your Iron Condor Strategy

1. **Set Strike Prices**:
   - **Upper Short Strike**: This is the strike price of your short call option. It should be above the current stock price.
     - Example: For a $100 stock, you might set this at $110
   - **Lower Short Strike**: This is the strike price of your short put option. It should be below the current stock price.
     - Example: For a $100 stock, you might set this at $90

2. **Set Spread Widths**:
   - **Call Spread Width**: The distance between your short call and long call strikes.
     - Must be between $5 and $10 per your configuration
     - Example: If your short call is at $110, a spread width of $5 means your long call is at $115
   - **Put Spread Width**: The distance between your short put and long put strikes.
     - Must be between $5 and $10 per your configuration
     - Example: If your short put is at $90, a spread width of $5 means your long put is at $85

3. **Net Credit Received**: The total premium you receive when opening the trade.
   - This is the maximum profit potential of your iron condor
   - The wider your short strikes from the current price, the less credit you'll typically receive
   - Example: $3.00 means you receive $300 per contract ($3.00 × 100 shares)

4. **Number of Contracts**: How many iron condor positions you want to open.
   - Each contract represents options on 100 shares
   - Example: 10 contracts means you're trading options on 1,000 shares

5. **Initial Investment**: Your account allocation for this trade.
   - This represents your capital that you're measuring returns against
   - Default is $2,000

6. **Profit Target**: Your desired return percentage.
   - The default target is 15%, matching your requirement
   - The calculator will indicate if your configuration meets this target

### Step 3: Analyze Results

After configuring your trade parameters, the calculator automatically displays:

1. **Profit/Loss Profile Chart**:
   - Shows potential profit/loss at different stock prices at expiration
   - Blue line indicates your P/L at each price point
   - Helps visualize your maximum profit zone and loss areas

2. **Strike Structure**: 
   - Displays all four strike prices in your iron condor
   - Long Call, Short Call, Short Put, and Long Put strikes

3. **Breakeven Points**:
   - Upper Breakeven: Stock price above which your position starts losing money
   - Lower Breakeven: Stock price below which your position starts losing money

4. **Maximum Profit**:
   - Total maximum profit potential in dollars
   - Return on investment as a percentage
   - Visual indicator showing if you've met your profit target

5. **Maximum Loss**:
   - The worst-case scenario loss in dollars
   - Loss as a percentage of your initial investment

6. **Probability Analysis**:
   - Probability of Profit: Statistical likelihood of making money based on volatility
   - Expected Return: Weighted average return considering probabilities

7. **Risk Metrics**:
   - Risk-Reward Ratio: Relationship between potential loss and gain
   - Margin Required: Amount of capital needed to secure the position

8. **Strategy Analysis**:
   - Probability assessment
   - Profit potential evaluation
   - Risk assessment
   - Position sizing guidance
   - Adjustment strategies for managing the trade

### Step 4: Optimize Your Trade

If your initial configuration doesn't meet your requirements:

1. **Manual Adjustment**:
   - Widen or narrow the distance between your short strikes and the current stock price
   - Adjust your spread widths (keeping between $5-$10)
   - Change the number of contracts

2. **Find Optimal Settings**:
   - Click the "Find Optimal Settings" button for automatic optimization
   - The calculator will suggest parameters to meet your profit target
   - Review the suggested settings and make manual adjustments as needed

## Tips for Effective Use

### Balancing Risk and Reward

1. **Strike Selection**:
   - Wider spreads between short strikes = higher probability of profit but lower credit received
   - Narrower spreads between short strikes = lower probability of profit but higher credit received

2. **Volatility Considerations**:
   - Higher volatility typically means higher premiums
   - Consider using wider spreads for high-volatility stocks

3. **Spread Width Strategy**:
   - Wider spreads ($8-$10) require more capital but provide more downside protection
   - Narrower spreads ($5-$6) require less capital but have less buffer for price movements

### Managing Your Trades

1. **Adjustment Triggers**:
   - Monitor the position when stock moves beyond 90% of the distance to your short strikes
   - Consider adjustments if this happens before 2/3 of the time to expiration has elapsed

2. **Profit Taking**:
   - Consider closing the position when you've captured 50-75% of maximum profit
   - This often provides better risk-adjusted returns than holding to expiration

3. **Loss Management**:
   - Set predetermined exit points (e.g., if loss reaches 1.5× the expected profit)
   - Avoid hoping for reversals when trades move significantly against you

## Example Trade Setup

For a stock trading at $100:

1. **Conservative Setup**:
   - Upper short strike: $115 (15% OTM)
   - Lower short strike: $85 (15% OTM)
   - Spread widths: $5 each side
   - Expected credit: ~$1.50-$2.50
   - Lower profit potential but higher probability of success

2. **Balanced Setup**:
   - Upper short strike: $110 (10% OTM)
   - Lower short strike: $90 (10% OTM)
   - Spread widths: $5-$7 each side
   - Expected credit: ~$2.50-$3.50
   - Moderate profit potential with reasonable probability of success

3. **Aggressive Setup**:
   - Upper short strike: $105 (5% OTM)
   - Lower short strike: $95 (5% OTM)
   - Spread widths: $8-$10 each side
   - Expected credit: ~$3.50-$5.00
   - Higher profit potential but lower probability of success

## Troubleshooting

If your trade doesn't meet the 15% return requirement:

1. **Increase net credit** by moving short strikes closer to the current stock price
2. **Increase number of contracts** (be mindful of increasing risk)
3. **Decrease spread width** to reduce capital requirements (staying within $5-$10 range)
4. **Adjust total investment** amount if your actual allocation differs

## Conclusion

The Iron Condor Options Strategy Calculator provides a comprehensive analysis tool to help you design and evaluate iron condor trades with confidence. By carefully configuring your parameters and analyzing the resulting metrics, you can create options strategies that align with your risk tolerance and profit objectives.

Remember that options trading involves significant risk, and this calculator should be used as one tool in your overall trading approach, combined with proper risk management and trading discipline.

https://claude.ai/chat/b5ee2f70-d07e-413b-b8ee-085917cd22fe

traderama/
├── public/
│   ├── vite.svg
│   └── index.html
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── Dropdown.tsx
│   │   │   ├── Loading.tsx
│   │   │   └── index.ts
│   │   ├── trading/
│   │   │   ├── StrategyCard.tsx
│   │   │   ├── OptionsChain.tsx
│   │   │   ├── StrategyBuilder.tsx
│   │   │   ├── RiskCalculator.tsx
│   │   │   ├── PositionSizer.tsx
│   │   │   ├── GreeksDisplay.tsx
│   │   │   ├── ProfitLossChart.tsx
│   │   │   └── index.ts
│   │   ├── charts/
│   │   │   ├── TradingViewChart.tsx
│   │   │   ├── VolatilityChart.tsx
│   │   │   ├── PerformanceChart.tsx
│   │   │   └── index.ts
│   │   ├── ai/
│   │   │   ├── AIInsights.tsx
│   │   │   ├── MarketAnalysis.tsx
│   │   │   ├── StrategyRecommendations.tsx
│   │   │   ├── RiskAssessment.tsx
│   │   │   └── index.ts
│   │   ├── dashboard/
│   │   │   ├── Overview.tsx
│   │   │   ├── PortfolioSummary.tsx
│   │   │   ├── ActiveStrategies.tsx
│   │   │   ├── PerformanceMetrics.tsx
│   │   │   └── index.ts
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Layout.tsx
│   │   └── auth/
│   │       ├── LoginForm.tsx
│   │       ├── SignupForm.tsx
│   │       ├── AuthGuard.tsx
│   │       └── index.ts
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Strategies.tsx
│   │   ├── MarketData.tsx
│   │   ├── Portfolio.tsx
│   │   ├── Settings.tsx
│   │   ├── Education.tsx
│   │   └── index.ts
│   ├── services/
│   │   ├── api/
│   │   │   ├── client.ts
│   │   │   ├── auth.ts
│   │   │   ├── strategies.ts
│   │   │   ├── market-data.ts
│   │   │   ├── brokerages.ts
│   │   │   └── ai.ts
│   │   ├── brokers/
│   │   │   ├── base.ts
│   │   │   ├── td-ameritrade.ts
│   │   │   ├── interactive-brokers.ts
│   │   │   ├── schwab.ts
│   │   │   └── alpaca.ts
│   │   ├── ai/
│   │   │   ├── openai.ts
│   │   │   ├── claude.ts
│   │   │   ├── market-analyzer.ts
│   │   │   ├── strategy-optimizer.ts
│   │   │   └── risk-assessor.ts
│   │   ├── tradingview/
│   │   │   ├── websocket.ts
│   │   │   ├── api.ts
│   │   │   ├── charting.ts
│   │   │   └── data-feed.ts
│   │   └── storage/
│   │       ├── strategies.ts
│   │       ├── user-preferences.ts
│   │       └── cache.ts
│   ├── stores/
│   │   ├── auth.ts
│   │   ├── strategies.ts
│   │   ├── market-data.ts
│   │   ├── portfolio.ts
│   │   ├── ui.ts
│   │   └── index.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useMarketData.ts
│   │   ├── useStrategies.ts
│   │   ├── useBrokerConnection.ts
│   │   ├── useAIInsights.ts
│   │   ├── useWebSocket.ts
│   │   └── index.ts
│   ├── types/
│   │   ├── auth.ts
│   │   ├── trading.ts
│   │   ├── market-data.ts
│   │   ├── brokers.ts
│   │   ├── ai.ts
│   │   └── index.ts
│   ├── utils/
│   │   ├── calculations/
│   │   │   ├── options-pricing.ts
│   │   │   ├── greeks.ts
│   │   │   ├── volatility.ts
│   │   │   ├── profit-loss.ts
│   │   │   └── risk-metrics.ts
│   │   ├── formatters/
│   │   │   ├── currency.ts
│   │   │   ├── percentage.ts
│   │   │   ├── date.ts
│   │   │   └── numbers.ts
│   │   ├── validators/
│   │   │   ├── trading.ts
│   │   │   ├── user-input.ts
│   │   │   └── api-responses.ts
│   │   ├── constants.ts
│   │   ├── helpers.ts
│   │   └── index.ts
│   ├── styles/
│   │   ├── globals.css
│   │   ├── components.css
│   │   └── animations.css
│   ├── config/
│   │   ├── app.ts
│   │   ├── brokers.ts
│   │   ├── ai-providers.ts
│   │   └── tradingview.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── vite-env.d.ts
├── tests/
│   ├── components/
│   ├── services/
│   ├── utils/
│   └── setup.ts
├── docs/
│   ├── API.md
│   ├── DEPLOYMENT.md
│   ├── CONTRIBUTING.md
│   └── README.md
├── .env.example
├── .env.local
├── .gitignore
├── .eslintrc.cjs
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
└── vitest.config.ts