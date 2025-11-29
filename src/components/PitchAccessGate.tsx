"use client";

import React from 'react';
import { onboardingStateManager, OnboardingState } from '@/lib/onboarding-state';
import { 
  RocketLaunchIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

interface PitchAccessGateProps {
  onboardingState: OnboardingState;
}

export default function PitchAccessGate({ onboardingState }: PitchAccessGateProps) {
  const handleUnlockPitch = async () => {
    try {
      await onboardingStateManager.updateOnboardingState({
        pitch_access: 'unlocked',
        lastStepCompleted: 'pitch_access',
      });
      
      // The redirect guard will handle navigation to first pitch
    } catch (error) {
      console.error('Error unlocking pitch access:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 pt-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl">
          
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mb-8 shadow-lg shadow-green-500/25">
              <ShieldCheckIcon className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              Pitch Access Unlocked!
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Congratulations! Your identity has been verified. You can now submit your first project pitch.
            </p>
          </div>

          {/* Status Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            
            {/* KYC Status */}
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <CheckCircleIcon className="h-6 w-6 text-green-400" />
                <h3 className="text-lg font-semibold text-white">Identity Verified</h3>
              </div>
              <p className="text-gray-300 text-sm">
                Your KYC verification has been completed and approved. You now have access to submit project pitches.
              </p>
            </div>

            {/* Pitch Access */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <RocketLaunchIcon className="h-6 w-6 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">Pitch Access Ready</h3>
              </div>
              <p className="text-gray-300 text-sm">
                You can now create your first project pitch. This will be your initial submission to the platform.
              </p>
            </div>
          </div>

          {/* What's Next */}
          <div className="bg-gray-800/50 rounded-xl p-6 mb-8">
            <h3 className="text-xl font-semibold text-white mb-4">What's Next?</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">1</span>
                </div>
                <div>
                  <h4 className="text-white font-medium">Submit Your Pitch</h4>
                  <p className="text-gray-400 text-sm">
                    Create your first project pitch with details about your startup, tokenomics, and team.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">2</span>
                </div>
                <div>
                  <h4 className="text-white font-medium">AI Review</h4>
                  <p className="text-gray-400 text-sm">
                    Our AI system will analyze your pitch and provide feedback within 5 seconds.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">3</span>
                </div>
                <div>
                  <h4 className="text-white font-medium">Access Dashboard</h4>
                  <p className="text-gray-400 text-sm">
                    Once approved, you'll have full access to your founder dashboard and tools.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="text-center">
            <button
              onClick={handleUnlockPitch}
              className="px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-green-500/25 inline-flex items-center space-x-2"
            >
              <span>Start Your First Pitch</span>
              <ArrowRightIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Additional Info */}
          <div className="mt-8 text-center">
            <p className="text-gray-500 text-sm">
              Need help? Check out our{' '}
              <a href="/help" className="text-blue-400 hover:text-blue-300 underline">
                pitch guidelines
              </a>{' '}
              or{' '}
              <a href="/support" className="text-blue-400 hover:text-blue-300 underline">
                contact support
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
