"use client";

/**
 * Binance Wallet Connection Component
 * 
 * This component integrates Binance Wallet for connecting wallets to BNB Chain.
 * Supports Binance Wallet, MetaMask, and other EIP-1193 compatible wallets.
 * Used in founder registration flow after profile completion and before KYC.
 * 
 * Primary deployment network: BNB Smart Chain (BSC) - Chain ID 56
 */

import { useState, useEffect } from 'react';
import { PRIMARY_BNB_CHAIN, switchToBNBChain } from '@/lib/bnb-chain';
import { ethers } from 'ethers';

interface BinanceWalletConnectProps {
  onWalletConnected: (address: string) => void;
  onError?: (error: string) => void;
  required?: boolean;
}

// Extend Window interface for Binance Wallet and MetaMask
declare global {
  interface Window {
    BinanceChain?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      isBinance?: boolean;
    };
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      isMetaMask?: boolean;
      isBinance?: boolean;
      on?: (event: string, callback: (...args: any[]) => void) => void;
      removeListener?: (event: string, callback: (...args: any[]) => void) => void;
      removeAllListeners?: (event?: string) => void;
    };
  }
}

export default function BinanceWalletConnect({
  onWalletConnected,
  onError,
  required = true,
}: BinanceWalletConnectProps) {
  const [address, setAddress] = useState<string>('');
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string>('');
  const [chainId, setChainId] = useState<number | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [walletType, setWalletType] = useState<'binance' | 'metamask' | 'other' | null>(null);

  useEffect(() => {
    // Check for existing connection and detect wallet type
    const checkConnection = async () => {
      try {
        if (typeof window === 'undefined') return;

        // Check for Binance Wallet first (it has its own namespace)
        if (window.BinanceChain) {
          setWalletType('binance');
          try {
            const accounts = await window.BinanceChain.request({ method: 'eth_accounts' });
            if (accounts && accounts.length > 0) {
              setAddress(accounts[0]);
              onWalletConnected(accounts[0]);
              
              // Get chain ID
              const chainIdHex = await window.BinanceChain.request({ method: 'eth_chainId' });
              setChainId(parseInt(chainIdHex, 16));
            }
          } catch (err) {
            console.log('Binance Wallet not connected:', err);
          }
        }
        // Check for MetaMask or other EIP-1193 wallets
        else if (window.ethereum) {
          // Determine wallet type
          if (window.ethereum.isBinance) {
            setWalletType('binance');
          } else if (window.ethereum.isMetaMask) {
            setWalletType('metamask');
          } else {
            setWalletType('other');
          }
          
          try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            setProvider(provider);
            const accounts = await provider.listAccounts();
            if (accounts && accounts.length > 0) {
              const address = await accounts[0].getAddress();
              setAddress(address);
              onWalletConnected(address);
              
              // Get chain ID
              const network = await provider.getNetwork();
              setChainId(Number(network.chainId));
            }
          } catch (err) {
            console.log('Wallet not connected:', err);
          }
        }
      } catch (err: any) {
        console.error('Error checking wallet connection:', err);
      }
    };

    checkConnection();

    // Listen for account changes (MetaMask and other EIP-1193 wallets)
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          setAddress(accounts[0]);
          onWalletConnected(accounts[0]);
        } else {
          setAddress('');
        }
      };

      const handleChainChanged = (chainIdHex: string) => {
        setChainId(parseInt(chainIdHex, 16));
      };

      // Add listeners if supported
      if (window.ethereum.on) {
        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', handleChainChanged);
      }

      return () => {
        if (window.ethereum?.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        } else if (window.ethereum?.removeAllListeners) {
          window.ethereum.removeAllListeners('accountsChanged');
          window.ethereum.removeAllListeners('chainChanged');
        }
      };
    }
  }, [onWalletConnected]);

  const handleConnect = async () => {
    setConnecting(true);
    setError('');

    try {
      let accounts: string[] = [];
      let currentChainId: number;

      // Try Binance Wallet first (it has its own namespace)
      if (window.BinanceChain) {
        setWalletType('binance');
        console.log('🔗 Connecting to Binance Wallet...');
        accounts = await window.BinanceChain.request({ method: 'eth_requestAccounts' });
        const chainIdHex = await window.BinanceChain.request({ method: 'eth_chainId' });
        currentChainId = parseInt(chainIdHex, 16);
        console.log('✅ Binance Wallet connected:', accounts[0], 'Chain ID:', currentChainId);
      }
      // Try MetaMask or other EIP-1193 wallets
      else if (window.ethereum) {
        // Determine wallet type
        if (window.ethereum.isBinance) {
          setWalletType('binance');
          console.log('🔗 Connecting to Binance Wallet (via ethereum)...');
        } else if (window.ethereum.isMetaMask) {
          setWalletType('metamask');
          console.log('🔗 Connecting to MetaMask...');
        } else {
          setWalletType('other');
          console.log('🔗 Connecting to wallet...');
        }
        
        accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
        currentChainId = parseInt(chainIdHex, 16);
        console.log('✅ Wallet connected:', accounts[0], 'Chain ID:', currentChainId);
        
        // Set up ethers provider
        const ethersProvider = new ethers.BrowserProvider(window.ethereum);
        setProvider(ethersProvider);
      } else {
        throw new Error('No wallet found. Please install Binance Wallet or MetaMask.');
      }

      if (accounts && accounts.length > 0) {
        const connectedAddress = accounts[0];
        setAddress(connectedAddress);
        setChainId(currentChainId);
        onWalletConnected(connectedAddress);

        // Switch to BNB Chain if not already on it
        if (currentChainId !== PRIMARY_BNB_CHAIN.chainId) {
          try {
            await switchToBNBChain();
            // Get updated chain ID
            if (window.BinanceChain) {
              const chainIdHex = await window.BinanceChain.request({ method: 'eth_chainId' });
              setChainId(parseInt(chainIdHex, 16));
            } else if (window.ethereum) {
              const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
              setChainId(parseInt(chainIdHex, 16));
            }
          } catch (switchError: any) {
            console.error('Error switching chain:', switchError);
            setError('Please switch to BNB Smart Chain manually in your wallet');
          }
        }
      }
    } catch (err: any) {
      console.error('Error connecting wallet:', err);
      
      // Provide user-friendly error messages
      let errorMessage = 'Failed to connect wallet';
      if (err?.code === 4001) {
        errorMessage = 'Connection rejected. Please approve the connection in your wallet.';
      } else if (err?.code === -32002) {
        errorMessage = 'Connection request already pending. Please check your wallet.';
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setAddress('');
    setChainId(null);
    setProvider(null);
    // Note: Most wallets don't support programmatic disconnect
    // User needs to disconnect from wallet UI
  };

  const formatAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const isCorrectChain = chainId === PRIMARY_BNB_CHAIN.chainId;

  return (
    <div className="w-full">
      <div className="neo-glass-card rounded-2xl p-6 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">
              Connect Wallet
            </h3>
            <p className="text-white/70 text-sm">
              Connect your wallet (Binance Wallet or MetaMask) to complete registration on BNB Smart Chain
            </p>
          </div>
          <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {!address ? (
          <div className="space-y-4">
            {/* Show detected wallet type */}
            {walletType && (
              <div className="p-3 bg-blue-500/20 border border-blue-500/50 rounded-lg">
                <p className="text-blue-300 text-sm">
                  {walletType === 'binance' && '🟡 Binance Wallet detected'}
                  {walletType === 'metamask' && '🦊 MetaMask detected'}
                  {walletType === 'other' && '💼 Wallet detected'}
                </p>
              </div>
            )}

            <button
              onClick={handleConnect}
              disabled={connecting || (!window.BinanceChain && !window.ethereum)}
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {connecting ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12c0-4.411 3.589-8 8-8v4c-2.209 0-4 1.791-4 4 0 2.209 1.791 4 4 4h4v4c-4.411 0-8-3.589-8-8z"
                    />
                  </svg>
                  Connecting...
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  {walletType === 'metamask' ? 'Connect MetaMask' : walletType === 'binance' ? 'Connect Binance Wallet' : 'Connect Wallet'}
                </>
              )}
            </button>

            {!window.BinanceChain && !window.ethereum && (
              <div className="p-4 bg-blue-500/20 border border-blue-500/50 rounded-lg">
                <p className="text-blue-300 text-sm mb-2">
                  💡 Don't have a wallet? Download one:
                </p>
                <div className="flex gap-2 flex-wrap">
                  <a
                    href="https://www.binance.com/en/web3wallet"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-300 hover:text-blue-200 text-xs underline"
                  >
                    Binance Wallet
                  </a>
                  <span className="text-blue-300/50">|</span>
                  <a
                    href="https://metamask.io"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-300 hover:text-blue-200 text-xs underline"
                  >
                    MetaMask
                  </a>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-green-300 text-sm font-medium">
                  Wallet Connected
                </span>
                <button
                  onClick={handleDisconnect}
                  className="text-green-300 hover:text-green-200 text-sm underline"
                >
                  Disconnect
                </button>
              </div>
              <p className="text-white font-mono text-sm">{formatAddress(address)}</p>
            </div>

            {chainId && (
              <div className="p-3 bg-white/5 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-white/70 text-sm">Network:</span>
                  <span
                    className={`text-sm font-medium ${
                      isCorrectChain ? 'text-green-400' : 'text-yellow-400'
                    }`}
                  >
                    {isCorrectChain
                      ? 'BNB Smart Chain ✓'
                      : `Chain ID: ${chainId} (Switch to BSC)`}
                  </span>
                </div>
              </div>
            )}

            {!isCorrectChain && chainId && (
              <button
                onClick={async () => {
                  try {
                    await switchToBNBChain();
                    // Get updated chain ID
                    if (window.BinanceChain) {
                      const chainIdHex = await window.BinanceChain.request({ method: 'eth_chainId' });
                      setChainId(parseInt(chainIdHex, 16));
                    } else if (window.ethereum) {
                      const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
                      setChainId(parseInt(chainIdHex, 16));
                    }
                  } catch (err: any) {
                    setError('Failed to switch network. Please switch manually.');
                  }
                }}
                className="w-full bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/50 text-yellow-300 font-semibold py-2 px-4 rounded-lg transition-all duration-200"
              >
                Switch to BNB Smart Chain
              </button>
            )}
          </div>
        )}

        {required && !address && (
          <p className="mt-4 text-white/50 text-xs text-center">
            * Wallet connection is required to proceed
          </p>
        )}
      </div>
    </div>
  );
}

