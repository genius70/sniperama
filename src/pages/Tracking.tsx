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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Plus, Search, Bell, ExternalLink, Activity } from "lucide-react";

interface TokenTrack {
  id: string;
  name: string;
  symbol: string;
  address: string;
  network: string;
  currentPrice: number;
  priceChange24h: number;
  alertPrice: number | null;
  alertType: "above" | "below" | null;
  addedAt: number;
  priceHistory: {
    timestamp: number;
    price: number;
  }[];
}

interface SnipeJob {
  id: string;
  tokenName: string;
  tokenSymbol: string;
  tokenAddress: string;
  network: string;
  status: "pending" | "active" | "completed" | "failed";
  conditions: {
    maxPrice?: number;
    minLiquidity?: number;
    gasLimit?: number;
  };
  createdAt: number;
}

const Tracking: React.FC = () => {
  const [trackedTokens, setTrackedTokens] = useState<TokenTrack[]>([]);
  const [snipeJobs, setSnipeJobs] = useState<SnipeJob[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedToken, setSelectedToken] = useState<TokenTrack | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("tokens");

  useEffect(() => {
    // This would be replaced with your actual contract/API calls
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Simulated data - replace with actual contract interaction
        const mockTokens: TokenTrack[] = [
          {
            id: "1",
            name: "Ethereum",
            symbol: "ETH",
            address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
            network: "Ethereum",
            currentPrice: 3156.78,
            priceChange24h: 2.45,
            alertPrice: 3500,
            alertType: "above",
            addedAt: Date.now() - 86400000 * 7,
            priceHistory: Array.from({ length: 7 }, (_, i) => ({
              timestamp: Date.now() - 86400000 * (7 - i),
              price: 3000 + Math.random() * 200,
            })),
          },
          {
            id: "2",
            name: "Binance Coin",
            symbol: "BNB",
            address: "0xB8c77482e45F1F44dE1745F52C74426C631bDD52",
            network: "BSC",
            currentPrice: 345.21,
            priceChange24h: -1.23,
            alertPrice: 300,
            alertType: "below",
            addedAt: Date.now() - 86400000 * 14,
            priceHistory: Array.from({ length: 7 }, (_, i) => ({
              timestamp: Date.now() - 86400000 * (7 - i),
              price: 340 + Math.random() * 20,
            })),
          },
          {
            id: "3",
            name: "Solana",
            symbol: "SOL",
            address: "0x9e5aac1ba1a2e6aed6b32689dfcf62a509ca96f3",
            network: "Solana",
            currentPrice: 103.45,
            priceChange24h: 5.67,
            alertPrice: null,
            alertType: null,
            addedAt: Date.now() - 86400000 * 3,
            priceHistory: Array.from({ length: 7 }, (_, i) => ({
              timestamp: Date.now() - 86400000 * (7 - i),
              price: 95 + Math.random() * 15,
            })),
          },
        ];

        const mockSnipeJobs: SnipeJob[] = [
          {
            id: "1",
            tokenName: "NewToken",
            tokenSymbol: "NTK",
            tokenAddress: "0x1234567890abcdef1234567890abcdef12345678",
            network: "Ethereum",
            status: "active",
            conditions: {
              maxPrice: 0.001,
              minLiquidity: 100000,
              gasLimit: 500000,
            },
            createdAt: Date.now() - 3600000 * 5,
          },
          {
            id: "2",
            tokenName: "LaunchToken",
            tokenSymbol: "LNCH",
            tokenAddress: "0xabcdef1234567890abcdef1234567890abcdef12",
            network: "BSC",
            status: "pending",
            conditions: {
              maxPrice: 0.0005,
              minLiquidity: 50000,
              gasLimit: 300000,
            },
            createdAt: Date.now() - 3600000 * 2,
          },
          {
            id: "3",
            tokenName: "CompletedToken",
            tokenSymbol: "CTKN",
            tokenAddress: "0x7890abcdef1234567890abcdef1234567890abcd",
            network: "Ethereum",
            status: "completed",
            conditions: {
              maxPrice: 0.002,
              minLiquidity: 200000,
              gasLimit: 400000,
            },
            createdAt: Date.now() - 86400000 * 2,
          },
        ];

        setTrackedTokens(mockTokens);
        setSnipeJobs(mockSnipeJobs);
      } catch (error) {
        console.error("Failed to fetch tracking data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredTokens = trackedTokens.filter(
    token =>
      token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.symbol.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleTokenSelect = (token: TokenTrack) => {
    setSelectedToken(token);
  };

  const handleAddToken = () => {
    setIsAddDialogOpen(true);
  };

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";

    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";

    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";

    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";

    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";

    return Math.floor(seconds) + " seconds ago";
  };

  return (
    <div className="space-y-6">
      <Tabs
        defaultValue="tokens"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <TabsList className="mb-4">
          <TabsTrigger value="tokens">Tracked Tokens</TabsTrigger>
          <TabsTrigger value="snipes">Snipe Jobs</TabsTrigger>
        </TabsList>

        <TabsContent value="tokens">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Token Tracking</CardTitle>
                  <CardDescription>
                    Monitor token prices and set alerts
                  </CardDescription>
                </div>
                <Button onClick={handleAddToken}>
                  <Plus className="mr-2 h-4 w-4" /> Add Token
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name or symbol..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Token</TableHead>
                    <TableHead>Network</TableHead>
                    <TableHead>Current Price</TableHead>
                    <TableHead>24h Change</TableHead>
                    <TableHead>Alert</TableHead>
                    <TableHead>Added</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading
                    ? <TableRow>
                        <TableCell colSpan={7} className="text-center">
                          Loading tokens...
                        </TableCell>
                      </TableRow>
                    : filteredTokens.length === 0
                      ? <TableRow>
                          <TableCell colSpan={7} className="text-center">
                            No tokens found
                          </TableCell>
                        </TableRow>
                      : filteredTokens.map(token =>
                          <TableRow
                            key={token.id}
                            onClick={() => handleTokenSelect(token)}
                            className="cursor-pointer"
                          >
                            <TableCell className="font-medium">
                              <div className="flex items-center">
                                <div className="w-6 h-6 bg-gray-200 rounded-full mr-2 flex items-center justify-center">
                                  {token.symbol.charAt(0)}
                                </div>
                                <div>
                                  <div>
                                    {token.name}
                                  </div>
                                  <div className="text-gray-500 text-xs">
                                    {token.symbol}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {token.network}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              ${token.currentPrice.toFixed(2)}
                            </TableCell>
                            <TableCell
                              className={
                                token.priceChange24h >= 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }
                            >
                              {token.priceChange24h >= 0 ? "+" : ""}
                              {token.priceChange24h.toFixed(2)}%
                            </TableCell>
                            <TableCell>
                              {token.alertPrice
                                ? <div className="flex items-center">
                                    <Bell className="h-4 w-4 mr-1" />
                                    <span>
                                      {token.alertType === "above"
                                        ? ">"
                                        : "<"}{" "}
                                      ${token.alertPrice}
                                    </span>
                                  </div>
                                : <span className="text-gray-400">None</span>}
                            </TableCell>
                            <TableCell>
                              {formatTimeAgo(token.addedAt)}
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button size="sm" variant="outline">
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="outline">
                                  <Activity className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>,
                        )}
                </TableBody>
              </Table>

              {selectedToken &&
                <div className="mt-6 p-4 border rounded-lg">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">
                      {selectedToken.name} ({selectedToken.symbol})
                    </h3>
                    <Badge variant="outline">
                      {selectedToken.network}
                    </Badge>
                  </div>

                  <div className="h-64 mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={selectedToken.priceHistory.map(p => ({
                          date: new Date(p.timestamp).toLocaleDateString(),
                          price: p.price,
                        }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis domain={["auto", "auto"]} />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="price"
                          stroke="#8884d8"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-3 border rounded">
                      <div className="text-sm text-gray-500">Current Price</div>
                      <div className="text-xl font-bold">
                        ${selectedToken.currentPrice.toFixed(2)}
                      </div>
                    </div>
                    <div className="p-3 border rounded">
                      <div className="text-sm text-gray-500">24h Change</div>
                      <div
                        className={`text-xl font-bold ${selectedToken.priceChange24h >=
                        0
                          ? "text-green-600"
                          : "text-red-600"}`}
                      >
                        {selectedToken.priceChange24h >= 0 ? "+" : ""}
                        {selectedToken.priceChange24h.toFixed(2)}%
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button variant="outline">Set Alert</Button>
                    <Button variant="outline">Create Snipe Job</Button>
                    <Button>Trade Now</Button>
                  </div>
                </div>}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Export Data</Button>
              <Button>Refresh</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="snipes">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Snipe Jobs</CardTitle>
                  <CardDescription>
                    Automated token purchase operations
                  </CardDescription>
                </div>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> New Snipe Job
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Token</TableHead>
                    <TableHead>Network</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Conditions</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading
                    ? <TableRow>
                        <TableCell colSpan={6} className="text-center">
                          Loading snipe jobs...
                        </TableCell>
                      </TableRow>
                    : snipeJobs.length === 0
                      ? <TableRow>
                          <TableCell colSpan={6} className="text-center">
                            No snipe jobs found
                          </TableCell>
                        </TableRow>
                      : snipeJobs.map(job =>
                          <TableRow key={job.id}>
                            <TableCell className="font-medium">
                              <div>
                                <div>
                                  {job.tokenName}
                                </div>
                                <div className="text-gray-500 text-xs">
                                  {job.tokenSymbol}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {job.network}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  job.status === "active"
                                    ? "bg-green-100 text-green-800"
                                    : job.status === "pending"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : job.status === "completed"
                                        ? "bg-blue-100 text-blue-800"
                                        : "bg-red-100 text-red-800"
                                }
                              >
                                {job.status.charAt(0).toUpperCase() +
                                  job.status.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-xs space-y-1">
                                {job.conditions.maxPrice &&
                                  <div>
                                    Max Price: ${job.conditions.maxPrice}
                                  </div>}
                                {job.conditions.minLiquidity &&
                                  <div>
                                    Min Liquidity: ${job.conditions.minLiquidity.toLocaleString()}
                                  </div>}
                                {job.conditions.gasLimit &&
                                  <div>
                                    Gas Limit:{" "}
                                    {job.conditions.gasLimit.toLocaleString()}
                                  </div>}
                              </div>
                            </TableCell>
                            <TableCell>
                              {formatTimeAgo(job.createdAt)}
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button size="sm" variant="outline">
                                  Edit
                                </Button>
                                {job.status === "active" ||
                                job.status === "pending"
                                  ? <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-red-600"
                                    >
                                      Cancel
                                    </Button>
                                  : <Button size="sm" variant="outline">
                                      View
                                    </Button>}
                              </div>
                            </TableCell>
                          </TableRow>,
                        )}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">History</Button>
              <Button>Refresh</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogTrigger/>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Token to Track</DialogTitle>
            <DialogDescription>
              Enter the token details you want to track
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="text-sm font-medium">Token Address</label>
                <Input placeholder="0x..." />
              </div>
              <div>
                <label className="text-sm font-medium">Network</label>
                <select title="chain" className="w-full p-2 border rounded">
                  <option>Ethereum</option>
                  <option>BSC</option>
                  <option>Polygon</option>
                  <option>Arbitrum</option>
                  <option>Solana</option>
                </select>
              </div>
            </div>
             
            <div>
                
              <label className="text-sm font-medium">Alert (Optional)</label>
              <div className="flex gap-2 mt-1">
                <select title="profit" className="p-2 border rounded">
                  <option>Above</option>
                  <option>Below</option>
                </select>
                <Input placeholder="Price" type="number" />
              </div>
              
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button>Add Token</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Tracking;
