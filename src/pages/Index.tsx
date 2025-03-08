/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { ChevronRight, RefreshCcw } from 'lucide-react';
import { useWallet } from "@/hooks/useWallet";

//import SniperamaABI from '../abis/Sniperama.json';
//import { SniperamaContract, UserBalance} from '../types/interfaces'; /* UserBalance */ 

// Contract address on Avalanche
const CONTRACT_ADDRESS = "0x1234567890123456789012345678901234567890"; // Replace with actual contract address

export default function Index() {
    
  const { toast } = useToast();
  const [loading, setLoading] = useState<boolean>(false);
  const [connected, setConnected] = useState<boolean>(false);
  const [account, setAccount] = useState<string>('');
  const [contract, setContract] = useState<SniperamaContract | null>(null);
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [userBalance, setUserBalance] = useState<string>('0');
  const [tokenAddress, setTokenAddress] = useState<string>('');
  const [amountToSpend, setAmountToSpend] = useState<string>('');
  const [recentTokens, setRecentTokens] = useState<unknown[]>([]);
  const [activeSnipes, setActiveSnipes] = useState<unknown[]>([]);

  // Connect to wallet and contract
  const connectWallet = async (): Promise<void> => {
    try {
      setLoading(true);
      
      if (window.ethereum) {
        const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
        await web3Provider.send('eth_requestAccounts', []);
        const signer = web3Provider.getSigner();
        const address = await signer.getAddress();
        
        // Initialize contract
        const sniperamaContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          SniperamaABI,
          signer
        ) as SniperamaContract;
        
        setProvider(web3Provider);
        setContract(sniperamaContract);
        setAccount(address);
        setConnected(true);
        setAccount(UserBalance);
        UseWallet();
        // Get user balance from contract
        const funds = await sniperamaContract.userFunds(address);
        setUserBalance(ethers.utils.formatEther(funds));
        
        // Get active snipes
        await fetchActiveSnipes();
        
        toast({
          title: "Wallet Connected",
          description: `Connected to ${address.substring(0, 6)}...${address.substring(address.length - 4)}`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Wallet Error",
          description: "Please install MetaMask or another Web3 wallet",
        });
      }
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

  // Fetch recent tokens from API or blockchain
  const fetchRecentTokens = async (): Promise<void> => {
    try {
      // This would normally call an API that monitors for new token listings
      // For demo purposes, we'll use placeholder data
      setRecentTokens([
        { 
          address: "0xa1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2", 
          name: "NewToken", 
          symbol: "NTK", 
          launchTime: new Date().toISOString(),
          initialPrice: "0.0000001",
          liquidityLocked: "25%",
          lockPeriod: "180 days"
        },
        { 
          address: "0xb2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3", 
          name: "AvalancheRocket", 
          symbol: "AVRKT", 
          launchTime: new Date(Date.now() - 300000).toISOString(),
          initialPrice: "0.00000025",
          liquidityLocked: "30%",
          lockPeriod: "365 days"
        },
      ]);
    } catch (error) {
      console.error("Error fetching tokens:", error);
    }
  };

  // Fetch active snipes from contract
  const fetchActiveSnipes = async (): Promise<void> => {
    if (!contract || !account) return;
    
    try {
      const purchases = await contract.getUserPurchases(account);
      
      // Filter for active (unsold) purchases
      const active = purchases.filter((p: unknown) => !p.sold).map((p: unknown) => ({
        tokenAddress: p.tokenAddress,
        purchaseAmount: ethers.utils.formatEther(p.purchaseAmount),
        tokenAmount: p.tokenAmount.toString(),
        purchaseTime: new Date(p.purchaseTimestamp.toNumber() * 1000).toLocaleString(),
        purchasePrice: ethers.utils.formatEther(p.purchasePrice),
        index: purchases.indexOf(p)
      }));
      
      setActiveSnipes(active);
    } catch (error) {
      console.error("Error fetching active snipes:", error);
    }
  };

  // Deposit funds to contract
  const depositFunds = async (): Promise<void> => {
    if (!contract || !provider) return;
    
    try {
      setLoading(true);
      const amountWei = ethers.utils.parseEther(amountToSpend);
      
      const tx = await contract.connect(provider.getSigner()).deposit({
        value: amountWei
      });
      
      await tx.wait();
      
      // Update balance
      const funds = await contract.userFunds(account);
      setUserBalance(ethers.utils.formatEther(funds));
      
      toast({
        title: "Deposit Successful",
        description: `${amountToSpend} AVAX deposited to bot`,
      });
      
      setAmountToSpend('');
    } catch (error) {
      console.error("Deposit error:", error);
      toast({
        variant: "destructive",
        title: "Deposit Failed",
        description: "Failed to deposit funds. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Execute snipe
  const executeSnipe = async (): Promise<void> => {
    if (!contract || !tokenAddress) return;
    
    try {
      setLoading(true);
      const amountWei = ethers.utils.parseEther(amountToSpend);
      
      // Check if token meets criteria
      const tx = await contract.executeSnipe(tokenAddress, amountWei);
      await tx.wait();
      
      toast({
        title: "Snipe Executed",
        description: `Successfully sniped token at address ${tokenAddress.substring(0, 6)}...`,
      });
      
      // Update user's balance
      const funds = await contract.userFunds(account);
      setUserBalance(ethers.utils.formatEther(funds));
      
      // Refresh active snipes
      await fetchActiveSnipes();
      
      // Clear form
      setTokenAddress('');
      setAmountToSpend('');
    } catch (error: unknown) {
      console.error("Snipe error:", error);
      toast({
        variant: "destructive",
        title: "Snipe Failed",
        description: error.message || "Failed to execute snipe. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Check and sell tokens if needed
  const checkAndSell = async (index: number): Promise<void> => {
    if (!contract) return;
    
    try {
      setLoading(true);
      
      const tx = await contract.checkAndSellTokens(index);
      await tx.wait();
      
      toast({
        title: "Position Checked",
        description: "Position checked and action taken if needed",
      });
      
      // Refresh active snipes
      await fetchActiveSnipes();
    } catch (error) {
      console.error("Check and sell error:", error);
      toast({
        variant: "destructive",
        title: "Operation Failed",
        description: "Failed to check position. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchRecentTokens();
    
    // Setup event listener for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', () => {
        window.location.reload();
      });
      
      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }
    
    return () => {
      // Clean up event listeners
      if (window.ethereum) {
        window.ethereum.removeAllListeners();
      }
    };
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Sniperama Bot</h1>
      
      {!connected ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Connect Wallet</CardTitle>
            <CardDescription>Connect your wallet to use the Sniperama bot on Avalanche</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={connectWallet} disabled={loading}>
              {loading ? <RefreshCcw className="mr-2 h-4 w-4 animate-spin" /> : <ChevronRight className="mr-2 h-4 w-4" />}
              Connect Wallet
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Balance</CardTitle>
                <CardDescription>Current funds available for sniping</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{userBalance} AVAX</p>
              </CardContent>
              <CardFooter className="flex flex-col items-start gap-4">
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="depositAmount">Deposit Amount (AVAX)</Label>
                  <Input
                    id="depositAmount"
                    type="number"
                    placeholder="0.1"
                    value={amountToSpend}
                    onChange={(e) => setAmountToSpend(e.target.value)}
                  />
                </div>
                <Button onClick={depositFunds} disabled={loading || !amountToSpend}>
                  {loading ? <RefreshCcw className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Deposit Funds
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Execute Snipe</CardTitle>
                <CardDescription>Snipe a new token on Avalanche</CardDescription>
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
                  <Label htmlFor="snipeAmount">Amount to Spend (AVAX)</Label>
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
                  Execute Snipe
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Active Snipes</CardTitle>
                <CardDescription>Your currently active token positions</CardDescription>
              </CardHeader>
              <CardContent>
                {activeSnipes.length === 0 ? (
                  <p className="text-gray-500">No active snipes</p>
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
                            onClick={() => checkAndSell(snipe.index)}
                          >
                            Check & Sell
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>Amount Spent: {snipe.purchaseAmount} AVAX</div>
                          <div>Tokens Received: {snipe.tokenAmount}</div>
                          <div>Purchase Price: {snipe.purchasePrice}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button variant="outline" onClick={fetchActiveSnipes}>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Token Launches</CardTitle>
              <CardDescription>Recently launched tokens that may be good snipe opportunities</CardDescription>
            </CardHeader>
            <CardContent>
              {recentTokens.length === 0 ? (
                <p className="text-gray-500">No recent tokens found</p>
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
                            // Scroll to snipe form
                            document.getElementById('snipeAmount')?.scrollIntoView({
                              behavior: 'smooth'
                            });
                          }}
                        >
                          Snipe
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
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
            <CardFooter>
              <Button variant="outline" onClick={fetchRecentTokens}>
                <RefreshCcw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </CardFooter>
          </Card>
        </>
      )}
    </div>
  );
}