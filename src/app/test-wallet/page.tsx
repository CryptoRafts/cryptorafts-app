"use client";

/**
 * Wallet Connection Test Page
 * 
 * Use this page to test wallet connection functionality independently
 * Access at: /test-wallet
 */

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import to avoid SSR issues with window object
const BinanceWalletConnect = dynamic(
  () => import('@/components/BinanceWalletConnect'),
  { ssr: false }
);

export default function TestWalletPage() {
  const [connectedAddress, setConnectedAddress] = useState<string>('');
  const [testResults, setTestResults] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const handleWalletConnected = (address: string) => {
    setConnectedAddress(address);
    addTestResult(`✅ Wallet connected: ${address}`);
  };

  const handleError = (error: string) => {
    addTestResult(`❌ Error: ${error}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 py-16">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Wallet Connection Test
          </h1>
          <p className="text-white/70">
            Test Binance Wallet and MetaMask integration
          </p>
        </div>

        <div className="space-y-6">
          {/* Wallet Connection Component */}
          <BinanceWalletConnect
            onWalletConnected={handleWalletConnected}
            onError={handleError}
            required={false}
          />

          {/* Connected Address Display */}
          {connectedAddress && (
            <div className="neo-glass-card rounded-2xl p-6 border border-white/10">
              <h2 className="text-xl font-bold text-white mb-4">Connection Status</h2>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-white/70">Status:</span>
                  <span className="text-green-400 font-semibold">Connected</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/70">Address:</span>
                  <span className="text-white font-mono text-sm">{connectedAddress}</span>
                </div>
              </div>
            </div>
          )}

          {/* Test Results */}
          <div className="neo-glass-card rounded-2xl p-6 border border-white/10">
            <h2 className="text-xl font-bold text-white mb-4">Test Results</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {testResults.length === 0 ? (
                <p className="text-white/50 text-sm">No test results yet. Connect a wallet to see results.</p>
              ) : (
                testResults.map((result, index) => (
                  <div key={index} className="text-sm text-white/80 font-mono bg-white/5 p-2 rounded">
                    {result}
                  </div>
                ))
              )}
            </div>
            {testResults.length > 0 && (
              <button
                onClick={() => setTestResults([])}
                className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 rounded-lg text-sm"
              >
                Clear Results
              </button>
            )}
          </div>

          {/* Testing Instructions */}
          <div className="neo-glass-card rounded-2xl p-6 border border-white/10">
            <h2 className="text-xl font-bold text-white mb-4">Testing Instructions</h2>
            <div className="space-y-3 text-white/80 text-sm">
              <div>
                <strong className="text-white">1. Binance Wallet Test:</strong>
                <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                  <li>Install Binance Wallet extension</li>
                  <li>Click "Connect Wallet" button</li>
                  <li>Approve connection in wallet</li>
                  <li>Verify address appears and network switches to BSC</li>
                </ul>
              </div>
              <div>
                <strong className="text-white">2. MetaMask Test:</strong>
                <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                  <li>Install MetaMask extension (disable Binance Wallet temporarily)</li>
                  <li>Click "Connect Wallet" button</li>
                  <li>Approve connection in MetaMask</li>
                  <li>Verify address appears and network switches to BSC</li>
                </ul>
              </div>
              <div>
                <strong className="text-white">3. No Wallet Test:</strong>
                <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                  <li>Disable all wallet extensions</li>
                  <li>Verify helpful message and download links appear</li>
                  <li>Verify connect button is disabled</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Browser Console Check */}
          {mounted && (
            <div className="neo-glass-card rounded-2xl p-6 border border-white/10">
              <h2 className="text-xl font-bold text-white mb-4">Browser Console Check</h2>
              <p className="text-white/70 text-sm mb-2">
                Open browser console (F12) and check for:
              </p>
              <div className="bg-black/50 p-4 rounded-lg font-mono text-xs text-green-400 space-y-1">
                <div>window.BinanceChain: {window.BinanceChain ? '✅ Found' : '❌ Not found'}</div>
                <div>window.ethereum: {window.ethereum ? '✅ Found' : '❌ Not found'}</div>
                <div>window.ethereum.isMetaMask: {window.ethereum?.isMetaMask ? '✅ Yes' : '❌ No'}</div>
                <div>window.ethereum.isBinance: {window.ethereum?.isBinance ? '✅ Yes' : '❌ No'}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

