"use client";

import React, { useState } from 'react';
import { useFounderAuth } from '@/providers/FounderAuthProvider';
import { useRouter } from 'next/navigation';
import { 
  BuildingOfficeIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

export default function FounderKYBDecision() {
  const { skipKYB, completeKYB } = useFounderAuth();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');

  const handleSkipKYB = async () => {
    setIsProcessing(true);
    setError('');
    
    try {
      await skipKYB();
      router.push('/founder/pitch');
    } catch (err: any) {
      setError(err?.message || 'Failed to skip KYB');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCompleteKYB = async () => {
    setIsProcessing(true);
    setError('');
    
    try {
      await completeKYB({ status: 'pending' });
      router.push('/founder/kyb');
    } catch (err: any) {
      setError(err?.message || 'Failed to start KYB');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 pt-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full mb-6 shadow-lg shadow-blue-500/25">
            <BuildingOfficeIcon className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Organization Verification (KYB)
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Complete your organization verification to unlock additional features and build trust with investors
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl">
          
          {/* KYC Status */}
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircleIcon className="h-6 w-6 text-white" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-green-400">KYC Completed</h3>
                <p className="text-gray-300">Your identity has been verified</p>
              </div>
            </div>
          </div>

          {/* KYB Decision */}
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white">Ready to Pitch Your Project?</h2>
              <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                You can now proceed to create your project pitch. Organization verification (KYB) is optional but recommended for building trust with investors.
              </p>
            </div>

            {/* Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              
              {/* Skip KYB Option */}
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10 hover:border-blue-400/50 transition-all duration-300">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto">
                    <ArrowRightIcon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Skip KYB for Now</h3>
                  <p className="text-gray-300 text-sm">
                    Proceed directly to pitch your project. You can complete organization verification later from your settings.
                  </p>
                  <div className="space-y-2 text-sm text-gray-400">
                    <p>✓ Start pitching immediately</p>
                    <p>✓ Access to all core features</p>
                    <p>✓ Can add KYB later</p>
                  </div>
                  <button
                    onClick={handleSkipKYB}
                    disabled={isProcessing}
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-blue-500/25"
                  >
                    {isProcessing ? 'Processing...' : 'Skip KYB & Start Pitching'}
                  </button>
                </div>
              </div>

              {/* Complete KYB Option */}
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10 hover:border-green-400/50 transition-all duration-300">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto">
                    <BuildingOfficeIcon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Complete KYB (Recommended)</h3>
                  <p className="text-gray-300 text-sm">
                    Verify your organization to build maximum trust with investors and unlock premium features.
                  </p>
                  <div className="space-y-2 text-sm text-gray-400">
                    <p>✓ Enhanced investor trust</p>
                    <p>✓ Premium verification badge</p>
                    <p>✓ Access to exclusive features</p>
                  </div>
                  <button
                    onClick={handleCompleteKYB}
                    disabled={isProcessing}
                    className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-green-500/25"
                  >
                    {isProcessing ? 'Processing...' : 'Complete KYB First'}
                  </button>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6 max-w-2xl mx-auto">
              <div className="flex items-start space-x-3">
                <ClockIcon className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-blue-300 font-medium mb-1">KYB Process</p>
                  <p className="text-sm text-gray-300">
                    Organization verification typically takes 5-10 minutes and requires documents like business registration, 
                    articles of incorporation, and proof of business address.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center space-x-3">
                <CheckCircleIcon className="h-5 w-5 text-red-400 flex-shrink-0" />
                <p className="text-red-400 font-medium">{error}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
