/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Define types for our trading data
interface Trade {
  id: string;
  symbol: string;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  entryDate: Date;
  exitDate: Date | null;
  isOpen: boolean;
}

interface PeriodStats {
  totalProfit: number;
  winRate: number;
  tradeCount: number;
  averageReturn: number;
}

const Reporting: React.FC = () => {
  // State management
  const [trades, setTrades] = useState<Trade[]>([]);
  const [profitLoss, setProfitLoss] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  });
  const [selectedSymbol, setSelectedSymbol] = useState<string>("all");
  const [periodStats, setPeriodStats] = useState<PeriodStats>({
    totalProfit: 0,
    winRate: 0,
    tradeCount: 0,
    averageReturn: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Mock data fetching function - replace with actual API call
  const fetchTradeData = async () => {
    setIsLoading(true);
    try {
      // Simulate API call with timeout
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock data
      const mockTrades: Trade[] = [
        {
          id: "1",
          symbol: "BTC-USD",
          entryPrice: 45000,
          exitPrice: 47000,
          quantity: 0.5,
          entryDate: new Date("2024-02-15"),
          exitDate: new Date("2024-02-17"),
          isOpen: false,
        },
        {
          id: "2",
          symbol: "ETH-USD",
          entryPrice: 3200,
          exitPrice: 3000,
          quantity: 2,
          entryDate: new Date("2024-02-20"),
          exitDate: new Date("2024-02-25"),
          isOpen: false,
        },
        {
          id: "3",
          symbol: "BTC-USD",
          entryPrice: 48000,
          exitPrice: 0, // Open trade
          quantity: 0.3,
          entryDate: new Date("2024-03-01"),
          exitDate: null,
          isOpen: true,
        },
      ];

      setTrades(mockTrades);
      calculateResults(mockTrades);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching trade data:", error);
      setIsLoading(false);
    }
  };

  // Calculate profit/loss and statistics based on trades
  const calculateResults = (tradeData: Trade[]) => {
    let filteredTrades = [...tradeData];

    // Apply date filter
    if (dateRange.from && dateRange.to) {
      filteredTrades = filteredTrades.filter(
        trade =>
          trade.entryDate >= dateRange.from! &&
          (trade.exitDate ? trade.exitDate <= dateRange.to! : true),
      );
    }

    // Apply symbol filter
    if (selectedSymbol !== "all") {
      filteredTrades = filteredTrades.filter(
        trade => trade.symbol === selectedSymbol,
      );
    }

    // Calculate total P/L
    const totalPL = filteredTrades.reduce((sum, trade) => {
      if (trade.isOpen) {
        // For open trades, use current market price (mock this for now)
        const currentPrice = trade.symbol === "BTC-USD" ? 50000 : 3500;
        return sum + (currentPrice - trade.entryPrice) * trade.quantity;
      } else {
        return sum + (trade.exitPrice - trade.entryPrice) * trade.quantity;
      }
    }, 0);

    // Calculate win rate
    const closedTrades = filteredTrades.filter(trade => !trade.isOpen);
    const winningTrades = closedTrades.filter(
      trade => trade.exitPrice > trade.entryPrice,
    );
    const winRate =
      closedTrades.length > 0
        ? winningTrades.length / closedTrades.length * 100
        : 0;

    // Calculate average return per trade
    const avgReturn =
      closedTrades.length > 0
        ? closedTrades.reduce(
            (sum, trade) =>
              sum + (trade.exitPrice - trade.entryPrice) / trade.entryPrice,
            0,
          ) /
          closedTrades.length *
          100
        : 0;

    setProfitLoss(totalPL);
    setPeriodStats({
      totalProfit: totalPL,
      winRate: winRate,
      tradeCount: filteredTrades.length,
      averageReturn: avgReturn,
    });
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchTradeData();
  }, []);

  // Recalculate when filters change
  useEffect(
    () => {
      if (trades.length > 0) {
        calculateResults(trades);
      }
    },
    [dateRange, selectedSymbol, trades],
  );

  // Get unique symbols from trades for filter dropdown
  const uniqueSymbols = [...new Set(trades.map(trade => trade.symbol))];

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Trading Reports</h1>

      {/* Filters section */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <Card className="bg-gray-800 border-gray-700 flex-1">
          <CardHeader>
            <CardTitle className="text-lg">Date Range</CardTitle>
          </CardHeader>
          <CardContent>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  {dateRange.from
                    ? dateRange.from.toLocaleDateString()
                    : "Start"}{" "}
                  -
                  {dateRange.to ? dateRange.to.toLocaleDateString() : "End"}
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-800 text-white">
                <DialogHeader>
                  <DialogTitle>Select Date Range</DialogTitle>
                </DialogHeader>
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={range =>
                    setDateRange(range || { from: undefined, to: undefined })}
                  className="bg-gray-800 text-white"
                />
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700 flex-1">
          <CardHeader>
            <CardTitle className="text-lg">Symbol</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
              <SelectTrigger>
                <SelectValue placeholder="Select Symbol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Symbols</SelectItem>
                {uniqueSymbols.map(symbol =>
                  <SelectItem key={symbol} value={symbol}>
                    {symbol}
                  </SelectItem>,
                )}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700 flex-1">
          <CardHeader>
            <CardTitle className="text-lg">Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => fetchTradeData()} disabled={isLoading}>
              {isLoading ? "Refreshing..." : "Refresh Data"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Main content */}
      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="trades">Trades</TabsTrigger>
          <TabsTrigger value="charts">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg">Total P/L</CardTitle>
              </CardHeader>
              <CardContent>
                <p
                  className={`text-2xl font-bold ${profitLoss && profitLoss > 0
                    ? "text-green-500"
                    : "text-red-500"}`}
                >
                  {profitLoss !== null
                    ? `$${profitLoss.toFixed(2)}`
                    : "Loading..."}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg">Win Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {periodStats.winRate.toFixed(1)}%
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg">Total Trades</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {periodStats.tradeCount}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg">Avg Return</CardTitle>
              </CardHeader>
              <CardContent>
                <p
                  className={`text-2xl font-bold ${periodStats.averageReturn > 0
                    ? "text-green-500"
                    : "text-red-500"}`}
                >
                  {periodStats.averageReturn.toFixed(2)}%
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trades">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle>Trade History</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading
                ? <p>Loading trades...</p>
                : <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="text-left p-2">Symbol</th>
                          <th className="text-left p-2">Entry Date</th>
                          <th className="text-left p-2">Exit Date</th>
                          <th className="text-right p-2">Entry Price</th>
                          <th className="text-right p-2">Exit Price</th>
                          <th className="text-right p-2">Quantity</th>
                          <th className="text-right p-2">P/L</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trades.map(trade => {
                          const pl = trade.isOpen
                            ? "Open"
                            : ((trade.exitPrice - trade.entryPrice) *
                                trade.quantity).toFixed(2);
                          const plClass =
                            !trade.isOpen &&
                            trade.exitPrice - trade.entryPrice > 0
                              ? "text-green-500"
                              : "text-red-500";

                          return (
                            <tr
                              key={trade.id}
                              className="border-b border-gray-700"
                            >
                              <td className="p-2">
                                {trade.symbol}
                              </td>
                              <td className="p-2">
                                {trade.entryDate.toLocaleDateString()}
                              </td>
                              <td className="p-2">
                                {trade.exitDate
                                  ? trade.exitDate.toLocaleDateString()
                                  : "Open"}
                              </td>
                              <td className="text-right p-2">
                                ${trade.entryPrice.toFixed(2)}
                              </td>
                              <td className="text-right p-2">
                                {trade.isOpen
                                  ? "-"
                                  : `$${trade.exitPrice.toFixed(2)}`}
                              </td>
                              <td className="text-right p-2">
                                {trade.quantity}
                              </td>
                              <td
                                className={`text-right p-2 ${trade.isOpen
                                  ? ""
                                  : plClass}`}
                              >
                                {trade.isOpen ? "Open" : `$${pl}`}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="charts">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle>Performance Charts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-lg py-12">
                Performance visualization charts would go here.
                <br />
                (Implement with Recharts or another charting library)
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reporting;
