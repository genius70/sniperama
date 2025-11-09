import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { 
  AlertCircle, 
  CheckCircle, 
  HelpCircle, 
  Info, 
  DollarSign, 
  Percent, 
  Calendar, 
  TrendingUp 
} from "lucide-react";
import styles from "@/styles/options.module.css";

const OptionsCalculator = () => {
  // Available strategy types
  const strategyTypes = [
    { id: "long-call", name: "Long Call" },
    { id: "long-put", name: "Long Put" },
    { id: "covered-call", name: "Covered Call" },
    { id: "cash-secured-put", name: "Cash-Secured Put" },
    { id: "iron-condor", name: "Iron Condor" },
    { id: "butterfly", name: "Butterfly Spread" },
  ];

  // Form state
  const [availableFunds, setAvailableFunds] = useState(10000);
  const [maxRiskPercent, setMaxRiskPercent] = useState(5);
  const [strategyType, setStrategyType] = useState("iron-condor");
  const [stockPrice, setStockPrice] = useState(100);
  const [daysToExpiry, setDaysToExpiry] = useState(45);
  const [volatility, setVolatility] = useState(30);
  
  // Strategy-specific parameters
  const [callStrike, setCallStrike] = useState(0);
  const [putStrike, setPutStrike] = useState(0);
  const [upperShort, setUpperShort] = useState(115);
  const [lowerShort, setLowerShort] = useState(85);
  const [callSpread, setCallSpread] = useState(5);
  const [putSpread, setPutSpread] = useState(5);
  const [premium, setPremium] = useState(3);
  
  // Calculation output
  const [maxRiskAmount, setMaxRiskAmount] = useState(0);
  const [maxProfitAmount, setMaxProfitAmount] = useState(0);
  const [breakeven, setBreakeven] = useState([]);
  const [riskRewardRatio, setRiskRewardRatio] = useState(0);
  const [maxContracts, setMaxContracts] = useState(0);
  const [suggestedContracts, setSuggestedContracts] = useState(0);
  const [probabilityOfProfit, setProbabilityOfProfit] = useState(0);
  const [expectedValue, setExpectedValue] = useState(0);
  const [returnOnRisk, setReturnOnRisk] = useState(0);
  const [chartData, setChartData] = useState([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  
  // Form validation
  const [formErrors, setFormErrors] = useState({});
  const [isFormValid, setIsFormValid] = useState(true);

  // Set strike prices based on stock price when it changes
  useEffect(() => {
    setCallStrike(Math.round(stockPrice * 1.05));
    setPutStrike(Math.round(stockPrice * 0.95));
    setUpperShort(Math.round(stockPrice * 1.15));
    setLowerShort(Math.round(stockPrice * 0.85));
  }, [stockPrice]);

  // Calculate results whenever relevant inputs change
  useEffect(() => {
    calculateResults();
  }, [
    availableFunds, 
    maxRiskPercent, 
    strategyType, 
    stockPrice, 
    daysToExpiry,
    volatility,
    callStrike,
    putStrike,
    upperShort,
    lowerShort,
    callSpread,
    putSpread,
    premium
  ]);

  // Validate form
  const validateForm = () => {
    const errors = {};

    if (availableFunds <= 0) {
      errors.availableFunds = "Available funds must be greater than 0";
    }

    if (maxRiskPercent <= 0 || maxRiskPercent > 100) {
      errors.maxRiskPercent = "Risk percentage must be between 1-100%";
    }

    if (stockPrice <= 0) {
      errors.stockPrice = "Stock price must be greater than 0";
    }

    if (strategyType === "iron-condor") {
      if (upperShort <= lowerShort) {
        errors.strikes = "Upper short strike must be greater than lower short strike";
      }
      
      if (premium <= 0) {
        errors.premium = "Premium must be greater than 0";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Strategy-specific calculations
  const calculateIronCondorResults = () => {
    // Calculated values for iron condor
    const upperLong = upperShort + callSpread;
    const lowerLong = lowerShort - putSpread;
    
    // Maximum number of contracts based on risk tolerance
    const maxRiskPerContract = Math.max(
      (callSpread - premium) * 100,
      (putSpread - premium) * 100
    );
    
    const maxRiskAllowed = availableFunds * (maxRiskPercent / 100);
    const calculatedMaxContracts = Math.floor(maxRiskAllowed / maxRiskPerContract);
    
    // Conservative approach: use 75% of maximum contracts
    const calculatedSuggestedContracts = Math.floor(calculatedMaxContracts * 0.75);
    
    // Calculate profit/loss metrics
    const maxProfit = premium * calculatedSuggestedContracts * 100;
    const maxLoss = (Math.max(callSpread, putSpread) - premium) * calculatedSuggestedContracts * 100;
    
    // Calculate breakeven points
    const upperBreakeven = upperShort + premium;
    const lowerBreakeven = lowerShort - premium;
    
    // Calculate risk/reward ratio
    const riskReward = maxLoss > 0 ? maxProfit / maxLoss : 0;
    
    // Calculate probability of profit based on standard deviation
    const dailyVolatility = volatility / Math.sqrt(252);
    const expiryVolatility = dailyVolatility * Math.sqrt(daysToExpiry);
    const stdDev = stockPrice * expiryVolatility / 100;
    
    // Calculate using normal distribution approximation
    const zLower = (lowerShort - stockPrice) / stdDev;
    const zUpper = (upperShort - stockPrice) / stdDev;
    
    // Approximate the probability using error function
    const normCDF = z => {
      const t = 1 / (1 + 0.2316419 * Math.abs(z));
      const d = 0.3989423 * Math.exp(-z * z / 2);
      const probability =
        d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
      return z > 0 ? 1 - probability : probability;
    };
    
    // Probability between the short strikes
    const popCalculated = Math.min(Math.round((normCDF(zUpper) - normCDF(zLower)) * 100), 100);
    
    // Calculate expected value
    const expectedProfit = maxProfit * (popCalculated / 100) - 
                         maxLoss * (1 - popCalculated / 100);
    
    // Return on risk percentage
    const ror = maxLoss > 0 ? (maxProfit / maxLoss) * 100 : 0;
    
    // Generate chart data
    const data = generateIronCondorChart(
      stockPrice, 
      lowerLong, 
      lowerShort, 
      upperShort, 
      upperLong, 
      premium, 
      calculatedSuggestedContracts
    );

    return {
      maxRiskAmount: maxLoss,
      maxProfitAmount: maxProfit,
      breakeven: [lowerBreakeven, upperBreakeven],
      riskRewardRatio: riskReward,
      maxContracts: calculatedMaxContracts,
      suggestedContracts: calculatedSuggestedContracts,
      probabilityOfProfit: popCalculated,
      expectedValue: expectedProfit,
      returnOnRisk: ror,
      chartData: data
    };
  };

  // Generate chart data for iron condor
  const generateIronCondorChart = (
    spotPrice, 
    lowerLong, 
    lowerShort, 
    upperShort, 
    upperLong, 
    netCredit, 
    contracts
  ) => {
    const data = [];
    const rangeMultiplier = 0.4; // How far out to extend the chart
    const steps = 50; // Number of data points

    const minPrice = spotPrice * (1 - rangeMultiplier);
    const maxPrice = spotPrice * (1 + rangeMultiplier);
    const step = (maxPrice - minPrice) / steps;

    // Calculate P/L at a given price
    const calculatePL = price => {
      const callSpread = upperLong - upperShort;
      const putSpread = lowerShort - lowerLong;
      
      if (price <= lowerLong) return -((putSpread - netCredit) * contracts * 100);
      if (price < lowerShort) return -((lowerShort - price - netCredit) * contracts * 100);
      if (price <= upperShort) return netCredit * contracts * 100;
      if (price < upperLong) return -((price - upperShort - netCredit) * contracts * 100);
      return -((callSpread - netCredit) * contracts * 100);
    };

    for (let price = minPrice; price <= maxPrice; price += step) {
      const roundedPrice = Math.round(price * 100) / 100;
      data.push({
        price: roundedPrice,
        pl: calculatePL(roundedPrice),
        zero: 0 // Reference line for break-even
      });
    }

    return data;
  };

  // Main calculation function
  const calculateResults = () => {
    setIsCalculating(true);
    
    // Validate form first
    if (!validateForm()) {
      setIsFormValid(false);
      setIsCalculating(false);
      return;
    }
    
    setIsFormValid(true);
    
    // Calculate based on strategy type
    let results;
    
    if (strategyType === "iron-condor") {
      results = calculateIronCondorResults();
    } else {
      // Placeholder for other strategies
      results = {
        maxRiskAmount: availableFunds * (maxRiskPercent / 100),
        maxProfitAmount: availableFunds * (maxRiskPercent / 100) * 2,
        breakeven: [stockPrice],
        riskRewardRatio: 2,
        maxContracts: 10,
        suggestedContracts: 7,
        probabilityOfProfit: 50,
        expectedValue: 500,
        returnOnRisk: 50,
        chartData: []
      };
    }
    
    // Update state with calculated results
    setMaxRiskAmount(results.maxRiskAmount);
    setMaxProfitAmount(results.maxProfitAmount);
    setBreakeven(results.breakeven);
    setRiskRewardRatio(results.riskRewardRatio);
    setMaxContracts(results.maxContracts);
    setSuggestedContracts(results.suggestedContracts);
    setProbabilityOfProfit(results.probabilityOfProfit);
    setExpectedValue(results.expectedValue);
    setReturnOnRisk(results.returnOnRisk);
    setChartData(results.chartData);
    
    setIsCalculating(false);
  };

  return (
    <div className={styles.calculatorContainer}>
      <header className={styles.header}>
        <h1 className={styles.title}>Options Strategy Calculator</h1>
        <p className={styles.subtitle}>Optimize your options strategy based on your available funds and risk tolerance</p>
      </header>

      <div className={styles.calculatorLayout}>
        {/* Left panel - Inputs */}
        <div className={styles.inputPanel}>
          <section className={styles.formSection}>
            <h2 className={styles.sectionTitle}>Account Parameters</h2>

            <div className={styles.formGrid}>
              <div className={styles.formField}>
                <label htmlFor="availableFunds" className={styles.label}>
                  <DollarSign size={16} className={styles.inputIcon} />
                  Available Funds ($)
                </label>
                <div className={styles.inputWrapper}>
                  <input
                    id="availableFunds"
                    type="number"
                    value={availableFunds}
                    onChange={(e) => setAvailableFunds(Number(e.target.value))}
                    className={`${styles.input} ${formErrors.availableFunds ? styles.inputError : ''}`}
                    placeholder="Enter your available funds"
                    title="The total amount of capital you have available to trade"
                  />
                </div>
                {formErrors.availableFunds && (
                  <div className={styles.errorMessage}>{formErrors.availableFunds}</div>
                )}
              </div>

              <div className={styles.formField}>
                <label htmlFor="maxRiskPercent" className={styles.label}>
                  <Percent size={16} className={styles.inputIcon} />
                  Max Risk (%)
                </label>
                <div className={styles.inputWrapper}>
                  <input
                    id="maxRiskPercent"
                    type="number"
                    value={maxRiskPercent}
                    onChange={(e) => setMaxRiskPercent(Number(e.target.value))}
                    className={`${styles.input} ${formErrors.maxRiskPercent ? styles.inputError : ''}`}
                    placeholder="Enter maximum risk percentage"
                    title="Maximum percentage of your funds you're willing to risk on this trade"
                    min="1"
                    max="100"
                  />
                </div>
                {formErrors.maxRiskPercent && (
                  <div className={styles.errorMessage}>{formErrors.maxRiskPercent}</div>
                )}
              </div>
            </div>

            <div className={`${styles.maxRiskDisplay} ${styles.highlight}`}>
              <span className={styles.infoLabel}>Maximum Risk Amount:</span>
              <span className={styles.infoValue}>${(availableFunds * maxRiskPercent / 100).toFixed(2)}</span>
            </div>
          </section>

          <section className={styles.formSection}>
            <h2 className={styles.sectionTitle}>Market & Strategy Parameters</h2>

            <div className={styles.formField}>
              <label htmlFor="strategyType" className={styles.label}>Strategy Type</label>
              <select
                id="strategyType"
                value={strategyType}
                onChange={(e) => setStrategyType(e.target.value)}
                className={styles.select}
                title="Select the options strategy you want to analyze"
              >
                {strategyTypes.map(strategy => (
                  <option key={strategy.id} value={strategy.id}>{strategy.name}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGrid}>
              <div className={styles.formField}>
                <label htmlFor="stockPrice" className={styles.label}>
                  <DollarSign size={16} className={styles.inputIcon} />
                  Stock Price ($)
                </label>
                <div className={styles.inputWrapper}>
                  <input
                    id="stockPrice"
                    type="number"
                    value={stockPrice}
                    onChange={(e) => setStockPrice(Number(e.target.value))}
                    className={`${styles.input} ${formErrors.stockPrice ? styles.inputError : ''}`}
                    placeholder="Enter current stock price"
                    title="Current market price of the underlying stock"
                    min="0.01"
                    step="0.01"
                  />
                </div>
                {formErrors.stockPrice && (
                  <div className={styles.errorMessage}>{formErrors.stockPrice}</div>
                )}
              </div>

              <div className={styles.formField}>
                <label htmlFor="daysToExpiry" className={styles.label}>
                  <Calendar size={16} className={styles.inputIcon} />
                  Days to Expiry
                </label>
                <select
                  id="daysToExpiry"
                  value={daysToExpiry}
                  onChange={(e) => setDaysToExpiry(Number(e.target.value))}
                  className={styles.select}
                  title="Number of days until option expiration"
                >
                  <option value="7">7 days</option>
                  <option value="14">14 days</option>
                  <option value="21">21 days</option>
                  <option value="30">30 days</option>
                  <option value="45">45 days</option>
                  <option value="60">60 days</option>
                  <option value="90">90 days</option>
                </select>
              </div>

              <div className={styles.formField}>
                <label htmlFor="volatility" className={styles.label}>
                  <TrendingUp size={16} className={styles.inputIcon} />
                  Implied Volatility (%)
                </label>
                <div className={styles.inputWrapper}>
                  <input
                    id="volatility"
                    type="number"
                    value={volatility}
                    onChange={(e) => setVolatility(Number(e.target.value))}
                    className={styles.input}
                    placeholder="Enter implied volatility"
                    title="Current implied volatility of the underlying stock"
                    min="1"
                    max="200"
                  />
                </div>
              </div>
            </div>

            <div className={styles.advancedSettingsToggle}>
              <button 
                onClick={() => setShowAdvancedSettings(!showAdvancedSettings)} 
                className={styles.toggleButton}
              >
                {showAdvancedSettings ? 'Hide Advanced Settings' : 'Show Advanced Settings'}
              </button>
            </div>

            {showAdvancedSettings && (
              <div className={`${styles.advancedSettings} ${strategyType === 'iron-condor' ? styles.visible : styles.hidden}`}>
                <h3 className={styles.subsectionTitle}>Iron Condor Parameters</h3>
                
                <div className={styles.formGrid}>
                  <div className={styles.formField}>
                    <label htmlFor="upperShort" className={styles.label}>Upper Short Strike ($)</label>
                    <input
                      id="upperShort"
                      type="number"
                      value={upperShort}
                      onChange={(e) => setUpperShort(Number(e.target.value))}
                      className={styles.input}
                      placeholder="Enter upper short strike"
                      title="Short call strike price"
                      min={stockPrice}
                    />
                  </div>
                  
                  <div className={styles.formField}>
                    <label htmlFor="callSpread" className={styles.label}>Call Spread Width ($)</label>
                    <input
                      id="callSpread"
                      type="number"
                      value={callSpread}
                      onChange={(e) => setCallSpread(Number(e.target.value))}
                      className={styles.input}
                      placeholder="Enter call spread width"
                      title="Difference between short and long call strikes"
                      min="1"
                    />
                  </div>
                  
                  <div className={styles.formField}>
                    <label htmlFor="lowerShort" className={styles.label}>Lower Short Strike ($)</label>
                    <input
                      id="lowerShort"
                      type="number"
                      value={lowerShort}
                      onChange={(e) => setLowerShort(Number(e.target.value))}
                      className={styles.input}
                      placeholder="Enter lower short strike"
                      title="Short put strike price"
                      max={stockPrice}
                    />
                  </div>
                  
                  <div className={styles.formField}>
                    <label htmlFor="putSpread" className={styles.label}>Put Spread Width ($)</label>
                    <input
                      id="putSpread"
                      type="number"
                      value={putSpread}
                      onChange={(e) => setPutSpread(Number(e.target.value))}
                      className={styles.input}
                      placeholder="Enter put spread width"
                      title="Difference between short and long put strikes"
                      min="1"
                    />
                  </div>
                  
                  <div className={styles.formField}>
                    <label htmlFor="premium" className={styles.label}>Net Credit Received ($)</label>
                    <input
                      id="premium"
                      type="number"
                      value={premium}
                      onChange={(e) => setPremium(Number(e.target.value))}
                      className={`${styles.input} ${formErrors.premium ? styles.inputError : ''}`}
                      placeholder="Enter net credit received"
                      title="Net premium received per contract"
                      min="0.01"
                      step="0.01"
                    />
                    {formErrors.premium && (
                      <div className={styles.errorMessage}>{formErrors.premium}</div>
                    )}
                  </div>
                </div>
                
                {formErrors.strikes && (
                  <div className={styles.errorMessage}>{formErrors.strikes}</div>
                )}
              </div>
            )}
            
            <button 
              onClick={calculateResults}
              className={styles.calculateButton}
              disabled={isCalculating}
            >
              {isCalculating ? 'Calculating...' : 'Calculate Results'}
            </button>
          </section>
        </div>

        {/* Right panel - Results */}
        <div className={styles.resultsPanel}>
          {!isFormValid ? (
            <div className={styles.errorCard}>
              <AlertCircle size={24} className={styles.errorIcon} />
              <h3>Please fix the errors in the form</h3>
              <p>Fix the highlighted fields to continue.</p>
            </div>
          ) : (
            <>
              {/* Chart */}
              <section className={styles.chartSection}>
                <h2 className={styles.sectionTitle}>Profit/Loss Profile</h2>
                <div className={styles.chartContainer}>
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart
                        data={chartData}
                        margin={{ top: 5, right: 20, bottom: 5, left: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="price"
                          label={{
                            value: "Stock Price at Expiration ($)",
                            position: "insideBottom",
                            offset: -5,
                          }}
                        />
                        <YAxis
                          label={{
                            value: "Profit/Loss ($)",
                            angle: -90,
                            position: "insideLeft",
                          }}
                        />
                        <Tooltip formatter={(value) => [`$${value.toFixed(2)}`, "P/L"]} />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="zero"
                          stroke="#888888"
                          strokeWidth={1}
                          dot={false}
                          activeDot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="pl"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className={styles.noChartData}>
                      <p>Chart will display after calculation</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Results Grid */}
              <div className={styles.resultsGrid}>
                {/* Allocation Results */}
                <section className={styles.resultCard}>
                  <h3 className={styles.resultTitle}>Position Sizing</h3>
                  <div className={styles.resultContent}>
                    <div className={styles.resultItem}>
                      <span className={styles.resultLabel}>Maximum Contracts:</span>
                      <span className={styles.resultValue}>{maxContracts}</span>
                    </div>
                    <div className={styles.resultItem}>
                      <span className={styles.resultLabel}>Suggested Contracts:</span>
                      <span className={styles.resultValue}>{suggestedContracts}</span>
                    </div>
                    <div className={styles.resultHighlight}>
                      <div className={styles.resultItem}>
                        <span className={styles.resultLabel}>Capital Required:</span>
                        <span className={styles.resultValue}>${maxRiskAmount.toFixed(2)}</span>
                      </div>
                      <div className={styles.resultSubtext}>
                        {(maxRiskAmount / availableFunds * 100).toFixed(1)}% of available funds
                      </div>
                    </div>
                  </div>
                </section>

                {/* Profit/Loss Profile */}
                <section className={`${styles.resultCard} ${styles.profitCard}`}>
                  <h3 className={styles.resultTitle}>Profit/Loss Profile</h3>
                  <div className={styles.resultContent}>
                    <div className={styles.resultItem}>
                      <span className={styles.resultLabel}>Maximum Profit:</span>
                      <span className={`${styles.resultValue} ${styles.profitValue}`}>
                        ${maxProfitAmount.toFixed(2)}
                      </span>
                    </div>
                    <div className={styles.resultItem}>
                      <span className={styles.resultLabel}>Maximum Loss:</span>
                      <span className={`${styles.resultValue} ${styles.lossValue}`}>
                        -${maxRiskAmount.toFixed(2)}
                      </span>
                    </div>
                    <div className={styles.resultItem}>
                      <span className={styles.resultLabel}>Breakeven Point{breakeven.length > 1 ? 's' : ''}:</span>
                      <span className={styles.resultValue}>
                        {breakeven.map((point, i) => `$${point.toFixed(2)}${i < breakeven.length - 1 ? ' / ' : ''}`)}
                      </span>
                    </div>
                  </div>
                </section>

                {/* Risk Metrics */}
                <section className={styles.resultCard}>
                  <h3 className={styles.resultTitle}>Risk Metrics</h3>
                  <div className={styles.resultContent}>
                    <div className={styles.resultItem}>
                      <span className={styles.resultLabel}>Risk-Reward Ratio:</span>
                      <span className={styles.resultValue}>
                        1:{riskRewardRatio.toFixed(2)}
                      </span>
                    </div>
                    <div className={styles.resultItem}>
                      <span className={styles.resultLabel}>Return on Risk:</span>
                      <span className={`${styles.resultValue} ${returnOnRisk > 0 ? styles.profitValue : styles.lossValue}`}>
                        {returnOnRisk.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </section>

                {/* Probability Analysis */}
                <section className={styles.resultCard}>
                  <h3 className={styles.resultTitle}>Probability Analysis</h3>
                  <div className={styles.resultContent}>
                    <div className={styles.resultMeter}>
                      <div 
                        className={styles.resultMeterFill}
                        style={{ width: `${probabilityOfProfit}%` }}
                      />
                      <span className={styles.resultMeterLabel}>
                        {probabilityOfProfit}% Probability of Profit
                      </span>
                    </div>
                    <div className={styles.resultItem}>
                      <span className={styles.resultLabel}>Expected Value:</span>
                      <span className={`${styles.resultValue} ${expectedValue > 0 ? styles.profitValue : styles.lossValue}`}>
                        ${expectedValue.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </section>
              </div>

              {/* Strategy Recommendation */}
              <section className={styles.recommendationSection}>
                <h2 className={styles.sectionTitle}>Strategy Analysis</h2>
                <div className={styles.recommendationContent}>
                  <div className={styles.recommendationItem}>
                    <Info size={18} className={styles.recommendationIcon} />
                    <div>
                      <h4 className={styles.recommendationTitle}>Position Sizing</h4>
                      <p className={styles.recommendationText}>
                        {suggestedContracts === 0 
                          ? "With your risk parameters, this trade is not recommended. Consider increasing risk tolerance or changing strategy."
                          : `Based on your risk tolerance of ${maxRiskPercent}%, you can safely trade up to ${suggestedContracts} contracts.`}
                      </p>
                    </div>
                  </div>
                  
                  <div className={styles.recommendationItem}>
                    <Info size={18} className={styles.recommendationIcon} />
                    <div>
                      <h4 className={styles.recommendationTitle}>Risk/Reward Profile</h4>
                      <p className={styles.recommendationText}>
                        {riskRewardRatio < 0.5 
                          ? "This trade has an unfavorable risk/reward ratio. Consider adjusting your strikes or strategy."
                          : riskRewardRatio >= 1 
                            ? "Excellent risk/reward profile for this strategy."
                            : "Acceptable risk/reward profile for this strategy type."}
                      </p>
                    </div>
                  </div>
                  
                  <div className={styles.recommendationItem}>
                    <Info size={18} className={styles.recommendationIcon} />
                    <div>
                      <h4 className={styles.recommendationTitle}>Probability Assessment</h4>
                      <p className={styles.recommendationText}>
                        {probabilityOfProfit < 40 
                          ? "Low probability of profit. This is a speculative trade that could benefit from higher volatility."
                          : probabilityOfProfit > 70
                            ? "High probability of profit. This is a conservative trade suited for stable market conditions."
                            : "Moderate probability of profit. This trade has a balanced risk profile."}
                      </p>
                    </div>
                  </div>
                  
                  <div className={styles.recommendationItem}>
                    <CheckCircle size={18} className={styles.recommendationIcon} />
                    <div>
                      <h4 className={styles.recommendationTitle}>Strategy Suitability</h4>
                      <p className={styles.recommendationText}>
                        {strategyType === "iron-condor" && 
                          `Iron Condor is suitable for neutral market outlook with ${volatility < 25 ? 'low' : volatility > 40 ? 'high' : 'moderate'} 
                          volatility. Best used when you expect price to stay between $${lowerShort.toFixed(2)} and $${upperShort.toFixed(2)} 
                          through expiration in ${daysToExpiry} days.`
                        }
                      </p>
                    </div>
                  </div>
                  
                  <div className={styles.recommendationItem}>
                    <HelpCircle size={18} className={styles.recommendationIcon} />
                    <div>
                      <h4 className={styles.recommendationTitle}>Management Notes</h4>
                      <p className={styles.recommendationText}>
                        For iron condors, consider taking profit at 50-75% of maximum potential and manage losses if the 
                        position reaches 2x the credit received. Set alerts at your breakeven points:
                        ${breakeven.map((point, i) => `$${point.toFixed(2)}${i < breakeven.length - 1 ? ' and ' : ''}`)}
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}
          
          <footer className={styles.calculatorFooter}>
            <p className={styles.disclaimer}>
              This calculator provides estimates only. Options trading involves risk. 
              Past performance is not indicative of future results.
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default OptionsCalculator;