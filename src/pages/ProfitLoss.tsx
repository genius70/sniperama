import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ArrowUpCircle, ArrowDownCircle } from "lucide-react";

interface Transaction {
  id: string;
  token: string;
  amount: number;
  buyPrice: number;
  sellPrice: number | null;
  timestamp: number;
  status: "active" | "sold";
  profit?: number;
  profitPercentage?: number;
}

const ProfitLoss: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [timeframe, setTimeframe] = useState<string>("week");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [totalProfit, setTotalProfit] = useState<number>(0);
  const [profitChange, setProfitChange] = useState<number>(0);

  useEffect(
    () => {
      // This would be replaced with your actual contract call
      const fetchTransactionData = async () => {
        setIsLoading(true);
        try {
          // Simulated data - replace with actual contract interaction
          const mockData: Transaction[] = [
            {
              id: "0x1234",
              token: "ETH",
              amount: 1.5,
              buyPrice: 2800,
              sellPrice: 3200,
              timestamp: Date.now() - 86400000 * 2,
              status: "sold",
              profit: 600,
              profitPercentage: 14.28,
            },
            {
              id: "0x2345",
              token: "BNB",
              amount: 10,
              buyPrice: 320,
              sellPrice: 350,
              timestamp: Date.now() - 86400000 * 4,
              status: "sold",
              profit: 300,
              profitPercentage: 9.37,
            },
            {
              id: "0x3456",
              token: "SOL",
              amount: 50,
              buyPrice: 98,
              sellPrice: null,
              timestamp: Date.now() - 86400000 * 1,
              status: "active",
            },
            {
              id: "0x4567",
              token: "AVAX",
              amount: 25,
              buyPrice: 32,
              sellPrice: 28,
              timestamp: Date.now() - 86400000 * 3,
              status: "sold",
              profit: -100,
              profitPercentage: -12.5,
            },
          ];

          setTransactions(mockData);

          // Calculate total profit
          const profit = mockData
            .filter(tx => tx.status === "sold")
            .reduce((acc, tx) => acc + (tx.profit || 0), 0);

          setTotalProfit(profit);
          setProfitChange(profit > 0 ? 12.5 : -8.3); // Mock data for profit change
        } catch (error) {
          console.error("Failed to fetch transaction data:", error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchTransactionData();
    },
    [timeframe],
  );

  const chartData = transactions.filter(tx => tx.status === "sold").map(tx => ({
    id: tx.id.substring(0, 6),
    token: tx.token,
    profit: tx.profit || 0,
  }));

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Profit & Loss</CardTitle>
        <CardDescription>Overview of your trading performance</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="flex flex-col p-4 border rounded-lg">
            <span className="text-sm text-gray-500">Total Profit/Loss</span>
            <div className="flex items-center mt-2">
              <span
                className={`text-2xl font-bold ${totalProfit >= 0
                  ? "text-green-600"
                  : "text-red-600"}`}
              >
                ${totalProfit.toFixed(2)}
              </span>
              <div
                className={`flex items-center ml-2 ${profitChange >= 0
                  ? "text-green-600"
                  : "text-red-600"}`}
              >
                {profitChange >= 0
                  ? <ArrowUpCircle size={16} />
                  : <ArrowDownCircle size={16} />}
                <span className="text-sm ml-1">
                  {Math.abs(profitChange)}%
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-end justify-end">
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">24 Hours</SelectItem>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="year">Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="h-64 mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="token" />
              <YAxis />
              <Tooltip />
              <Bar
                dataKey="profit"
                fill={entry => (entry.profit >= 0 ? "#10b981" : "#ef4444")}
                name="Profit/Loss"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Token</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Buy Price</TableHead>
              <TableHead>Sell Price</TableHead>
              <TableHead>Profit/Loss</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    Loading transaction data...
                  </TableCell>
                </TableRow>
              : transactions.length === 0
                ? <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      No transactions found
                    </TableCell>
                  </TableRow>
                : transactions.map(tx =>
                    <TableRow key={tx.id}>
                      <TableCell className="font-medium">
                        {tx.token}
                      </TableCell>
                      <TableCell>
                        {tx.amount}
                      </TableCell>
                      <TableCell>
                        ${tx.buyPrice}
                      </TableCell>
                      <TableCell>
                        {tx.sellPrice ? `$${tx.sellPrice}` : "-"}
                      </TableCell>
                      <TableCell
                        className={
                          tx.profit && tx.profit >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {tx.profit
                          ? `$${tx.profit} (${tx.profitPercentage}%)`
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${tx.status ===
                          "active"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"}`}
                        >
                          {tx.status === "active" ? "Active" : "Sold"}
                        </span>
                      </TableCell>
                    </TableRow>,
                  )}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">Export Data</Button>
        <Button>Refresh</Button>
      </CardFooter>
    </Card>
  );
};

export default ProfitLoss;
