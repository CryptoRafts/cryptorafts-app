"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { db, doc, getDoc, setDoc } from '@/lib/firebase.client';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserIcon,
  ShieldCheckIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

export default function VCKYC() {
  const { user, claims, isLoading } = useAuth();
  const router = useRouter();
  const [kycStatus, setKycStatus] = useState<string>('not_submitted');
  const [loading, setLoading] = useState(true);
  const [startingKyc, setStartingKyc] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !db) {
      setLoading(false);
      return;
    }

    const checkKycStatus = async () => {
      try {
        if (!db) return;
        const userDoc = await getDoc(doc(db!, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const status = userData.kycStatus || userData.kyc?.status || 'not_submitted';
          setKycStatus(status);
        }
      } catch (error) {
        console.error('Error checking KYC status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkKycStatus();
  }, [user, db]);

  const handleStartKyc = async () => {
    if (!user || !db) return;

    setStartingKyc(true);
    setError(null);

    try {
      // Start KYC process
      const response = await fetch('/api/kyc/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.error) {
        setError(result.error);
        return;
      }

      // Update user status to pending
      if (!db) return;
      await setDoc(doc(db!, 'users', user.uid), {
        kycStatus: 'pending',
        kycStartedAt: new Date(),
        lastUpdated: new Date()
      }, { merge: true });

      setKycStatus('pending');

      // In a real implementation, you would integrate with the KYC vendor widget here
      alert("KYC session started. Complete the verification process in the opened widget.");
      
      // Simulate completion after a delay (remove this in production)
      setTimeout(() => {
        setKycStatus('approved');
        setStartingKyc(false);
        alert("KYC verification completed successfully!");
      }, 3000);

    } catch (error) {
      console.error('Error starting KYC:', error);
      setError('Failed to start KYC process. Please try again.');
    } finally {
      setStartingKyc(false);
    }
  };

  const getStatusDisplay = () => {
    switch (kycStatus) {
      case 'approved':
      case 'verified':
        return {
          icon: <CheckCircleIcon className="w-8 h-8 text-green-400" />,
          title: "KYC Verified",
          description: "Your identity has been successfully verified.",
          color: "text-green-400",
          bgColor: "bg-green-500/10",
          borderColor: "border-green-500/30"
        };
      case 'pending':
        return {
          icon: <ClockIcon className="w-8 h-8 text-yellow-400" />,
          title: "KYC Pending",
          description: "Your verification is being processed.",
          color: "text-yellow-400",
          bgColor: "bg-yellow-500/10",
          borderColor: "border-yellow-500/30"
        };
      case 'rejected':
        return {
          icon: <XCircleIcon className="w-8 h-8 text-red-400" />,
          title: "KYC Rejected",
          description: "Your verification was rejected. Please try again.",
          color: "text-red-400",
          bgColor: "bg-red-500/10",
          borderColor: "border-red-500/30"
        };
      default:
        return {
          icon: <UserIcon className="w-8 h-8 text-blue-400" />,
          title: "KYC Required",
          description: "Complete identity verification to access all features.",
          color: "text-blue-400",
          bgColor: "bg-blue-500/10",
          borderColor: "border-blue-500/30"
        };
    }
  };

  if (isLoading || loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return (
      <div 
        className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center pt-24"
        style={{
          backgroundImage: 'url("/worldmap.png")'
        }}
      >
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Please log in</h1>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const statusDisplay = getStatusDisplay();
  const isCompleted = kycStatus === 'approved' || kycStatus === 'verified';

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat pt-24 pb-12 px-4"
      style={{
        backgroundImage: 'url("/worldmap.png")'
      }}
    >
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-4xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Identity Verification
            </h1>
            <p className="text-white/70 text-lg max-w-2xl mx-auto">
              Complete your KYC verification to unlock all VC features and access the full platform
            </p>
          </div>

          {/* Main Card */}
          <div className="bg-white/40 backdrop-blur-lg border border-white/20 rounded-3xl shadow-2xl p-8 md:p-12">
            {/* Status Display */}
            <div className={`${statusDisplay.bgColor} ${statusDisplay.borderColor} border rounded-2xl p-6 mb-8`}>
              <div className="flex items-center justify-center mb-4">
                {statusDisplay.icon}
              </div>
              <h2 className={`text-2xl font-bold ${statusDisplay.color} text-center mb-2`}>
                {statusDisplay.title}
              </h2>
              <p className="text-white/70 text-center">
                {statusDisplay.description}
              </p>
            </div>

            {/* AI-Powered Verification Info */}
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-2xl p-6 mb-8">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <SparklesIcon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">AI-Powered Verification</h3>
                  <p className="text-white/70 mb-4">
                    Our AI system verifies your identity in real-time with advanced face recognition and liveness detection.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <CheckCircleIcon className="w-5 h-5 text-green-400" />
                      <span className="text-white/80 text-sm">Face Recognition</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircleIcon className="w-5 h-5 text-green-400" />
                      <span className="text-white/80 text-sm">Liveness Detection</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircleIcon className="w-5 h-5 text-green-400" />
                      <span className="text-white/80 text-sm">Document Verification</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg mb-6 flex items-center space-x-2">
                <ExclamationTriangleIcon className="w-5 h-5" />
                <span>{error}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!isCompleted ? (
                <button
                  onClick={handleStartKyc}
                  disabled={startingKyc || kycStatus === 'pending'}
                  className="flex items-center justify-center space-x-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {startingKyc ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Starting Verification...</span>
                    </>
                  ) : kycStatus === 'pending' ? (
                    <>
                      <ClockIcon className="w-5 h-5" />
                      <span>Verification in Progress...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheckIcon className="w-5 h-5" />
                      <span>Start KYC Verification</span>
                      <ArrowRightIcon className="w-5 h-5" />
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => router.push('/vc/dashboard')}
                  className="flex items-center justify-center space-x-2 px-8 py-4 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 transition-all duration-300 transform hover:scale-105"
                >
                  <CheckCircleIcon className="w-5 h-5" />
                  <span>Continue to Dashboard</span>
                  <ArrowRightIcon className="w-5 h-5" />
                </button>
              )}

              <button
                onClick={() => router.push('/vc/dashboard')}
                className="flex items-center justify-center space-x-2 px-8 py-4 bg-white/10 border border-white/20 text-white font-semibold rounded-xl hover:bg-white/20 transition-all duration-300"
              >
                <span>Skip for Now</span>
              </button>
            </div>

            {/* Security Notice */}
            <div className="mt-8 text-center">
              <p className="text-white/50 text-sm">
                Your data is encrypted and secure. We never store your biometric information.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}