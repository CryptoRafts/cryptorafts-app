"use client";

/**
 * Wallet Menu Button Component
 * 
 * Compact wallet connection button for use in navigation menus
 * Shows connection status and allows connect/disconnect
 */

import { useState, useEffect } from 'react';
import { PRIMARY_BNB_CHAIN, BNB_CHAIN_NETWORKS, switchToBNBChain, switchToBNBTestnet } from '@/lib/bnb-chain';
import { ensureDb } from '@/lib/firebase-utils';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '@/providers/SimpleAuthProvider';

// Extend Window interface
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

interface WalletMenuButtonProps {
  className?: string;
  compact?: boolean;
}

/**
 * WalletMenuButton Component
 * 
 * IMPORTANT: Each user has a UNIQUE user.uid regardless of their role.
 * - User A (founder) with uid "abc123" → Wallet stored in users/abc123
 * - User B (vc) with uid "def456" → Wallet stored in users/def456
 * - User C (exchange) with uid "ghi789" → Wallet stored in users/ghi789
 * 
 * Each user's wallet is completely isolated and stored separately using their unique user.uid.
 * Role does not affect wallet storage - only user.uid matters for wallet isolation.
 */
export default function WalletMenuButton({ className = '', compact = false }: WalletMenuButtonProps) {
  const { user } = useAuth();
  const [address, setAddress] = useState<string>('');
  const [connecting, setConnecting] = useState(false);
  const [walletType, setWalletType] = useState<'binance' | 'metamask' | 'other' | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);

  // Load saved wallet address from Firebase - Each user has their own unique wallet
  useEffect(() => {
    const loadWalletAddress = async () => {
      if (!user) return;
      
      try {
        const dbInstance = ensureDb();
        if (dbInstance) {
          // Each user has a unique user.uid - wallet is stored per user ID
          console.log(`[Wallet] Loading wallet for user ID: ${user.uid}`);
          const userDoc = await getDoc(doc(dbInstance, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.walletAddress) {
              console.log(`[Wallet] Found saved wallet for user ${user.uid}: ${userData.walletAddress}`);
              setAddress(userData.walletAddress);
            } else {
              console.log(`[Wallet] No saved wallet found for user ${user.uid}`);
            }
          } else {
            console.log(`[Wallet] User document not found for user ${user.uid}`);
          }
        }
      } catch (error) {
        console.error(`[Wallet] Error loading wallet address for user ${user?.uid}:`, error);
      }
    };

    loadWalletAddress();

    // Check for existing connection - only if we have a saved address for this user
    const checkConnection = async () => {
      if (typeof window === 'undefined' || !user) return;

      try {
        // First, check if this user has a saved wallet address
        const dbInstance = ensureDb();
        if (dbInstance) {
          const userDoc = await getDoc(doc(dbInstance, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const savedAddress = userData.walletAddress;
            
            // Only check wallet connection if user has a saved address
            if (savedAddress) {
              if (window.BinanceChain) {
                setWalletType('binance');
                const accounts = await window.BinanceChain.request({ method: 'eth_accounts' });
                if (accounts && accounts.length > 0) {
                  // Verify the connected account matches the saved address for this user
                  const connectedAddress = accounts[0].toLowerCase();
                  if (connectedAddress === savedAddress.toLowerCase()) {
                    setAddress(accounts[0]);
                    // Get chain ID
                    try {
                      const chainIdHex = await window.BinanceChain.request({ method: 'eth_chainId' });
                      setChainId(parseInt(chainIdHex, 16));
                    } catch (e) {
                      console.error('Error getting chain ID:', e);
                    }
                  }
                }
              } else if (window.ethereum) {
                if (window.ethereum.isMetaMask) {
                  setWalletType('metamask');
                } else if (window.ethereum.isBinance) {
                  setWalletType('binance');
                } else {
                  setWalletType('other');
                }
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts && accounts.length > 0) {
                  // Verify the connected account matches the saved address for this user
                  const connectedAddress = accounts[0].toLowerCase();
                  if (connectedAddress === savedAddress.toLowerCase()) {
                    setAddress(accounts[0]);
                    // Get chain ID
                    try {
                      const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
                      setChainId(parseInt(chainIdHex, 16));
                    } catch (e) {
                      console.error('Error getting chain ID:', e);
                    }
                  }
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    };

    checkConnection();

    // Set up event listeners for wallet changes
    const setupListeners = () => {
      if (typeof window === 'undefined') return;

      const handleAccountsChanged = async (accounts: string[]) => {
        if (!user) return;
        
        // Check if the changed account matches this user's saved wallet address
        try {
          const dbInstance = ensureDb();
          if (dbInstance) {
            const userDoc = await getDoc(doc(dbInstance, 'users', user.uid));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              const savedAddress = userData.walletAddress?.toLowerCase();
              
              if (accounts && accounts.length > 0) {
                const connectedAddress = accounts[0].toLowerCase();
                // Only update if the connected address matches this user's saved address
                if (savedAddress && connectedAddress === savedAddress) {
                  setAddress(accounts[0]);
                } else if (!savedAddress) {
                  // If user doesn't have a saved address, allow connection
                  setAddress(accounts[0]);
                } else {
                  // Different account connected - clear for this user
                  setAddress('');
                  setChainId(null);
                }
              } else {
                // No accounts - disconnect
                setAddress('');
                setChainId(null);
              }
            }
          }
        } catch (error) {
          console.error('Error handling accounts changed:', error);
        }
      };

      const handleChainChanged = (chainIdHex: string) => {
        const newChainId = parseInt(chainIdHex, 16);
        setChainId(newChainId);
      };

      if (window.ethereum) {
        window.ethereum.on?.('accountsChanged', handleAccountsChanged);
        window.ethereum.on?.('chainChanged', handleChainChanged);
      }

      return () => {
        if (window.ethereum) {
          window.ethereum.removeListener?.('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener?.('chainChanged', handleChainChanged);
        }
      };
    };

    const cleanup = setupListeners();
    return cleanup;
  }, [user]);

  const handleConnect = async () => {
    if (connecting) return;
    
    setConnecting(true);
    
    try {
      let accounts: string[] = [];
      let currentChainId: number;

      // Try Binance Wallet first
      if (window.BinanceChain) {
        setWalletType('binance');
        accounts = await window.BinanceChain.request({ method: 'eth_requestAccounts' });
        const chainIdHex = await window.BinanceChain.request({ method: 'eth_chainId' });
        currentChainId = parseInt(chainIdHex, 16);
      }
      // Try MetaMask or other EIP-1193 wallets
      else if (window.ethereum) {
        if (window.ethereum.isMetaMask) {
          setWalletType('metamask');
        } else if (window.ethereum.isBinance) {
          setWalletType('binance');
        } else {
          setWalletType('other');
        }
        
        accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
        currentChainId = parseInt(chainIdHex, 16);
      } else {
        throw new Error('No wallet found. Please install Binance Wallet or MetaMask.');
      }

      if (accounts && accounts.length > 0) {
        const connectedAddress = accounts[0];
        setAddress(connectedAddress);
        setChainId(currentChainId);

        // Save to Firebase - Each user's wallet is stored separately using their unique user.uid
        if (user) {
          try {
            const dbInstance = ensureDb();
            if (dbInstance) {
              // Store wallet address in this specific user's document
              // Each user has a different user.uid, so each user's wallet is isolated
              console.log(`[Wallet] Saving wallet ${connectedAddress} for user ID: ${user.uid}`);
              await setDoc(
                doc(dbInstance, 'users', user.uid),
                { 
                  walletAddress: connectedAddress, 
                  walletType: walletType,
                  walletConnectedAt: new Date(),
                  updatedAt: new Date() 
                },
                { merge: true }
              );
              console.log(`[Wallet] Successfully saved wallet for user ${user.uid}`);
            }
          } catch (error) {
            console.error(`[Wallet] Error saving wallet address for user ${user.uid}:`, error);
          }
        }

        // Switch to BNB Chain if not already on it
        if (currentChainId !== PRIMARY_BNB_CHAIN.chainId) {
          try {
            await switchToBNBChain();
            const chainIdHex = window.BinanceChain 
              ? await window.BinanceChain.request({ method: 'eth_chainId' })
              : await window.ethereum!.request({ method: 'eth_chainId' });
            setChainId(parseInt(chainIdHex, 16));
          } catch (error) {
            console.error('Error switching chain:', error);
          }
        }
      }
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      alert(error?.message || 'Failed to connect wallet');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!address) return;

    try {
      // Clear address
      setAddress('');
      setChainId(null);
      setWalletType(null);

      // Remove from Firebase - Only clears wallet for this specific user
      if (user) {
        const dbInstance = ensureDb();
        if (dbInstance) {
          // Clear wallet address only for this user's document
          // Other users' wallets remain unaffected
          console.log(`[Wallet] Disconnecting wallet for user ID: ${user.uid}`);
          await setDoc(
            doc(dbInstance, 'users', user.uid),
            { 
              walletAddress: '', 
              walletType: null,
              walletDisconnectedAt: new Date(),
              updatedAt: new Date() 
            },
            { merge: true }
          );
          console.log(`[Wallet] Successfully disconnected wallet for user ${user.uid}`);
        }
      }
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  };

  const formatAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const isWalletAvailable = typeof window !== 'undefined' && (window.BinanceChain || window.ethereum);
  const isConnected = !!address;
  const isCorrectChain = chainId === PRIMARY_BNB_CHAIN.chainId;
  const isTestnet = chainId === BNB_CHAIN_NETWORKS.bscTestnet.chainId;
  const isMainnet = chainId === PRIMARY_BNB_CHAIN.chainId;
  
  const handleSwitchToTestnet = async () => {
    try {
      await switchToBNBTestnet();
      // Refresh chain ID
      if (window.ethereum) {
        const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
        setChainId(parseInt(chainIdHex, 16));
      }
    } catch (error: any) {
      console.error('Error switching to testnet:', error);
      alert(error?.message || 'Failed to switch to BNB Testnet');
    }
  };

  const handleSwitchToMainnet = async () => {
    try {
      await switchToBNBChain();
      // Refresh chain ID
      if (window.ethereum) {
        const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
        setChainId(parseInt(chainIdHex, 16));
      }
    } catch (error: any) {
      console.error('Error switching to mainnet:', error);
      alert(error?.message || 'Failed to switch to BNB Smart Chain');
    }
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {isConnected ? (
          <>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isCorrectChain ? 'bg-green-400' : 'bg-yellow-400'}`} />
              <span className="text-white/80 text-xs font-mono">{formatAddress(address)}</span>
            </div>
            <button
              onClick={handleDisconnect}
              className="text-white/60 hover:text-white text-xs transition-colors"
              title="Disconnect Wallet"
            >
              Disconnect
            </button>
          </>
        ) : (
          <button
            onClick={handleConnect}
            disabled={!isWalletAvailable || connecting}
            className="text-white/80 hover:text-white text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={!isWalletAvailable ? 'Install Binance Wallet or MetaMask' : 'Connect Wallet'}
          >
            {connecting ? 'Connecting...' : 'Connect Wallet'}
          </button>
        )}
      </div>
    );
  }

  // Always render UI, even if user is not loaded yet
  // This ensures the component is visible in admin and other contexts
  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {!user ? (
        <div className="space-y-2">
          <div className="bg-gray-800/50 rounded-lg p-3 space-y-2">
            <p className="text-white/80 text-sm font-medium">Loading...</p>
            <p className="text-white/60 text-xs">
              Please wait while we load your wallet information
            </p>
          </div>
        </div>
      ) : isConnected ? (
        <>
          {/* Connection Status */}
          <div className="flex items-center justify-between bg-gray-800/50 rounded-lg p-2">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isCorrectChain ? 'bg-green-400' : 'bg-yellow-400'}`} />
              <span className="text-white/90 text-sm font-mono">{formatAddress(address)}</span>
            </div>
            {walletType && (
              <span className="text-white/60 text-xs capitalize bg-gray-700 px-2 py-1 rounded">
                {walletType}
              </span>
            )}
          </div>
          
          {/* Network Status */}
          {!isMainnet && !isTestnet && (
            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3 space-y-2">
              <p className="text-yellow-400 text-xs font-medium">⚠️ Wrong Network</p>
              <div className="flex gap-2">
                <button
                  onClick={handleSwitchToMainnet}
                  className="flex-1 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 hover:text-blue-300 text-xs font-medium py-1.5 px-2 rounded transition-colors"
                >
                  Switch to Mainnet
                </button>
                <button
                  onClick={handleSwitchToTestnet}
                  className="flex-1 bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/30 text-orange-400 hover:text-orange-300 text-xs font-medium py-1.5 px-2 rounded transition-colors"
                >
                  Switch to Testnet
                </button>
              </div>
            </div>
          )}
          
          {isMainnet && (
            <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3 space-y-2">
              <p className="text-green-400 text-xs font-medium">✓ BNB Smart Chain (Mainnet)</p>
              <button
                onClick={handleSwitchToTestnet}
                className="w-full bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/30 text-orange-400 hover:text-orange-300 text-xs font-medium py-1.5 px-2 rounded transition-colors"
              >
                Switch to Testnet
              </button>
            </div>
          )}
          
          {isTestnet && (
            <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-3 space-y-2">
              <p className="text-orange-400 text-xs font-medium">✓ BNB Smart Chain (Testnet)</p>
              <button
                onClick={handleSwitchToMainnet}
                className="w-full bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 hover:text-blue-300 text-xs font-medium py-1.5 px-2 rounded transition-colors"
              >
                Switch to Mainnet
              </button>
            </div>
          )}
          
          {/* Wallet Info */}
          <div className="bg-gray-800/30 rounded-lg p-2 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/60">Status:</span>
              <span className="text-green-400 font-medium">Connected</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/60">Network:</span>
              <span className={`font-medium ${
                isMainnet ? 'text-green-400' : 
                isTestnet ? 'text-orange-400' : 
                'text-yellow-400'
              }`}>
                {isMainnet ? 'BNB Smart Chain' : 
                 isTestnet ? 'BNB Testnet' : 
                 `Chain ID: ${chainId}`}
              </span>
            </div>
          </div>
          
          {/* Disconnect Button */}
          <button
            onClick={handleDisconnect}
            className="w-full bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 hover:text-red-300 text-sm font-medium py-2 px-3 rounded-lg transition-colors"
          >
            Disconnect Wallet
          </button>
        </>
      ) : (
        <div className="space-y-2">
          {/* Wallet Options */}
          {isWalletAvailable ? (
            <>
              <button
                onClick={handleConnect}
                disabled={connecting}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {connecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
              <div className="text-xs text-white/60 text-center">
                Supports MetaMask & Binance Wallet
              </div>
            </>
          ) : (
            <div className="bg-gray-800/50 rounded-lg p-3 space-y-2">
              <p className="text-white/80 text-sm font-medium">No Wallet Detected</p>
              <p className="text-white/60 text-xs">
                Install MetaMask or Binance Wallet to connect
              </p>
              <div className="flex gap-2 mt-2">
                <a
                  href="https://metamask.io/download/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 text-xs py-1.5 px-2 rounded text-center transition-colors"
                >
                  MetaMask
                </a>
                <a
                  href="https://www.bnbchain.org/en/binance-wallet"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-500/30 text-yellow-400 text-xs py-1.5 px-2 rounded text-center transition-colors"
                >
                  Binance Wallet
                </a>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


