/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { ChevronRight, RefreshCcw, Wallet } from 'lucide-react';

// Chain configuration
const CHAINS = {
  AVALANCHE: {
    name: 'Avalanche',
    chainId: '0xa86a', // 43114 in hex
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    currency: 'AVAX',
    contractAddress: '0x1234567890123456789012345678901234567890',
    blockExplorer: 'https://snowtrace.io',
    icon: '🔺'
  },
  POLYGON: {
    name: 'Polygon',
    chainId: '0x89', // 137 in hex
    rpcUrl: 'https://polygon-rpc.com',
    currency: 'MATIC',
    contractAddress: '0x2345678901234567890123456789012345678901',
    blockExplorer: 'https://polygonscan.com',
    icon: '🟣'
  },
  FANTOM: {
    name: 'Fantom',
    chainId: '0xfa', // 250 in hex
    rpcUrl: 'https://rpcapi.fantom.network',
    currency: 'FTM',
    contractAddress: '0x3456789012345678901234567890123456789012',
    blockExplorer: 'https://ftmscan.com',
    icon: '👻'
  }
};

export default function BlockchainSelector() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [account, setAccount] = useState('');
  const [selectedChain, setSelectedChain] = useState('AVALANCHE');
  const [provider, setProvider] = useState(null);
  const [userBalance, setUserBalance] = useState('0');
  const [tokenAddress, setTokenAddress] = useState('');
  const [amountToSpend, setAmountToSpend] = useState('');
  const [recentTokens, setRecentTokens] = useState([]);
  const [activeSnipes, setActiveSnipes] = useState([]);

  // Switch network in Metamask
  const switchNetwork = async (chainKey) => {
    if (!window.ethereum) return;
    
    const chain = CHAINS[chainKey];
    
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chain.chainId }],
      });
      return true;
    } catch (switchError) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: chain.chainId,
                chainName: chain.name,
                nativeCurrency: {
                  name: chain.currency,
                  symbol: chain.currency,
                  decimals: 18
                },
                rpcUrls: [chain.rpcUrl],
                blockExplorerUrls: [chain.blockExplorer]
              },
            ],
          });
          return true;
        } catch (addError) {
          console.error('Error adding chain', addError);
          return false;
        }
      } else {
        console.error('Error switching chain', switchError);
        return false;
      }
    }
  };

  // Connect to wallet
  const connectWallet = async (chainKey = selectedChain) => {
    try {
      setLoading(true);
      
      if (!window.ethereum) {
        toast({
          variant: "destructive",
          title: "Wallet Error",
          description: "Please install MetaMask or another Web3 wallet",
        });
        return;
      }
      
      // Switch to the selected network first
      const switched = await switchNetwork(chainKey);
      if (!switched) {
        toast({
          variant: "destructive",
          title: "Network Switch Failed",
          description: `Failed to switch to ${CHAINS[chainKey].name} network.`,
        });
        return;
      }
      
      // Connect to wallet
      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      await web3Provider.send('eth_requestAccounts', []);
      const signer = web3Provider.getSigner();
      const address = await signer.getAddress();
      
      // Get balance
      const balance = await web3Provider.getBalance(address);
      setUserBalance(parseFloat(ethers.utils.formatEther(balance)).toFixed(4));
      
      // Update state
      setProvider(web3Provider);
      setAccount(address);
      setConnected(true);
      setSelectedChain(chainKey);
      
      toast({
        title: "Wallet Connected",
        description: `Connected to ${CHAINS[chainKey].name} as ${address.substring(0, 6)}...${address.substring(address.length - 4)}`,
      });
      
      // Load mock data for demo
      fetchMockData(chainKey);
      
    } catch (error) {
      console.error("Connection Error:", error);
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: "Failed to connect to wallet. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle tab change
  const handleTabChange = async (chainKey) => {
    if (connected) {
      // If already connected, switch network
      setLoading(true);
      const switched = await switchNetwork(chainKey);
      if (switched) {
        setSelectedChain(chainKey);
        fetchMockData(chainKey);
        toast({
          title: "Network Switched",
          description: `Switched to ${CHAINS[chainKey].name} network`,
        });
      }
      setLoading(false);
    } else {
      // Just update the selected tab
      setSelectedChain(chainKey);
    }
  };

  // Fetch mock data (in real app, would fetch from blockchain)
  const fetchMockData = (chainKey) => {
    const chain = CHAINS[chainKey];
    
    // Mock recent tokens
    setRecentTokens([
      { 
        address: `0xa1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2`, 
        name: `New${chain.currency}Token`, 
        symbol: `N${chain.currency.substring(0, 2)}T`, 
        launchTime: new Date().toISOString(),
        initialPrice: "0.0000001",
        liquidityLocked: "25%",
        lockPeriod: "180 days"
      },
      { 
        address: `0xb2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3`, 
        name: `${chain.name}Rocket`, 
        symbol: `${chain.currency.substring(0, 1)}RKT`, 
        launchTime: new Date(Date.now() - 300000).toISOString(),
        initialPrice: "0.00000025",
        liquidityLocked: "30%",
        lockPeriod: "365 days"
      },
    ]);
    
    // Mock active snipes
    setActiveSnipes([
      {
        tokenAddress: "0xc3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4",
        purchaseAmount: "0.5",
        tokenAmount: "1250000",
        purchaseTime: new Date(Date.now() - 3600000).toLocaleString(),
        purchasePrice: "0.0000004",
        currentPrice: "0.0000006",
        profitLoss: "+50%",
        index: 0
      }
    ]);
  };

  // Execute mock snipe (in real app, would interact with contract)
  const executeSnipe = async () => {
    if (!tokenAddress || !amountToSpend || parseFloat(amountToSpend) <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid Input",
        description: "Please enter a valid token address and amount",
      });
      return;
    }
    
    try {
      setLoading(true);
      
      // Simulate blockchain delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const chain = CHAINS[selectedChain];
      
      // Add to active snipes (mock data)
      setActiveSnipes([
        ...activeSnipes,
        {
          tokenAddress,
          purchaseAmount: amountToSpend,
          tokenAmount: (parseFloat(amountToSpend) * 1000000).toString(),
          purchaseTime: new Date().toLocaleString(),
          purchasePrice: "0.0000001",
          currentPrice: "0.0000001",
          profitLoss: "0%",
          index: activeSnipes.length
        }
      ]);
      
      toast({
        title: "Snipe Executed",
        description: `Successfully sniped token on ${chain.name} network`,
      });
      
      // Clear inputs
      setTokenAddress('');
      setAmountToSpend('');
      
    } catch (error) {
      console.error("Snipe error:", error);
      toast({
        variant: "destructive",
        title: "Snipe Failed",
        description: "Failed to execute snipe. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Set up listeners for wallet events
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', () => {
        window.location.reload();
      });
      
      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }
    
    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners();
      }
    };
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Multi-Chain Sniperama Bot</h1>
      
      <Tabs
        defaultValue={selectedChain}
        value={selectedChain}
        onValueChange={handleTabChange}
        className="mb-6"
      >
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="AVALANCHE" disabled={loading}>
            {CHAINS.AVALANCHE.icon} Avalanche
          </TabsTrigger>
          <TabsTrigger value="POLYGON" disabled={loading}>
            {CHAINS.POLYGON.icon} Polygon
          </TabsTrigger>
          <TabsTrigger value="FANTOM" disabled={loading}>
            {CHAINS.FANTOM.icon} Fantom
          </TabsTrigger>
        </TabsList>
        
        {Object.keys(CHAINS).map(chainKey => (
          <TabsContent key={chainKey} value={chainKey} className="mt-0">
            {!connected ? (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>{CHAINS[chainKey].icon} Connect to {CHAINS[chainKey].name}</CardTitle>
                  <CardDescription>Connect your wallet to use the Sniperama bot on {CHAINS[chainKey].name}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>To use this application, you'll need to:</p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Have MetaMask or a similar Web3 wallet installed</li>
                    <li>Have some {CHAINS[chainKey].currency} for transaction fees and sniping</li>
                    <li>Be connected to the {CHAINS[chainKey].name} network</li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button onClick={() => connectWallet(chainKey)} disabled={loading} className="w-full">
                    {loading ? <RefreshCcw className="mr-2 h-4 w-4 animate-spin" /> : <Wallet className="mr-2 h-4 w-4" />}
                    Connect to {CHAINS[chainKey].name}
                  </Button>
                </CardFooter>
              </Card>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">Connected to {CHAINS[chainKey].name}</h2>
                    <p className="text-sm text-gray-500">{account.substring(0, 6)}...{account.substring(account.length - 4)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Your Balance</p>
                    <p className="font-semibold">{userBalance} {CHAINS[chainKey].currency}</p>
                  </div>
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Execute Snipe on {CHAINS[chainKey].name}</CardTitle>
                    <CardDescription>Snipe a new token on the {CHAINS[chainKey].name} network</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid w-full items-center gap-1.5">
                      <Label htmlFor="tokenAddress">Token Address</Label>
                      <Input
                        id="tokenAddress"
                        placeholder="0x..."
                        value={tokenAddress}
                        onChange={(e) => setTokenAddress(e.target.value)}
                      />
                    </div>
                    
                    <div className="grid w-full items-center gap-1.5">
                      <Label htmlFor="snipeAmount">Amount to Spend ({CHAINS[chainKey].currency})</Label>
                      <Input
                        id="snipeAmount"
                        type="number"
                        placeholder="0.1"
                        value={amountToSpend}
                        onChange={(e) => setAmountToSpend(e.target.value)}
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full" 
                      onClick={executeSnipe}
                      disabled={loading || !tokenAddress || !amountToSpend}
                    >
                      {loading ? <RefreshCcw className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Execute Snipe on {CHAINS[chainKey].name}
                    </Button>
                  </CardFooter>
                </Card>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Active Snipes</CardTitle>
                      <CardDescription>Your currently active token positions on {CHAINS[chainKey].name}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {activeSnipes.length === 0 ? (
                        <p className="text-gray-500">No active snipes on {CHAINS[chainKey].name}</p>
                      ) : (
                        <div className="space-y-4">
                          {activeSnipes.map((snipe, i) => (
                            <div key={i} className="border rounded-lg p-4">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h3 className="font-medium">Token: {snipe.tokenAddress.substring(0, 6)}...{snipe.tokenAddress.substring(38)}</h3>
                                  <p className="text-sm text-gray-500">Purchased: {snipe.purchaseTime}</p>
                                </div>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  disabled={loading}
                                >
                                  Sell Token
                                </Button>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                                <div>Amount Spent: {snipe.purchaseAmount} {CHAINS[chainKey].currency}</div>
                                <div>Tokens Received: {snipe.tokenAmount}</div>
                                <div>Purchase Price: ${snipe.purchasePrice}</div>
                                <div>Current Price: ${snipe.currentPrice}</div>
                                <div>Profit/Loss: {snipe.profitLoss}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Token Launches</CardTitle>
                      <CardDescription>Recently launched tokens on {CHAINS[chainKey].name}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {recentTokens.length === 0 ? (
                        <p className="text-gray-500">No recent tokens found on {CHAINS[chainKey].name}</p>
                      ) : (
                        <div className="space-y-4">
                          {recentTokens.map((token, i) => (
                            <div key={i} className="border rounded-lg p-4">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h3 className="font-medium">{token.name} ({token.symbol})</h3>
                                  <p className="text-sm text-gray-500">Launched: {new Date(token.launchTime).toLocaleString()}</p>
                                </div>
                                <Button 
                                  size="sm"
                                  onClick={() => {
                                    setTokenAddress(token.address);
                                    document.getElementById('snipeAmount')?.focus();
                                  }}
                                >
                                  Snipe
                                </Button>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                                <div>Address: {token.address.substring(0, 6)}...{token.address.substring(38)}</div>
                                <div>Initial Price: ${token.initialPrice}</div>
                                <div>Liquidity Locked: {token.liquidityLocked}</div>
                                <div>Lock Period: {token.lockPeriod}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}