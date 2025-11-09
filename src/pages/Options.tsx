import React from "react";
import IronCondorCalculator from "../components/IronCondorCalculator";

const Options = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 shadow-2xl">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-5xl font-extrabold text-white mb-4 tracking-tight">
              <span className="bg-gradient-to-r from-blue-200 to-cyan-200 bg-clip-text text-transparent">
                Options Trading
              </span>
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
              Advanced Iron Condor strategy calculator for professional traders.
              Analyze risk, optimize returns, and maximize your trading
              potential.
            </p>
            <div className="mt-8 flex justify-center space-x-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-6 py-3 border border-white/20">
                <span className="text-blue-200 text-sm font-medium">
                  Target Return
                </span>
                <div className="text-2xl font-bold text-white">15%+</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-6 py-3 border border-white/20">
                <span className="text-blue-200 text-sm font-medium">
                  Time Frame
                </span>
                <div className="text-2xl font-bold text-white">30-45 DTE</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-6 py-3 border border-white/20">
                <span className="text-blue-200 text-sm font-medium">
                  Capital
                </span>
                <div className="text-2xl font-bold text-white">$2,000</div>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative wave */}
        <div className="relative">
          <svg
            className="absolute bottom-0 w-full h-6 text-slate-50"
            fill="currentColor"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
          >
            <path
              d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z"
              opacity=".25"
            />
            <path
              d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z"
              opacity=".5"
            />
            <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" />
          </svg>
        </div>
      </div>

      {/* Calculator Container - Moved to Top and Centered at 50% Width */}
      <div className="container mx-auto px-4 py-12">
        <div className="flex-flex justify-center">
          <div
            className="w-full max-w-6xl"
            style={{ width: "50%", minWidth: "800px" }}
          >
            <div className="relative">
              {/* Background decoration */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl transform -rotate-1" />
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-3xl transform rotate-1" />

              {/* Calculator content */}
              <div className="relative bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-8 py-6 border-b border-gray-100">
                  <div className="flex-flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        Iron Condor Calculator
                      </h2>
                      <p className="text-gray-600 mt-1">
                        Configure your strategy parameters and analyze potential
                        returns
                      </p>
                    </div>
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl">
                      <div className="text-sm font-medium">Live Analysis</div>
                      <div className="text-lg font-bold">Real-time P&L</div>
                    </div>
                  </div>
                </div>

                <div className="p-8">
                  <IronCondorCalculator />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Strategy Features */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-300 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Market Neutral
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Profit from time decay and volatility contraction without
              directional bias. Perfect for range-bound markets.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              High Probability
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Structured for 70-80% win rate with defined risk parameters.
              Consistent income generation strategy.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="bg-gradient-to-br from-purple-500 to-violet-600 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Defined Risk
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Know your maximum loss upfront. Capital efficient strategy with
              clear exit parameters.
            </p>
          </div>
        </div>

        {/* Trading Tips */}
        <div className="mt-16 bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-8 border border-amber-100">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Professional Trading Tips
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="bg-amber-100 w-10 h-10 rounded-lg flex items-center justify-center mb-4">
                <span className="text-xl">📈</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Entry Timing</h4>
              <p className="text-sm text-gray-600">
                Open positions when IV is above 50th percentile for optimal
                credit collection.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="bg-blue-100 w-10 h-10 rounded-lg flex items-center justify-center mb-4">
                <span className="text-xl">⏰</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Time Management
              </h4>
              <p className="text-sm text-gray-600">
                Close positions at 25% of DTE or 50% max profit, whichever comes
                first.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="bg-green-100 w-10 h-10 rounded-lg flex items-center justify-center mb-4">
                <span className="text-xl">🎯</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Strike Selection
              </h4>
              <p className="text-sm text-gray-600">
                Target 15-20 delta for short strikes to balance probability with
                premium.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="bg-red-100 w-10 h-10 rounded-lg flex items-center justify-center mb-4">
                <span className="text-xl">🛡️</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Risk Management
              </h4>
              <p className="text-sm text-gray-600">
                Never risk more than 2-3% of portfolio on a single trade setup.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 mt-16">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 w-8 h-8 rounded-lg flex items-center justify-center mr-3">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="text-xl font-bold text-white">Sniperama</span>
          </div>
          <p className="text-gray-400">
            Advanced options trading strategies for professional traders
          </p>
          <div className="mt-6 text-sm text-gray-500">
            <p>
              ⚠️ Options trading involves significant risk. Past performance
              does not guarantee future results.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Options;
