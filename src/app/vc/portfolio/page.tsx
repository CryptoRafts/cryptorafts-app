'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { ensureDb, waitForFirebase, createSnapshotErrorHandler } from '@/lib/firebase-utils';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorBoundary from '@/components/ErrorBoundary';

interface Investment {
  id: string;
  projectName: string;
  description: string;
  investmentAmount: number;
  currentValue: number;
  status: 'active' | 'exited' | 'pending';
  dateInvested: any;
  logo?: string;
  stage: string;
}

export default function VCPortfolio() {
  const { user, isLoading } = useAuth();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const setupListener = async () => {
      // Enhanced Firebase initialization with retry
      let isReady = await waitForFirebase(10000);
      if (!isReady) {
        console.warn('⚠️ Firebase not ready, retrying...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        isReady = await waitForFirebase(10000);
      }
      
      if (!isReady) {
        console.error('❌ Firebase not initialized after retries');
        setLoading(false);
        return () => {};
      }

      try {
        const dbInstance = ensureDb();
        if (!dbInstance) {
          console.error('❌ Database instance not available');
          setLoading(false);
          return () => {};
        }
        
        console.log('🔴 [VC-PORTFOLIO] Setting up REAL-TIME investments listener');

        // Real-time listener for investments
        // NOTE: Removed orderBy to avoid Firebase index requirement - sorting done client-side
        const investmentsQuery = query(
          collection(dbInstance, 'investments'),
          where('investorId', '==', user.uid)
        );

        const unsubscribe = onSnapshot(investmentsQuery, (snapshot) => {
          const investmentsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            dateInvested: doc.data().dateInvested?.toDate() || new Date(),
          })) as Investment[];

          // Sort by dateInvested descending (most recent first)
          investmentsData.sort((a, b) => {
            const dateA = a.dateInvested instanceof Date ? a.dateInvested.getTime() : 0;
            const dateB = b.dateInvested instanceof Date ? b.dateInvested.getTime() : 0;
            return dateB - dateA; // Descending order
          });

          console.log('🔴 [VC-PORTFOLIO] Real-time update:', investmentsData.length, 'investments');
          setInvestments(investmentsData);
          setLoading(false);
        }, createSnapshotErrorHandler('VC portfolio investments'));

        return unsubscribe;
      } catch (error) {
        console.error('❌ Error setting up Firebase listener:', error);
        setLoading(false);
        return () => {};
      }
    };

    const cleanup = setupListener();
    return () => {
      cleanup.then(cleanupFn => cleanupFn && cleanupFn());
    };
  }, [user]);

  if (isLoading || loading) {
    return <LoadingSpinner />;
  }

  const totalInvested = investments.reduce((sum, inv) => sum + inv.investmentAmount, 0);
  const totalValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
  const totalReturn = totalValue - totalInvested;
  const returnPercentage = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

  return (
    <ErrorBoundary>
      <div 
        className="min-h-screen bg-black pt-24 pb-12 px-4"
      >

        {/* Main Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Portfolio Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-black/60 backdrop-blur-lg rounded-xl p-6 border-2 border-cyan-400/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-400/70 text-sm">Total Invested</p>
                  <p className="text-2xl font-bold text-white">${(totalInvested / 1000000).toFixed(1)}M</p>
                </div>
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <span className="text-blue-400 text-xl">💰</span>
                </div>
              </div>
            </div>

            <div className="bg-black/60 backdrop-blur-lg rounded-xl p-6 border-2 border-cyan-400/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-400/70 text-sm">Current Value</p>
                  <p className="text-2xl font-bold text-white">${(totalValue / 1000000).toFixed(1)}M</p>
                </div>
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <span className="text-green-400 text-xl">📈</span>
                </div>
              </div>
            </div>

            <div className="bg-black/60 backdrop-blur-lg rounded-xl p-6 border-2 border-cyan-400/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-400/70 text-sm">Total Return</p>
                  <p className={`text-2xl font-bold ${totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ${(totalReturn / 1000000).toFixed(1)}M
                  </p>
                </div>
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <span className="text-purple-400 text-xl">🎯</span>
                </div>
              </div>
            </div>

            <div className="bg-black/60 backdrop-blur-lg rounded-xl p-6 border-2 border-cyan-400/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Return %</p>
                  <p className={`text-2xl font-bold ${returnPercentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {returnPercentage.toFixed(1)}%
                  </p>
                </div>
                <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                  <span className="text-orange-400 text-xl">📊</span>
                </div>
              </div>
            </div>
          </div>

          {/* Active Investments */}
          <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 mb-8 border border-gray-600">
            <h3 className="text-xl font-semibold text-white mb-6">Active Investments</h3>
            <div className="space-y-4">
              {investments.filter(inv => inv.status === 'active').map((investment) => (
                <div key={investment.id} className="bg-gray-700/30 rounded-lg p-6 hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {investment.logo ? (
                        <img 
                          src={investment.logo} 
                          alt={investment.projectName} 
                          className="w-12 h-12 rounded-lg object-cover border border-white/10"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const fallback = target.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className={`w-12 h-12 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-lg items-center justify-center border border-cyan-400/30 shadow-lg shadow-cyan-500/20 ${investment.logo ? 'hidden' : 'flex'}`}>
                        <span className="text-white font-bold text-lg">
                          {investment.projectName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-white font-semibold text-lg">{investment.projectName}</h4>
                        <p className="text-gray-400 text-sm">{investment.description}</p>
                        <p className="text-gray-500 text-xs mt-1">Stage: {investment.stage}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-medium">Invested: ${(investment.investmentAmount / 1000).toFixed(0)}K</p>
                      <p className="text-white font-medium">Current: ${(investment.currentValue / 1000).toFixed(0)}K</p>
                      <p className={`text-sm font-medium ${investment.currentValue >= investment.investmentAmount ? 'text-green-400' : 'text-red-400'}`}>
                        {(((investment.currentValue - investment.investmentAmount) / investment.investmentAmount) * 100).toFixed(1)}% return
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Investment Timeline */}
          <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-600">
            <h3 className="text-xl font-semibold text-white mb-6">Investment Timeline</h3>
            <div className="space-y-4">
              {investments.map((investment) => (
                <div key={investment.id} className="flex items-center space-x-4 p-4 bg-gray-700/30 rounded-lg">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-white font-medium">{investment.projectName}</h4>
                      <span className="text-gray-400 text-sm">
                        {investment.dateInvested.toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm">{investment.stage} - ${(investment.investmentAmount / 1000).toFixed(0)}K</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}