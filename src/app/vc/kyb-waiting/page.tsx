"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { db, doc, onSnapshot } from '@/lib/firebase.client';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorBoundary from '@/components/ErrorBoundary';
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ShieldCheckIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

function KYBWaitingContent() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [kybStatus, setKybStatus] = useState<string>('pending');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }

    if (!isLoading && user && db) {
      // Listen to real-time updates of KYB status
      const unsubscribe = onSnapshot(doc(db!, 'users', user.uid), (doc) => {
        if (doc.exists()) {
          const userData = doc.data();
          const status = userData.kybStatus || 'pending';
          setKybStatus(status);
          
          console.log('KYB Status Update:', status);
          
          // Redirect based on status
          if (status === 'approved' || status === 'verified') {
            router.push('/vc/dashboard');
          } else if (status === 'rejected') {
            router.push('/vc/kyb-simple');
          }
        }
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, [user, isLoading, router]);

  if (loading || isLoading) {
    return <LoadingSpinner />;
  }

  const getStatusDisplay = () => {
    switch (kybStatus.toLowerCase()) {
      case 'approved':
      case 'verified':
        return {
          icon: <CheckCircleIcon className="w-16 h-16 text-green-400" />,
          title: 'KYB Approved!',
          description: 'Your business verification has been approved. You can now access your dashboard.',
          color: 'text-green-400',
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/30',
        };
      case 'rejected':
        return {
          icon: <XCircleIcon className="w-16 h-16 text-red-400" />,
          title: 'KYB Rejected',
          description: 'Your KYB submission was rejected. Please review and resubmit your information.',
          color: 'text-red-400',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/30',
        };
      case 'pending':
      default:
        return {
          icon: <ClockIcon className="w-16 h-16 text-yellow-400" />,
          title: 'KYB Under Review',
          description: 'Your business verification is being reviewed by our team. This usually takes 1-3 business days.',
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500/30',
        };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
      <div className="bg-gray-800/50 backdrop-blur-lg rounded-3xl shadow-2xl p-8 md:p-12 max-w-2xl w-full text-center border border-gray-700">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-6">
          <ShieldCheckIcon className="w-12 h-12 text-white" />
        </div>
        
        <h1 className="text-4xl font-extrabold text-white mb-4">
          {statusDisplay.title}
        </h1>
        
        <p className="text-lg text-gray-300 mb-8">
          {statusDisplay.description}
        </p>

        <div className={`${statusDisplay.bgColor} ${statusDisplay.borderColor} rounded-xl p-6 mb-8`}>
          <div className="flex items-center justify-center space-x-3 mb-4">
            {statusDisplay.icon}
            <h3 className={`text-2xl font-semibold ${statusDisplay.color}`}>
              {statusDisplay.title}
            </h3>
          </div>
          <p className="text-gray-300 mb-6">
            {statusDisplay.description}
          </p>
        </div>

        {kybStatus === 'pending' && (
          <div className="bg-gray-700/30 border border-gray-600 rounded-xl p-6 mb-8">
            <div className="flex items-start space-x-4">
              <SparklesIcon className="w-8 h-8 text-purple-400 flex-shrink-0" />
              <div className="text-left">
                <h3 className="text-xl font-semibold text-white mb-2">
                  What happens next?
                </h3>
                <ul className="text-gray-300 text-sm space-y-2">
                  <li>• Our team reviews your business information</li>
                  <li>• We verify your company details and documents</li>
                  <li>• You'll receive an email notification once approved</li>
                  <li>• This process typically takes 1-3 business days</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {kybStatus === 'rejected' && (
          <div className="space-y-4">
            <button
              onClick={() => router.push('/vc/kyb-simple')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              Resubmit KYB Application
            </button>
          </div>
        )}

        <div className="mt-8 text-sm text-gray-500">
          <p>Need help? Contact our support team for assistance.</p>
        </div>
      </div>
    </div>
  );
}

export default function KYBWaiting() {
  return (
    <ErrorBoundary>
      <KYBWaitingContent />
    </ErrorBoundary>
  );
}
