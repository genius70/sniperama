/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { RefreshCcw, Save } from 'lucide-react';
//import SniperamaABI from '../abis/Sniperama.json';
import { SniperamaContract } from '../types/interfaces';

// Contract addresses for different blockchains
const CONTRACT_ADDRESSES = {
  avalanche: "0x1234567890123456789012345678901234567890", // Existing Avalanche address
  polygon: "0x2345678901234567890123456789012345678901",   // Polygon contract address
  fantom: "0x3456789012345678901234567890123456789012",    // Fantom contract address
  ethereum: "0x4567890123456789012345678901234567890123",  // Ethereum contract address
  bsc: "0x5678901234567890123456789012345678901234",       // BSC contract address
  arbitrum: "0x6789012345678901234567890123456789012345",  // Arbitrum contract address
};

// Default minimum amounts in USD for each chain
const DEFAULT_MIN_AMOUNTS = {
  avalanche: "250",
  polygon: "250",
  fantom: "250",
  ethereum: "250",
  bsc: "250",
  arbitrum: "250",
};

// Native token symbols for each chain
const CHAIN_TOKENS = {
  avalanche: "AVAX",
  polygon: "MATIC",
  fantom: "FTM",
  ethereum: "ETH",
  bsc: "BNB",
  arbitrum: "ETH",
};

interface SettingsProps {
  connected: boolean;
  account: string;
}

export default function Settings({ connected, account }: SettingsProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState<boolean>(false);
  const [contract, setContract] = useState<SniperamaContract | null>(null);
  
  // Settings state
  const [slippageTolerance, setSlippageTolerance] = useState<number>(5);
  const [gasPrice, setGasPrice] = useState<string>('');
  const [gasLimit, setGasLimit] = useState<string>('');
  const [defaultSellPercent, setDefaultSellPercent] = useState<number>(100);
  const [autoSellEnabled, setAutoSellEnabled] = useState<boolean>(false);
  const [autoSellTargetPercent, setAutoSellTargetPercent] = useState<number>(150);
  const [autoSellStopLossPercent, setAutoSellStopLossPercent] = useState<number>(80);
  const [telegramNotifications, setTelegramNotifications] = useState<boolean>(false);
  const [telegramBotToken, setTelegramBotToken] = useState<string>('');
  const [telegramChatId, setTelegramChatId] = useState<string>('');
  const [selectedNetwork, setSelectedNetwork] = useState<string>('avalanche');
  
  // New states for chain-specific settings
  const [minAmount, setMinAmount] = useState<string>(DEFAULT_MIN_AMOUNTS.avalanche);
  const [timerInterval, setTimerInterval] = useState<number>(4);
  const [contractStatus, setContractStatus] = useState<string>('Not Connected');
  const [isContractActive, setIsContractActive] = useState<boolean>(false);

  const initializeContract = async (): Promise<void> => {
    if (!window.ethereum || !connected) return;
    
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      
      // Get contract address based on selected network
      const contractAddress = CONTRACT_ADDRESSES[selectedNetwork as keyof typeof CONTRACT_ADDRESSES];
      
      // Initialize contract for the selected network
      const sniperamaContract = new ethers.Contract(
        contractAddress,
        SniperamaABI,
        signer
      ) as SniperamaContract;
      
      setContract(sniperamaContract);
      setContractStatus(`Connected to ${selectedNetwork.charAt(0).toUpperCase() + selectedNetwork.slice(1)} contract`);
      
      // Load user settings
      await loadUserSettings();
    } catch (error) {
      console.error("Error initializing contract:", error);
      setContractStatus(`Error connecting to ${selectedNetwork} contract`);
    }
  };

  const loadUserSettings = async (): Promise<void> => {
    if (!contract || !account) return;
    
    try {
      setLoading(true);
      
      // In a real implementation, these would be fetched from the contract
      // For demo purposes, we'll use placeholder data
      const settings = {
        slippageTolerance: 5,
        gasPrice: '50',
        gasLimit: '300000',
        defaultSellPercent: 100,
        autoSellEnabled: true,
        autoSellTargetPercent: 150,
        autoSellStopLossPercent: 80,
        telegramNotifications: false,
        telegramBotToken: '',
        telegramChatId: '',
        selectedNetwork: 'avalanche',
        minAmount: DEFAULT_MIN_AMOUNTS[selectedNetwork as keyof typeof DEFAULT_MIN_AMOUNTS],
        timerInterval: 4,
        isContractActive: false
      };
      
      // Update state with fetched settings
      setSlippageTolerance(settings.slippageTolerance);
      setGasPrice(settings.gasPrice);
      setGasLimit(settings.gasLimit);
      setDefaultSellPercent(settings.defaultSellPercent);
      setAutoSellEnabled(settings.autoSellEnabled);
      setAutoSellTargetPercent(settings.autoSellTargetPercent);
      setAutoSellStopLossPercent(settings.autoSellStopLossPercent);
      setTelegramNotifications(settings.telegramNotifications);
      setTelegramBotToken(settings.telegramBotToken);
      setTelegramChatId(settings.telegramChatId);
      setSelectedNetwork(settings.selectedNetwork);
      setMinAmount(settings.minAmount);
      setTimerInterval(settings.timerInterval);
      setIsContractActive(settings.isContractActive);
      
      // Attempt to read current contract state
      try {
        // Example of reading from contract - actual implementation will depend on contract methods
        // const contractMinAmount = await contract.getMinAmount();
        // const contractTimerInterval = await contract.getTimerInterval();
        // const contractActive = await contract.isActive();
        
        // setMinAmount(ethers.utils.formatEther(contractMinAmount));
        // setTimerInterval(contractTimerInterval.toNumber());
        // setIsContractActive(contractActive);
      } catch (contractError) {
        console.error("Error reading from contract:", contractError);
      }
      
    } catch (error) {
      console.error("Error loading settings:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load settings. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (): Promise<void> => {
    if (!contract) return;
    
    try {
      setLoading(true);
      
      // In a real implementation, this would update settings on the contract
      
      // Example of updating contract values:
      // const minAmountWei = ethers.utils.parseEther(minAmount);
      // await contract.setMinAmount(minAmountWei);
      // await contract.setTimerInterval(timerInterval);
      // if (isContractActive) {
      //   await contract.activate();
      // } else {
      //   await contract.deactivate();
      // }
      
      toast({
        title: "Settings Saved",
        description: "Your bot settings have been updated successfully.",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save settings. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Initialize contract when component mounts and when connected status changes
  useEffect(() => {
    if (connected) {
      initializeContract();
    }
  }, [connected, account]);
  
  // Re-initialize contract when selected network changes
  useEffect(() => {
    if (connected) {
      initializeContract();
      // Update min amount to default for the selected network
      setMinAmount(DEFAULT_MIN_AMOUNTS[selectedNetwork as keyof typeof DEFAULT_MIN_AMOUNTS]);
    }
  }, [selectedNetwork]);

  if (!connected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Bot Settings</h1>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center">Please connect your wallet to access settings.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Bot Settings</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Trading Settings</CardTitle>
            <CardDescription>Configure how the bot trades tokens</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="slippage">Slippage Tolerance: {slippageTolerance}%</Label>
              </div>
              <Slider 
                id="slippage"
                min={0.1} 
                max={20} 
                step={0.1} 
                value={[slippageTolerance]} 
                onValueChange={(value) => setSlippageTolerance(value[0])} 
              />
            </div>
            
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="gasPrice">Gas Price (Gwei)</Label>
              <Input
                id="gasPrice"
                type="number"
                placeholder="50"
                value={gasPrice}
                onChange={(e) => setGasPrice(e.target.value)}
              />
            </div>
            
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="gasLimit">Gas Limit</Label>
              <Input
                id="gasLimit"
                type="number"
                placeholder="300000"
                value={gasLimit}
                onChange={(e) => setGasLimit(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="defaultSell">Default Sell Percentage: {defaultSellPercent}%</Label>
              </div>
              <Slider 
                id="defaultSell"
                min={1} 
                max={100} 
                step={1} 
                value={[defaultSellPercent]} 
                onValueChange={(value) => setDefaultSellPercent(value[0])} 
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="autoSell"
                checked={autoSellEnabled}
                onCheckedChange={setAutoSellEnabled}
              />
              <Label htmlFor="autoSell">Enable Auto Sell</Label>
            </div>
            
            {autoSellEnabled && (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="profitTarget">Profit Target: {autoSellTargetPercent}%</Label>
                  </div>
                  <Slider 
                    id="profitTarget"
                    min={101} 
                    max={1000} 
                    step={1} 
                    value={[autoSellTargetPercent]} 
                    onValueChange={(value) => setAutoSellTargetPercent(value[0])} 
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="stopLoss">Stop Loss: {autoSellStopLossPercent}%</Label>
                  </div>
                  <Slider 
                    id="stopLoss"
                    min={1} 
                    max={99} 
                    step={1} 
                    value={[autoSellStopLossPercent]} 
                    onValueChange={(value) => setAutoSellStopLossPercent(value[0])} 
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Network Settings</CardTitle>
              <CardDescription>Configure network and chain settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="network">Blockchain Network</Label>
                <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
                  <SelectTrigger id="network">
                    <SelectValue placeholder="Select a network" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="avalanche">Avalanche</SelectItem>
                    <SelectItem value="ethereum">Ethereum</SelectItem>
                    <SelectItem value="bsc">Binance Smart Chain</SelectItem>
                    <SelectItem value="polygon">Polygon</SelectItem>
                    <SelectItem value="fantom">Fantom</SelectItem>
                    <SelectItem value="arbitrum">Arbitrum</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="text-sm text-muted-foreground mt-2">
                Contract Status: <span className={contractStatus.includes('Error') ? 'text-red-500' : 'text-green-500'}>{contractStatus}</span>
              </div>
              
              <div className="flex items-center space-x-2 pt-2">
                <Switch
                  id="contractActive"
                  checked={isContractActive}
                  onCheckedChange={setIsContractActive}
                />
                <Label htmlFor="contractActive">Activate Bot on {selectedNetwork.charAt(0).toUpperCase() + selectedNetwork.slice(1)}</Label>
              </div>
            </CardContent>
          </Card>
          
          {/* New Card for Chain-Specific Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Chain-Specific Settings</CardTitle>
              <CardDescription>Configure parameters for {selectedNetwork.charAt(0).toUpperCase() + selectedNetwork.slice(1)}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="minAmount">Minimum Amount (USD value in {CHAIN_TOKENS[selectedNetwork as keyof typeof CHAIN_TOKENS]})</Label>
                <Input
                  id="minAmount"
                  type="number"
                  placeholder="250"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Recommended minimum: $250 worth of {CHAIN_TOKENS[selectedNetwork as keyof typeof CHAIN_TOKENS]}
                </p>
              </div>
              
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="timerInterval">Timer Interval (hours)</Label>
                <Select 
                  value={timerInterval.toString()} 
                  onValueChange={(value) => setTimerInterval(parseInt(value))}
                >
                  <SelectTrigger id="timerInterval">
                    <SelectValue placeholder="Select interval" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 hour</SelectItem>
                    <SelectItem value="2">2 hours</SelectItem>
                    <SelectItem value="4">4 hours</SelectItem>
                    <SelectItem value="6">6 hours</SelectItem>
                    <SelectItem value="8">8 hours</SelectItem>
                    <SelectItem value="12">12 hours</SelectItem>
                    <SelectItem value="24">24 hours</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Recommended interval: 4 hours
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure how you receive alerts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="telegramNotify"
                  checked={telegramNotifications}
                  onCheckedChange={setTelegramNotifications}
                />
                <Label htmlFor="telegramNotify">Enable Telegram Notifications</Label>
              </div>
              
              {telegramNotifications && (
                <>
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="telegramToken">Telegram Bot Token</Label>
                    <Input
                      id="telegramToken"
                      type="password"
                      placeholder="Your Telegram bot token"
                      value={telegramBotToken}
                      onChange={(e) => setTelegramBotToken(e.target.value)}
                    />
                  </div>
                  
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="telegramChat">Telegram Chat ID</Label>
                    <Input
                      id="telegramChat"
                      placeholder="Your Telegram chat ID"
                      value={telegramChatId}
                      onChange={(e) => setTelegramChatId(e.target.value)}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          
        </div>
      </div>
      
      <div className="mt-6 flex justify-end space-x-4">
        <Button variant="outline" onClick={initializeContract} disabled={loading || !connected}>
          {loading ? <RefreshCcw className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
          Connect to Contract
        </Button>
        <Button onClick={saveSettings} disabled={loading || !connected || !contract}>
          {loading ? <RefreshCcw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Settings
        </Button>
      </div>
    </div>
  );
}