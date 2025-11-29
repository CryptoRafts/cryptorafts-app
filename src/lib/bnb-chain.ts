/**
 * BNB Chain Integration for CryptoRafts Platform
 * 
 * This module provides BNB Chain (BSC) network configuration and utilities
 * for deploying and interacting with smart contracts on the BNB Chain ecosystem.
 * 
 * Primary deployment target: BNB Smart Chain (BSC) - Chain ID 56
 * Secondary targets: opBNB, Greenfield (as needed)
 */

export interface BNBChainConfig {
  chainId: number;
  name: string;
  rpcUrls: string[];
  blockExplorerUrls: string[];
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  isTestnet: boolean;
}

/**
 * BNB Chain network configurations
 * Primary deployment target: BNB Smart Chain (BSC)
 */
export const BNB_CHAIN_NETWORKS: Record<string, BNBChainConfig> = {
  // Primary deployment network - BNB Smart Chain (BSC)
  bsc: {
    chainId: 56,
    name: 'BNB Smart Chain (BSC)',
    rpcUrls: [
      'https://bsc-dataseed1.binance.org',
      'https://bsc-dataseed2.binance.org',
      'https://bsc-dataseed1.defibit.io',
      'https://bsc-dataseed1.nodereal.io',
    ],
    blockExplorerUrls: ['https://bscscan.com'],
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18,
    },
    isTestnet: false,
  },
  // opBNB - Layer 2 solution for BNB Chain
  opBNB: {
    chainId: 204,
    name: 'opBNB Mainnet',
    rpcUrls: ['https://opbnb-mainnet-rpc.bnbchain.org'],
    blockExplorerUrls: ['https://mainnet.opbnbscan.com'],
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18,
    },
    isTestnet: false,
  },
  // Testnet for development
  bscTestnet: {
    chainId: 97,
    name: 'BNB Smart Chain Testnet',
    rpcUrls: [
      'https://data-seed-prebsc-1-s1.binance.org:8545',
      'https://data-seed-prebsc-2-s1.binance.org:8545',
    ],
    blockExplorerUrls: ['https://testnet.bscscan.com'],
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18,
    },
    isTestnet: true,
  },
};

/**
 * Primary BNB Chain network for deployment
 * This is the main network where CryptoRafts will be deployed
 */
export const PRIMARY_BNB_CHAIN = BNB_CHAIN_NETWORKS.bsc;

/**
 * Get BNB Chain RPC URL
 * Returns the primary RPC endpoint for BNB Smart Chain
 */
export function getBNBChainRPC(): string {
  return PRIMARY_BNB_CHAIN.rpcUrls[0];
}

/**
 * Get BNB Chain network configuration
 * @param networkName - Network name (bsc, opBNB, bscTestnet)
 */
export function getBNBChainConfig(networkName: string = 'bsc'): BNBChainConfig {
  return BNB_CHAIN_NETWORKS[networkName] || PRIMARY_BNB_CHAIN;
}

/**
 * Check if connected to BNB Chain network
 * @param chainId - Current chain ID from wallet
 */
export function isBNBChain(chainId: number): boolean {
  return chainId === PRIMARY_BNB_CHAIN.chainId || 
         chainId === BNB_CHAIN_NETWORKS.opBNB.chainId ||
         chainId === BNB_CHAIN_NETWORKS.bscTestnet.chainId;
}

/**
 * Get BNB Chain block explorer URL
 * @param txHash - Transaction hash
 * @param networkName - Network name (default: bsc)
 */
export function getBNBChainExplorerUrl(txHash: string, networkName: string = 'bsc'): string {
  const config = getBNBChainConfig(networkName);
  return `${config.blockExplorerUrls[0]}/tx/${txHash}`;
}

/**
 * BNB Chain contract addresses
 * These will be populated after deployment to BNB Chain
 */
export const BNB_CHAIN_CONTRACTS = {
  projectRegistry: process.env.NEXT_PUBLIC_BNB_PROJECT_REGISTRY_ADDRESS || '',
  kycVerification: process.env.NEXT_PUBLIC_BNB_KYC_CONTRACT_ADDRESS || '',
  tokenContract: process.env.NEXT_PUBLIC_BNB_TOKEN_CONTRACT_ADDRESS || '',
  fundingPool: process.env.NEXT_PUBLIC_BNB_FUNDING_POOL_ADDRESS || '',
};

/**
 * Switch wallet to BNB Chain network
 * This function helps users connect to BNB Smart Chain
 */
export async function switchToBNBChain(): Promise<void> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask or compatible wallet not found');
  }

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${PRIMARY_BNB_CHAIN.chainId.toString(16)}` }],
    });
  } catch (switchError: any) {
    // If chain doesn't exist, add it
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: `0x${PRIMARY_BNB_CHAIN.chainId.toString(16)}`,
              chainName: PRIMARY_BNB_CHAIN.name,
              nativeCurrency: PRIMARY_BNB_CHAIN.nativeCurrency,
              rpcUrls: PRIMARY_BNB_CHAIN.rpcUrls,
              blockExplorerUrls: PRIMARY_BNB_CHAIN.blockExplorerUrls,
            },
          ],
        });
      } catch (addError) {
        throw new Error('Failed to add BNB Chain to wallet');
      }
    } else {
      throw switchError;
    }
  }
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
    };
  }
}

