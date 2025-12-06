/**
 * Simple Wallet Connection Test Script
 * 
 * Run this in browser console to test wallet connection
 * Or use: node test-wallet-connection.js (if window object is available)
 */

// Test wallet detection
function testWalletDetection() {
  console.log('🧪 Testing Wallet Detection...\n');
  
  const results = {
    binanceWallet: false,
    metamask: false,
    ethereum: false,
    details: {}
  };
  
  if (typeof window !== 'undefined') {
    // Check Binance Wallet
    if (window.BinanceChain) {
      results.binanceWallet = true;
      results.details.binanceChain = 'Found';
      console.log('✅ Binance Wallet detected');
    } else {
      console.log('❌ Binance Wallet not found');
    }
    
    // Check MetaMask/Ethereum
    if (window.ethereum) {
      results.ethereum = true;
      results.details.ethereum = 'Found';
      
      if (window.ethereum.isMetaMask) {
        results.metamask = true;
        results.details.metamask = 'Yes';
        console.log('✅ MetaMask detected');
      } else {
        console.log('✅ Ethereum provider found (not MetaMask)');
      }
      
      if (window.ethereum.isBinance) {
        results.details.isBinance = 'Yes';
        console.log('✅ Binance Wallet (via ethereum) detected');
      }
    } else {
      console.log('❌ No Ethereum provider found');
    }
  } else {
    console.log('❌ Window object not available (server-side)');
  }
  
  console.log('\n📊 Results:', results);
  return results;
}

// Test wallet connection
async function testWalletConnection() {
  console.log('🧪 Testing Wallet Connection...\n');
  
  try {
    let accounts = [];
    let chainId = null;
    
    // Try Binance Wallet first
    if (typeof window !== 'undefined' && window.BinanceChain) {
      console.log('🔗 Attempting Binance Wallet connection...');
      accounts = await window.BinanceChain.request({ method: 'eth_requestAccounts' });
      const chainIdHex = await window.BinanceChain.request({ method: 'eth_chainId' });
      chainId = parseInt(chainIdHex, 16);
      console.log('✅ Binance Wallet connected!');
    }
    // Try MetaMask
    else if (typeof window !== 'undefined' && window.ethereum) {
      console.log('🔗 Attempting MetaMask/Ethereum connection...');
      accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
      chainId = parseInt(chainIdHex, 16);
      console.log('✅ Wallet connected!');
    } else {
      throw new Error('No wallet found');
    }
    
    if (accounts && accounts.length > 0) {
      console.log('✅ Address:', accounts[0]);
      console.log('✅ Chain ID:', chainId);
      console.log('✅ Network:', chainId === 56 ? 'BNB Smart Chain (Mainnet)' : chainId === 97 ? 'BSC Testnet' : `Chain ID ${chainId}`);
      
      return {
        success: true,
        address: accounts[0],
        chainId: chainId,
        isBNBChain: chainId === 56 || chainId === 97
      };
    } else {
      throw new Error('No accounts returned');
    }
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.testWalletDetection = testWalletDetection;
  window.testWalletConnection = testWalletConnection;
  console.log('✅ Test functions loaded!');
  console.log('Run: testWalletDetection() or testWalletConnection()');
}

// For Node.js (if needed)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testWalletDetection, testWalletConnection };
}



