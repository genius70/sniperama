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

// Contract address on Avalanche
const CONTRACT_ADDRESS = "0x1234567890123456789012345678901234567890"; // Replace with actual contract address

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

  const initializeContract = async (): Promise<void> => {
    if (!window.ethereum || !connected) return;
    
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      
      // Initialize contract
      const sniperamaContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        SniperamaABI,
        signer
      ) as SniperamaContract;
      
      setContract(sniperamaContract);
      
      // Load user settings
      await loadUserSettings();
    } catch (error) {
      console.error("Error initializing contract:", error);
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
        selectedNetwork: 'avalanche'
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
      // For demo purposes, we'll just show a toast
      
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
  }, [connected, account, initializeContract]);

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
            <CardContent>
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
                    <SelectItem value="arbitrum">Arbitrum</SelectItem>
                  </SelectContent>
                </Select>
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
      
      <div className="mt-6 flex justify-end">
        <Button onClick={saveSettings} disabled={loading}>
          {loading ? <RefreshCcw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Settings
        </Button>
      </div>
    </div>
  );
}