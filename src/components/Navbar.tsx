/* eslint-disable @typescript-eslint/no-unused-vars */
import styles from "@/styles/Navbar.module.css";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ethers } from "ethers";
import { useWallet } from "@/hooks/useWallet";


const SUPPORTED_CHAINS: { [key: number]: string } = {
  137: "Polygon",
  43114: "Avalanche",
  250: "Fantom",
};

// RPC URLs for each supported chain
const RPC_URLS: { [key: number]: string } = {
  137: "https://polygon-rpc.com",
  43114: "https://api.avax.network/ext/bc/C/rpc",
  250: "https://rpc.ftm.tools",
};

// Chain configuration for switching networks
const CHAIN_CONFIG: { [key: number]: unknown } = {
  137: {
    chainId: "0x89", // 137 in hex
    chainName: "Polygon Mainnet",
    nativeCurrency: {
      name: "MATIC",
      symbol: "MATIC",
      decimals: 18,
    },
    rpcUrls: ["https://polygon-rpc.com"],
    blockExplorerUrls: ["https://polygonscan.com/"],
  },
  43114: {
    chainId: "0xA86A", // 43114 in hex
    chainName: "Avalanche C-Chain",
    nativeCurrency: {
      name: "AVAX",
      symbol: "AVAX",
      decimals: 18,
    },
    rpcUrls: ["https://api.avax.network/ext/bc/C/rpc"],
    blockExplorerUrls: ["https://snowtrace.io/"],
  },
  250: {
    chainId: "0xFA", // 250 in hex
    chainName: "Fantom Opera",
    nativeCurrency: {
      name: "FTM",
      symbol: "FTM",
      decimals: 18,
    },
    rpcUrls: ["https://rpc.ftm.tools"],
    blockExplorerUrls: ["https://ftmscan.com/"],
  },
};

const Navbar: React.FC = () => {
  const [account, setAccount] = useState<string | null>(null);
  
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  useEffect(() => {
    // Check if already connected on component mount
    checkConnection();

    // Set up event listeners for wallet changes
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);
    }

    // Cleanup event listeners on component unmount
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener(
          "accountsChanged",
          handleAccountsChanged,
        );
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, []);

  const checkConnection = async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      // Ensure window.ethereum exists
      try {
        const provider = new ethers.BrowserProvider(window.ethereum); // Updated from Web3Provider
        const accounts = await provider.listAccounts();

        if (accounts.length > 0) {
          setAccount(accounts[0]);
          const network = await provider.getNetwork();
          setChainId(network.chainId);
        }
      } catch (error) {
        console.error("Failed to check existing connection:", error);
      }
    }
  };
  const handleAccountsChanged = (accounts: string[]) => {
    setAccount(accounts.length > 0 ? accounts[0] : null);
  };

  const handleChainChanged = (chainIdHex: string) => {
    const newChainId = parseInt(chainIdHex, 16);
    setChainId(newChainId);
  };

  const switchToSupportedChain = async (targetChainId: number) => {
    if (!window.ethereum) return false;

    try {
      // Try to switch to the chain
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      });
      return true;
    } catch (switchError) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [CHAIN_CONFIG[targetChainId]],
          });
          return true;
        } catch (addError) {
          console.error("Failed to add network:", addError);
          return false;
        }
      }
      console.error("Failed to switch network:", switchError);
      return false;
    }
  };

  const connectWallet = async () => {
    if (isConnecting) return; // Prevent multiple clicks

    setIsConnecting(true);

    if (typeof window === "undefined" || !window.ethereum) {
      alert("No compatible Web3 wallet found. Please install MetaMask or another wallet that supports Avalanche, Fantom, or Polygon.");
      setIsConnecting(false);
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum); // Updated from Web3Provider
      const accounts = await provider.send("eth_requestAccounts", []);

      if (accounts.length > 0) {
        setAccount(accounts[0]);

        // Get current network
        const network = await provider.getNetwork();
        const currentChainId = network.chainId;
        setChainId(currentChainId);

        // If chain is not supported, prompt to switch to a supported one
        if (!SUPPORTED_CHAINS[currentChainId]) {
          const defaultChainId = 137; // Default to Polygon
          const switched = await switchToSupportedChain(defaultChainId);
          if (switched) {
            setChainId(defaultChainId);
          }
        }
      }
    } catch (error) {
      console.error("Wallet connection failed:", error);
    } finally {
      setIsConnecting(false);
    }
  };


  return <nav className={styles.navbar}>
      <Link to="/" className={styles.logo}>
        SNIPERAMA
      </Link>
      <div className={styles.navLinks}>
        <Link to="/" className={styles.navItem}>
          Home
        </Link>
        <Link to="/tracking" className={styles.navItem}>
          Tracking
        </Link>
        <Link to="/reporting" className={styles.navItem}>
          Reporting
        </Link>
        <Link to="/profit-loss" className={styles.navItem}>
          Profit & Loss
        </Link>
        <Link to="/options" className={styles.navItem}>
          Options
        </Link>
        <Link to="/settings" className={styles.navItem}>
          Settings
        </Link>
      </div>
      <div className={styles.walletInfo}>
        {chainId && SUPPORTED_CHAINS[chainId] ? <span className={styles.chainIndicator}>
              Chain: {SUPPORTED_CHAINS[chainId]}
            </span> : <span className={styles.chainIndicator}>
              Unsupported Chain
            </span>}
        <button className={styles.connectButton} onClick={connectWallet} disabled={isConnecting}>
          {isConnecting ? "Connecting..." : account ? (typeof account === "string" ? `Connected: ${account.slice(0, 6)}...${account.slice(-4)}` : "Connected") : "Connect Wallet"}
        </button>
      </div>
    </nav>;
};

export default Navbar;
