/* eslint-disable react-refresh/only-export-components */
import { useState, useEffect, createContext, useContext } from "react";
import { ethers } from "ethers";

interface WalletContextType {
  account: string | null;
  provider: ethers.BrowserProvider | null;
  connectWallet: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);

  useEffect(() => {
    if (window.ethereum) {
      const connectExistingWallet = async () => {
        try {
          const providerInstance = new ethers.BrowserProvider(window.ethereum);
          const accounts = await providerInstance.listAccounts();
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            setProvider(providerInstance);
          }
        } catch (error) {
          console.error("Failed to auto-connect wallet:", error);
        }
      };
      connectExistingWallet();
    }
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("No Web3 wallet found! Install MetaMask or another provider.");
      return;
    }

    try {
      const providerInstance = new ethers.BrowserProvider(window.ethereum);
      const accounts = await providerInstance.send("eth_requestAccounts", []);
      setAccount(accounts[0]);
      setProvider(providerInstance);
    } catch (error) {
      console.error("Wallet connection failed:", error);
    }
  };

  return (
    <WalletContext.Provider value={{ account, provider, connectWallet }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};
