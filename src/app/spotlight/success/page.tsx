"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { SpotlightService } from '@/lib/spotlight-service';
import { SpotlightApplication } from '@/lib/spotlight-types';
import {
  CheckCircleIcon,
  ArrowTopRightOnSquareIcon,
  HomeIcon,
  EyeIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';

export default function SpotlightSuccessPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [application, setApplication] = useState<SpotlightApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const verifyPayment = async () => {
      try {
        setLoading(true);

        if (sessionId) {
          // Verify Stripe payment
          const response = await fetch('/api/spotlight/payment', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sessionId,
              status: 'completed',
            }),
          });

          if (!response.ok) {
            throw new Error('Payment verification failed');
          }

          const data = await response.json();
          console.log('Payment verified:', data);
        }

        // Fetch updated application
        const applications = await SpotlightService.getUserApplications(user.uid);
        const latestApplication = applications[0]; // Most recent application
        
        if (latestApplication && latestApplication.paymentStatus === 'completed') {
          setApplication(latestApplication);
        } else {
          setError('Payment verification failed');
        }

      } catch (error: any) {
        console.error('Payment verification error:', error);
        setError(error.message || 'Failed to verify payment');
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [user, router, sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-white mb-2">Verifying Payment...</h1>
          <p className="text-white/70">Please wait while we confirm your payment</p>
        </div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <CheckCircleIcon className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Payment Verification Failed</h1>
          <p className="text-white/70 mb-6">{error || 'Unable to verify your payment'}</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => router.push('/spotlight/apply')}
              className="btn-outline"
            >
              Try Again
            </button>
            <button
              onClick={() => router.push('/')}
              className="btn-primary"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="w-24 h-24 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircleIcon className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Payment Successful!</h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Your Verified Spotlight application has been approved and is now live!
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Application Details */}
          <div className="neo-glass-card rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-6">Your Spotlight Details</h2>
            
            <div className="space-y-6">
              {/* Project Info */}
              <div className="flex items-center space-x-4">
                <img
                  src={application.logoUrl}
                  alt={application.projectName}
                  className="w-16 h-16 rounded-xl object-cover"
                />
                <div>
                  <h3 className="text-lg font-bold text-white">{application.projectName}</h3>
                  <p className="text-white/70">{application.tagline}</p>
                </div>
              </div>

              {/* Spotlight Status */}
              <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <CheckCircleIcon className="w-6 h-6 text-green-400" />
                  <div>
                    <p className="text-green-400 font-semibold">
                      {application.slotType === 'premium' ? 'Premium' : 'Featured'} Spotlight Active
                    </p>
                    <p className="text-white/70 text-sm">
                      Your project is now visible to thousands of users
                    </p>
                  </div>
                </div>
              </div>

              {/* Duration */}
              <div className="bg-white/5 rounded-xl p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <CalendarDaysIcon className="w-5 h-5 text-blue-400" />
                  <span className="text-white font-semibold">Spotlight Duration</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-white/70">Start Date</span>
                    <span className="text-white">
                      {new Date(application.startDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">End Date</span>
                    <span className="text-white">
                      {new Date(application.endDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Days Remaining</span>
                    <span className="text-green-400 font-semibold">
                      {Math.ceil((new Date(application.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                    </span>
                  </div>
                </div>
              </div>

              {/* Verification Badges */}
              <div>
                <h4 className="text-white font-semibold mb-3">Verification Status</h4>
                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center space-x-1 bg-green-500/20 border border-green-500/30 rounded-full px-3 py-1">
                    <CheckCircleIcon className="w-4 h-4 text-green-400" />
                    <span className="text-green-400 text-sm font-medium">KYC Verified</span>
                  </div>
                  <div className="flex items-center space-x-1 bg-blue-500/20 border border-blue-500/30 rounded-full px-3 py-1">
                    <CheckCircleIcon className="w-4 h-4 text-blue-400" />
                    <span className="text-blue-400 text-sm font-medium">KYB Verified</span>
                  </div>
                  <div className="flex items-center space-x-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-full px-3 py-1">
                    <CheckCircleIcon className="w-4 h-4 text-purple-400" />
                    <span className="text-purple-400 text-sm font-medium">✅ RaftAI Verified</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="neo-glass-card rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-6">What's Next?</h2>
            
            <div className="space-y-6">
              {/* View Your Spotlight */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <EyeIcon className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-blue-400 font-semibold mb-2">View Your Spotlight</h3>
                    <p className="text-white/70 text-sm mb-3">
                      See how your project appears to users on the platform
                    </p>
                    <button
                      onClick={() => router.push(application.slotType === 'premium' ? '/' : '/explore')}
                      className="btn-outline btn-sm"
                    >
                      View Spotlight
                    </button>
                  </div>
                </div>
              </div>

              {/* Analytics */}
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">AI</span>
                  </div>
                  <div>
                    <h3 className="text-purple-400 font-semibold mb-2">Track Performance</h3>
                    <p className="text-white/70 text-sm mb-3">
                      Monitor impressions, views, and engagement with your spotlight
                    </p>
                    <button
                      onClick={() => router.push('/founder/dashboard')}
                      className="btn-outline btn-sm"
                    >
                      View Analytics
                    </button>
                  </div>
                </div>
              </div>

              {/* Renewal */}
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <CalendarDaysIcon className="w-6 h-6 text-orange-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-orange-400 font-semibold mb-2">Renew Your Spotlight</h3>
                    <p className="text-white/70 text-sm mb-3">
                      Extend your spotlight for continued visibility
                    </p>
                    <button
                      onClick={() => router.push('/spotlight/apply')}
                      className="btn-outline btn-sm"
                    >
                      Renew Now
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 space-y-4">
              <button
                onClick={() => router.push('/')}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-3 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <HomeIcon className="w-5 h-5" />
                <span>Go to Homepage</span>
              </button>
              
              <button
                onClick={() => router.push('/founder/dashboard')}
                className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold py-3 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <ArrowTopRightOnSquareIcon className="w-5 h-5" />
                <span>Go to Dashboard</span>
              </button>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="max-w-4xl mx-auto mt-12">
          <div className="neo-glass-card rounded-2xl p-6 text-center">
            <h3 className="text-xl font-bold text-white mb-4">Need Help?</h3>
            <p className="text-white/70 mb-6">
              If you have any questions about your Verified Spotlight or need assistance, 
              our support team is here to help.
            </p>
            <div className="flex gap-4 justify-center">
              <a
                href="mailto:support@cryptorafts.com"
                className="btn-outline"
              >
                Contact Support
              </a>
              <a
                href="/docs/spotlight"
                className="btn-outline"
              >
                Documentation
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


