import { ethers } from "ethers";

// Import contract ABIs
import avaxSniperABI from "../../contracts/abis/AvaxSniper.json";
import polySniperABI from "../../contracts/abis/PolySniper.json";
import fantomSniperABI from "../../contracts/abis/FantomSniper.json";

// Chain configuration
export const CHAINS = {
  AVALANCHE: {
    name: "Avalanche",
    chainId: "0xa86a", // 43114 in hex
    rpcUrl: "https://api.avax.network/ext/bc/C/rpc",
    currency: "AVAX",
    contractAddress: "0x1234567890123456789012345678901234567890",
    blockExplorer: "https://snowtrace.io",
    icon: "🔺",
  },
  POLYGON: {
    name: "Polygon",
    chainId: "0x89", // 137 in hex
    rpcUrl: "https://polygon-rpc.com",
    currency: "MATIC",
    contractAddress: "0x2345678901234567890123456789012345678901",
    blockExplorer: "https://polygonscan.com",
    icon: "🟣",
  },
  FANTOM: {
    name: "Fantom",
    chainId: "0xfa", // 250 in hex
    rpcUrl: "https://rpcapi.fantom.network",
    currency: "FTM",
    contractAddress: "0x3456789012345678901234567890123456789012",
    blockExplorer: "https://ftmscan.com",
    icon: "👻",
  },
};

// Map ABIs to chain IDs
const CONTRACT_ABIS = {
  "0xa86a": avaxSniperABI, // Avalanche
  "0x89": polySniperABI, // Polygon
  "0xfa": fantomSniperABI, // Fantom
};

class ContractService {
  private contracts: Record<string, ethers.Contract> = {};
  private provider: ethers.providers.Web3Provider | null = null;

  setProvider(provider: ethers.providers.Web3Provider) {
    this.provider = provider;
  }

  async initializeContract(chainId: string): Promise<ethers.Contract | null> {
    if (!this.provider) return null;

    const chain = Object.values(CHAINS).find(c => c.chainId === chainId);
    if (!chain) return null;

    const abi = CONTRACT_ABIS[chainId];
    if (!abi) return null;

    const signer = this.provider.getSigner();
    const contract = new ethers.Contract(chain.contractAddress, abi, signer);

    this.contracts[chainId] = contract;
    return contract;
  }

  async initializeAllContracts(): Promise<void> {
    if (!this.provider) return;

    for (const chain of Object.values(CHAINS)) {
      await this.initializeContract(chain.chainId);
    }
  }

  getContract(chainId: string): ethers.Contract | null {
    return this.contracts[chainId] || null;
  }

  getCurrentChainContract(currentChainId: string): ethers.Contract | null {
    return this.getContract(currentChainId);
  }
}

export const contractService = new ContractService();
export default contractService;
