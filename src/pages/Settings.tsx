/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { RefreshCcw, Save, Wallet, Sliders, Bell, Network, Link2, ArrowRight, ArrowLeft, Check, AlertTriangle } from 'lucide-react';
//import SniperamaABI from '../abis/Sniperama.json';
import { SniperamaContract } from '../types/interfaces';
import styles from '../styles/settings.module.css';

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
  onConnectWallet?: () => void;
}

export default function Settings({ connected, account, onConnectWallet }: SettingsProps) {
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
  
  // Active tab state - renamed to currentStep for clarity
  const [currentStep, setCurrentStep] = useState<number>(1);
  const totalSteps = 4;
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

  // Step navigation functions
  const goToNextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  // Progress indicator - shows which step the user is on
  const ProgressIndicator = () => {
    return (
      <div className={styles.progressContainer}>
        <div className={styles.progressTrack}>
          {Array.from({ length: totalSteps }).map((_, index) => (
            <React.Fragment key={index}>
              <button
                onClick={() => setCurrentStep(index + 1)}
                className={`${styles.progressStep} ${
                  currentStep === index + 1
                    ? styles.active
                    : currentStep > index + 1
                    ? styles.completed
                    : styles.pending
                }`}
              >
                {currentStep > index + 1 ? <Check size={18} /> : index + 1}
              </button>
              {index < totalSteps - 1 && (
                <div className={`${styles.progressConnector} ${
                  currentStep > index + 1 ? styles.completed : ''
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  // Step titles and descriptions
  const stepInfo = [
    {
      title: "Network Selection",
      description: "Choose which blockchain network to operate on",
      icon: <Network size={24} className={styles.stepIcon} />
    },
    {
      title: "Chain Settings",
      description: "Configure parameters specific to the selected blockchain",
      icon: <Link2 size={24} className={styles.stepIcon} />
    },
    {
      title: "Trading Parameters",
      description: "Set up trading rules and automation preferences",
      icon: <Sliders size={24} className={styles.stepIcon} />
    },
    {
      title: "Notifications",
      description: "Configure how you receive alerts about trades",
      icon: <Bell size={24} className={styles.stepIcon} />
    }
  ];

  // Settings content - this will be shown both in the overlay and when authenticated
  const settingsContent = (
    <>
      <div className={styles.settingsContainer}>
        {/* Step progress indicator */}
        <ProgressIndicator />
        
        {/* Step title and info */}
        <div className={styles.stepHeader}>
          <div className={styles.stepIcon}>
            {stepInfo[currentStep - 1].icon}
          </div>
          <h2 className={styles.stepTitle}>{`Step ${currentStep}: ${stepInfo[currentStep - 1].title}`}</h2>
          <p className={styles.stepDescription}>{stepInfo[currentStep - 1].description}</p>
        </div>

        {/* Step content */}
        <div className={styles.stepContentContainer}>
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Network size={20} className="text-primary" />
                  Network Selection
                </CardTitle>
                <CardDescription>Choose which blockchain network to operate on</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className={styles.formGroup}>
                  <Label htmlFor="network" className={styles.formLabel}>Blockchain Network</Label>
                  <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
                    <SelectTrigger id="network" className={styles.formInput}>
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
                
                <div className={`${styles.infoPanel} ${styles.info}`}>
                  <div className="text-sm">
                    Contract Status: 
                    <span className={`ml-2 font-medium ${contractStatus.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>
                      {contractStatus}
                    </span>
                  </div>
                </div>
                
                <div className={styles.switchContainer}>
                  <Switch
                    id="contractActive"
                    checked={isContractActive}
                    onCheckedChange={setIsContractActive}
                  />
                  <Label htmlFor="contractActive" className="font-medium">
                    Activate Bot on {selectedNetwork.charAt(0).toUpperCase() + selectedNetwork.slice(1)}
                  </Label>
                </div>

                <div className={`${styles.infoPanel} ${styles.warning}`}>
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={16} />
                    <span className="font-medium">Important Note</span>
                  </div>
                  <p className="mt-2 text-sm">
                    Make sure you have sufficient funds on {selectedNetwork.charAt(0).toUpperCase() + selectedNetwork.slice(1)} to cover gas fees and trading operations.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link2 size={20} className="text-primary" />
                  Chain Settings
                </CardTitle>
                <CardDescription>Configure parameters for {selectedNetwork.charAt(0).toUpperCase() + selectedNetwork.slice(1)}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className={styles.formGroup}>
                  <Label htmlFor="minAmount" className={styles.formLabel}>
                    Minimum Amount (USD value in {CHAIN_TOKENS[selectedNetwork as keyof typeof CHAIN_TOKENS]})
                  </Label>
                  <Input
                    id="minAmount"
                    type="number"
                    placeholder="250"
                    value={minAmount}
                    onChange={(e) => setMinAmount(e.target.value)}
                    className={styles.formInput}
                  />
                  <p className={styles.formHelperText}>
                    Recommended minimum: $250 worth of {CHAIN_TOKENS[selectedNetwork as keyof typeof CHAIN_TOKENS]}
                  </p>
                </div>
                
                <div className={styles.formGroup}>
                  <Label htmlFor="timerInterval" className={styles.formLabel}>Timer Interval (hours)</Label>
                  <Select 
                    value={timerInterval.toString()} 
                    onValueChange={(value) => setTimerInterval(parseInt(value))}
                  >
                    <SelectTrigger id="timerInterval" className={styles.formInput}>
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
                  <p className={styles.formHelperText}>
                    Recommended interval: 4 hours
                  </p>
                </div>

                <div className={`${styles.infoPanel} ${styles.info}`}>
                  <p className="font-medium mb-1">Chain Information:</p>
                  <ul className="space-y-1 list-disc list-inside text-xs">
                    <li>Native token: {CHAIN_TOKENS[selectedNetwork as keyof typeof CHAIN_TOKENS]}</li>
                    <li>Contract address: {CONTRACT_ADDRESSES[selectedNetwork as keyof typeof CONTRACT_ADDRESSES].substring(0, 6)}...{CONTRACT_ADDRESSES[selectedNetwork as keyof typeof CONTRACT_ADDRESSES].substring(38)}</li>
                    <li>Average gas price: 50 Gwei</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sliders size={20} className="text-primary" />
                  Trading Parameters
                </CardTitle>
                <CardDescription>Configure how the bot trades tokens</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className={styles.formGroup}>
                  <Label htmlFor="slippage" className={styles.formLabel}>Slippage Tolerance: {slippageTolerance}%</Label>
                  <div className={styles.sliderContainer}>
                    <span className={styles.sliderLabel}>0.1%</span>
                    <Slider 
                      id="slippage"
                      min={0.1} 
                      max={20} 
                      step={0.1} 
                      value={[slippageTolerance]} 
                      onValueChange={(value) => setSlippageTolerance(value[0])} 
                      className="flex-1"
                    />
                    <span className={`${styles.sliderLabel} ${styles.end}`}>20%</span>
                  </div>
                </div>
                
                <div className={`${styles.formGrid} ${styles.cols2}`}>
                  <div className={styles.formGroup}>
                    <Label htmlFor="gasPrice" className={styles.formLabel}>Gas Price (Gwei)</Label>
                    <Input
                      id="gasPrice"
                      type="number"
                      placeholder="50"
                      value={gasPrice}
                      onChange={(e) => setGasPrice(e.target.value)}
                      className={styles.formInput}
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <Label htmlFor="gasLimit" className={styles.formLabel}>Gas Limit</Label>
                    <Input
                      id="gasLimit"
                      type="number"
                      placeholder="300000"
                      value={gasLimit}
                      onChange={(e) => setGasLimit(e.target.value)}
                      className={styles.formInput}
                    />
                  </div>
                </div>
                
                <div className={styles.formGroup}>
                  <Label htmlFor="defaultSell" className={styles.formLabel}>Default Sell Percentage: {defaultSellPercent}%</Label>
                  <div className={styles.sliderContainer}>
                    <span className={styles.sliderLabel}>1%</span>
                    <Slider 
                      id="defaultSell"
                      min={1} 
                      max={100} 
                      step={1} 
                      value={[defaultSellPercent]} 
                      onValueChange={(value) => setDefaultSellPercent(value[0])} 
                      className="flex-1"
                    />
                    <span className={`${styles.sliderLabel} ${styles.end}`}>100%</span>
                  </div>
                </div>
                
                <div className={styles.formGroup}>
                  <div className={styles.switchContainer}>
                    <Switch
                      id="autoSell"
                      checked={autoSellEnabled}
                      onCheckedChange={setAutoSellEnabled}
                    />
                    <Label htmlFor="autoSell" className="font-medium">Enable Auto Sell</Label>
                  </div>
                  
                  {autoSellEnabled && (
                    <div className={styles.nestedContent}>
                      <div className={styles.formGroup}>
                        <Label htmlFor="profitTarget" className={styles.formLabel}>Profit Target: {autoSellTargetPercent}%</Label>
                        <div className={styles.sliderContainer}>
                          <span className={styles.sliderLabel}>101%</span>
                          <Slider 
                            id="profitTarget"
                            min={101} 
                            max={1000} 
                            step={1} 
                            value={[autoSellTargetPercent]} 
                            onValueChange={(value) => setAutoSellTargetPercent(value[0])} 
                            className="flex-1"
                          />
                          <span className={`${styles.sliderLabel} ${styles.end}`}>1000%</span>
                        </div>
                      </div>
                      
                      <div className={styles.formGroup}>
                        <Label htmlFor="stopLoss" className={styles.formLabel}>Stop Loss: {autoSellStopLossPercent}%</Label>
                        <div className={styles.sliderContainer}>
                          <span className={styles.sliderLabel}>1%</span>
                          <Slider 
                            id="stopLoss"
                            min={1} 
                            max={99} 
                            step={1} 
                            value={[autoSellStopLossPercent]} 
                            onValueChange={(value) => setAutoSellStopLossPercent(value[0])} 
                            className="flex-1"
                          />
                          <span className={`${styles.sliderLabel} ${styles.end}`}>99%</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 4 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell size={20} className="text-primary" />
                  Notification Settings
                </CardTitle>
                <CardDescription>Configure how you receive alerts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className={styles.switchContainer}>
                  <Switch
                    id="telegramNotify"
                    checked={telegramNotifications}
                    onCheckedChange={setTelegramNotifications}
                  />
                  <Label htmlFor="telegramNotify" className="font-medium">Enable Telegram Notifications</Label>
                </div>
                
                {telegramNotifications && (
                  <div className={styles.nestedContent}>
                    <div className={styles.formGroup}>
                      <Label htmlFor="telegramToken" className={styles.formLabel}>Telegram Bot Token</Label>
                      <Input
                        id="telegramToken"
                        type="password"
                        placeholder="Your Telegram bot token"
                        value={telegramBotToken}
                        onChange={(e) => setTelegramBotToken(e.target.value)}
                        className={styles.formInput}
                      />
                    </div>
                    
                    <div className={styles.formGroup}>
                      <Label htmlFor="telegramChat" className={styles.formLabel}>Telegram Chat ID</Label>
                      <Input
                        id="telegramChat"
                        placeholder="Your Telegram chat ID"
                        value={telegramChatId}
                        onChange={(e) => setTelegramChatId(e.target.value)}
                        className={styles.formInput}
                      />
                    </div>
                  </div>
                )}

                <div className={`${styles.infoPanel} ${styles.success}`}>
                  <div className="text-center">
                    <Check size={24} className="mx-auto mb-2" />
                    <p className="font-medium">Setup Complete!</p>
                    <p className="text-sm mt-1">Click "Save Settings" below to activate your bot configuration.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <CardFooter className={styles.buttonContainer}>
            <Button 
              variant="outline" 
              onClick={goToPreviousStep} 
              disabled={currentStep === 1}
              className="gap-2"
            >
              <ArrowLeft size={16} />
              Previous
            </Button>
            
            {currentStep < totalSteps ? (
              <Button onClick={goToNextStep} className="gap-2">
                Next
                <ArrowRight size={16} />
              </Button>
            ) : (
              <Button 
                onClick={saveSettings} 
                disabled={loading || !connected || !contract}
                className="gap-2 bg-green-600 hover:bg-green-700"
              >
                {loading ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Settings
              </Button>
            )}
          </CardFooter>
        </div>
      </div>
      
      <div className="mt-6 flex justify-center gap-4">
        <Button 
          variant="outline" 
          onClick={initializeContract} 
          disabled={loading || !connected}
          size="lg"
          className="min-w-28 transition-all duration-200 hover:border-primary"
        >
          {loading ? <RefreshCcw className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
          Refresh Connection
        </Button>
      </div>
    </>
  );

  return (
    <div className={styles.settingsContainer}>
      <div className="w-full max-w-4xl mb-8">
        <h1 className={styles.settingsTitle}>
          Bot Configuration Wizard
        </h1>
        <p className={styles.settingsSubtitle}>Follow each step to set up your trading bot</p>
      </div>
      
      {/* Conditional rendering with overlay for unauthenticated users */}
      {!connected ? (
        <div className={styles.overlayContainer}>
          {/* Light overlay */}
          <div className={styles.overlay}>
            <Card className={styles.connectCard}>
              <CardHeader>
                <CardTitle className="text-center">Connect Wallet</CardTitle>
                <CardDescription className="text-center">Please connect your wallet to access settings</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4">
                <Button 
                  onClick={onConnectWallet} 
                  size="lg" 
                  className={styles.connectButton}
                >
                  <Wallet className="mr-2 h-4 w-4" />
                  Connect Wallet
                </Button>
              </CardContent>
              <CardFooter className="text-sm text-center text-muted-foreground">
                Connection required to configure and activate the bot
              </CardFooter>
            </Card>
          </div>
          
          {/* Blurred content in background */}
          <div className={styles.blurredContent}>
            {settingsContent}
          </div>
        </div>
      ) : (
        <div className="w-full max-w-4xl">
          {settingsContent}
        </div>
      )}
    </div>
  );
}