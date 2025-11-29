"use client";

import React, { useState } from 'react';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { motion } from 'framer-motion';
import { 
  WrenchScrewdriverIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

interface DebugInfo {
  userId: string;
  role: string | null;
  profileCompleted: boolean;
  onboardingStep: string | null;
  kybStatus: string | null;
  orgId: string | null;
  error?: string;
}

const VCAccountDebugger: React.FC = () => {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [isFixing, setIsFixing] = useState(false);
  const [fixResult, setFixResult] = useState<string>('');

  const runDebug = async () => {
    if (!user) return;

    try {
      // Fetch user data from Firestore
      const response = await fetch(`/api/debug-user?userId=${user.uid}`);
      const data = await response.json();

      setDebugInfo({
        userId: user.uid,
        role: data.role || null,
        profileCompleted: data.profileCompleted || false,
        onboardingStep: data.onboarding?.step || null,
        kybStatus: data.kyb?.status || null,
        orgId: data.orgId || null,
        error: data.error
      });
    } catch (error) {
      setDebugInfo({
        userId: user.uid,
        role: null,
        profileCompleted: false,
        onboardingStep: null,
        kybStatus: null,
        orgId: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  const fixVCAccount = async () => {
    if (!user) return;

    setIsFixing(true);
    setFixResult('');

    try {
      const response = await fetch('/api/fix-vc-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.uid }),
      });

      const result = await response.json();
      
      if (result.success) {
        setFixResult(`✅ ${result.message}`);
        // Refresh debug info
        setTimeout(runDebug, 1000);
      } else {
        setFixResult(`❌ ${result.message}`);
      }
    } catch (error) {
      setFixResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsFixing(false);
    }
  };

  const resetVCOnboarding = async () => {
    if (!user) return;

    setIsFixing(true);
    setFixResult('');

    try {
      const response = await fetch('/api/fix-vc-account', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.uid, action: 'reset' }),
      });

      const result = await response.json();
      
      if (result.success) {
        setFixResult(`✅ ${result.message}`);
        // Refresh debug info
        setTimeout(runDebug, 1000);
      } else {
        setFixResult(`❌ ${result.message}`);
      }
    } catch (error) {
      setFixResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsFixing(false);
    }
  };

  // Only show for development or when there are issues
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="w-12 h-12 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-lg transition-colors"
        title="VC Account Debugger"
      >
        <WrenchScrewdriverIcon className="w-6 h-6 text-white" />
      </button>

      {/* Debug Panel */}
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className="absolute bottom-16 right-0 w-80 bg-gray-900 rounded-lg shadow-xl border border-white/10 p-4"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">VC Account Debugger</h3>
            <button
              onClick={() => setIsVisible(false)}
              className="text-white/60 hover:text-white"
            >
              ×
            </button>
          </div>

          {/* Debug Info */}
          {debugInfo && (
            <div className="mb-4 space-y-2">
              <div className="flex items-center space-x-2">
                <InformationCircleIcon className="w-4 h-4 text-blue-400" />
                <span className="text-white/80 text-sm">User ID: {debugInfo.userId.substring(0, 8)}...</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-white/80 text-sm">Role: {debugInfo.role || 'Not set'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-white/80 text-sm">Profile: {debugInfo.profileCompleted ? '✅' : '❌'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-white/80 text-sm">Onboarding: {debugInfo.onboardingStep || 'Not started'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-white/80 text-sm">KYB: {debugInfo.kybStatus || 'Not set'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-white/80 text-sm">Org ID: {debugInfo.orgId || 'Not set'}</span>
              </div>
              {debugInfo.error && (
                <div className="flex items-center space-x-2">
                  <ExclamationTriangleIcon className="w-4 h-4 text-red-400" />
                  <span className="text-red-400 text-sm">{debugInfo.error}</span>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2">
            <button
              onClick={runDebug}
              className="w-full px-3 py-2 bg-blue-500 hover:bg-blue-600 rounded text-white text-sm transition-colors"
            >
              Run Debug
            </button>
            
            <button
              onClick={fixVCAccount}
              disabled={isFixing}
              className="w-full px-3 py-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 rounded text-white text-sm transition-colors"
            >
              {isFixing ? 'Fixing...' : 'Fix VC Account'}
            </button>
            
            <button
              onClick={resetVCOnboarding}
              disabled={isFixing}
              className="w-full px-3 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 rounded text-white text-sm transition-colors"
            >
              {isFixing ? 'Resetting...' : 'Reset Onboarding'}
            </button>
          </div>

          {/* Fix Result */}
          {fixResult && (
            <div className="mt-3 p-2 bg-black/20 rounded text-sm">
              {fixResult}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default VCAccountDebugger;
