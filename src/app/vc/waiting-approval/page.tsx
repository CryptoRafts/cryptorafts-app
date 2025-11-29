"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { useRouter } from 'next/navigation';
import { db, doc, onSnapshot } from '@/lib/firebase.client';
import {
  ClockIcon,
  SparklesIcon,
  CheckBadgeIcon,
  RocketLaunchIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

export default function WaitingApprovalPage() {
  const { user, claims, isLoading } = useAuth();
  const router = useRouter();
  const [kybStatus, setKybStatus] = useState('pending');
  const [raftaiStatus, setRaftaiStatus] = useState('analyzing');

  // Listen for approval status changes
  useEffect(() => {
    if (!user || !db) return;

    const userRef = doc(db!, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const kyb = data.kybStatus || data.kyb?.status;
        const raftai = data.raftaiStatus || data.raftai?.status;

        setKybStatus(kyb);
        setRaftaiStatus(raftai);

        // If both are approved, redirect to congratulations
        if (kyb === 'approved' && (raftai === 'approved' || raftai === 'verified')) {
          router.push('/vc/approved');
        }
      }
    });

    return () => unsubscribe();
  }, [user, router]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    } else if (!isLoading && claims?.role !== 'vc') {
      router.push('/role');
    }
  }, [user, claims, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Main Card */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-12 border border-gray-700 text-center">
          {/* Animated Icon */}
          <div className="mb-8">
            <div className="relative inline-block">
              <ClockIcon className="h-24 w-24 text-cyan-400 animate-pulse" />
              <div className="absolute -top-2 -right-2 bg-purple-500 rounded-full p-2">
                <SparklesIcon className="h-8 w-8 text-white animate-spin" />
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl font-bold text-white mb-4">
            Your Application is Being Reviewed
          </h1>
          <p className="text-xl text-gray-300 mb-12">
            We're verifying your organization with RaftAI and our team
          </p>

          {/* Status Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {/* RaftAI Status */}
            <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl p-6 border border-purple-500/30">
              <SparklesIcon className="h-12 w-12 text-purple-400 mx-auto mb-4" />
              <h3 className="text-white font-bold text-lg mb-2">RaftAI Analysis</h3>
              <div className="inline-flex items-center space-x-2 bg-purple-500/30 px-4 py-2 rounded-full">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-400"></div>
                <span className="text-purple-300 text-sm font-medium">
                  {raftaiStatus === 'analyzing' ? 'Analyzing...' : 
                   raftaiStatus === 'approved' ? '✅ Approved' : 
                   raftaiStatus === 'rejected' ? '❌ Rejected' : 
                   'Pending'}
                </span>
              </div>
              <p className="text-gray-400 text-sm mt-3">
                AI is reviewing your documents and organization profile
              </p>
            </div>

            {/* Admin Review Status */}
            <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl p-6 border border-cyan-500/30">
              <CheckBadgeIcon className="h-12 w-12 text-cyan-400 mx-auto mb-4" />
              <h3 className="text-white font-bold text-lg mb-2">Admin Review</h3>
              <div className="inline-flex items-center space-x-2 bg-cyan-500/30 px-4 py-2 rounded-full">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-400"></div>
                <span className="text-cyan-300 text-sm font-medium">
                  {kybStatus === 'pending' ? 'In Review...' : 
                   kybStatus === 'approved' ? '✅ Approved' : 
                   kybStatus === 'rejected' ? '❌ Rejected' : 
                   'Pending'}
                </span>
              </div>
              <p className="text-gray-400 text-sm mt-3">
                Our team is verifying your KYB submission
              </p>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-gray-900/50 rounded-xl p-6 mb-8">
            <h3 className="text-white font-medium mb-4">Review Timeline</h3>
            <div className="space-y-3 text-left">
              <div className="flex items-center space-x-3">
                <CheckCircleIcon className="h-5 w-5 text-green-400 flex-shrink-0" />
                <span className="text-gray-300">KYB Submitted</span>
                <span className="text-green-400 text-sm">✓ Complete</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="h-5 w-5 flex-shrink-0">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-400"></div>
                </div>
                <span className="text-gray-300">RaftAI Analysis</span>
                <span className="text-purple-400 text-sm">In Progress...</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="h-5 w-5 flex-shrink-0">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-cyan-400"></div>
                </div>
                <span className="text-gray-300">Admin Verification</span>
                <span className="text-cyan-400 text-sm">In Progress...</span>
              </div>
              <div className="flex items-center space-x-3">
                <ClockIcon className="h-5 w-5 text-gray-500 flex-shrink-0" />
                <span className="text-gray-500">Dashboard Access</span>
                <span className="text-gray-500 text-sm">Awaiting Approval</span>
              </div>
            </div>
          </div>

          {/* Estimated Time */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-8">
            <p className="text-blue-300 text-sm">
              <ClockIcon className="h-5 w-5 inline mr-2" />
              <strong>Estimated Review Time:</strong> 24-48 hours
            </p>
          </div>

          {/* What You Can Do */}
          <div className="text-left bg-gray-900/30 rounded-xl p-6">
            <h3 className="text-white font-medium mb-4">While You Wait:</h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li className="flex items-start">
                <span className="text-cyan-400 mr-2">•</span>
                <span>We'll send you an email notification when approved</span>
              </li>
              <li className="flex items-start">
                <span className="text-cyan-400 mr-2">•</span>
                <span>You can check this page anytime to see your status</span>
              </li>
              <li className="flex items-start">
                <span className="text-cyan-400 mr-2">•</span>
                <span>Feel free to explore the homepage and learn more about CryptoRafts</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex justify-center space-x-4">
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Go to Homepage
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center space-x-2"
            >
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Check Status</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

