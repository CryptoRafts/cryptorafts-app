"use client";

import React, { useEffect } from 'react';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { useRouter } from 'next/navigation';
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';

export default function VCApprovedPage() {
  const { user, claims, isLoading } = useAuth();
  const router = useRouter();

  // Redirect if not authenticated or already shown approval
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }
    
    if (!isLoading && claims?.role !== 'vc') {
      router.push('/role');
      return;
    }

    // Check if approval was already shown - prevent loops
    const checkAndSetApprovalShown = async () => {
      if (!user) return;
      
      try {
        const { doc, getDoc, setDoc, db } = await import('@/lib/firebase.client');
        if (!db) return;
        const userRef = doc(db!, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          // If approval was already shown, redirect to dashboard immediately
          if (userData.approvalShown) {
            console.log('✅ Approval already shown, redirecting to dashboard');
            router.replace('/vc/dashboard');
            return;
          }
          
          // CRITICAL: Set approvalShown immediately to prevent redirect loops
          // This ensures the congrats screen only shows once
          await setDoc(userRef, { approvalShown: true }, { merge: true });
          console.log('✅ Set approvalShown flag to prevent loops');
          
          // Also check organization document
          try {
            const { collection, query, where, getDocs } = await import('firebase/firestore');
            const orgsQuery = query(
              collection(db!, 'organizations'),
              where('userId', '==', user.uid)
            );
            const orgsSnapshot = await getDocs(orgsQuery);
            if (!orgsSnapshot.empty) {
              const orgRef = orgsSnapshot.docs[0].ref;
              await setDoc(orgRef, { approvalShown: true }, { merge: true });
            }
          } catch (orgError) {
            console.warn('Could not update organization approvalShown:', orgError);
          }
        }
      } catch (error) {
        console.error('Error checking/setting approval status:', error);
      }
    };

    checkAndSetApprovalShown();
    
    // Auto-redirect to dashboard after 5 seconds (show congrats screen first)
    const redirectTimer = setTimeout(() => {
      router.replace('/vc/dashboard');
    }, 5000);
    
    return () => clearTimeout(redirectTimer);
  }, [user, claims, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-4xl w-full">
        {/* Success Card */}
        <div className="bg-black/80 backdrop-blur-lg rounded-3xl p-12 border-2 border-cyan-400/30 shadow-2xl shadow-cyan-500/20 text-center">
          {/* Success Icon */}
          <div className="mb-8">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl animate-pulse"></div>
              <NeonCyanIcon type="check" size={128} className="text-green-400 mx-auto relative" />
            </div>
          </div>

          {/* Congratulations Message */}
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
            Congratulations! 🎉
          </h1>
          <p className="text-2xl text-white mb-2">
            Your VC Account Has Been Approved!
          </p>
          <p className="text-gray-300 text-lg mb-12">
            Welcome to the CryptoRafts Investment Network
          </p>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-xl p-6 border border-cyan-500/30">
              <NeonCyanIcon type="chart" size={40} className="text-cyan-400 mx-auto mb-3" />
              <h3 className="text-white font-semibold mb-2">Deal Flow</h3>
              <p className="text-gray-400 text-sm">
                Access curated, AI-verified investment opportunities
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl p-6 border border-purple-500/30">
              <NeonCyanIcon type="sparkles" size={40} className="text-purple-400 mx-auto mb-3" />
              <h3 className="text-white font-semibold mb-2">RaftAI Insights</h3>
              <p className="text-gray-400 text-sm">
                Get AI-powered due diligence and risk analysis
              </p>
            </div>

            <div className="bg-gradient-to-br from-pink-500/10 to-rose-500/10 rounded-xl p-6 border border-pink-500/30">
              <NeonCyanIcon type="users" size={40} className="text-pink-400 mx-auto mb-3" />
              <h3 className="text-white font-semibold mb-2">Deal Rooms</h3>
              <p className="text-gray-400 text-sm">
                Collaborate with founders in secure, private rooms
              </p>
            </div>
          </div>

          {/* What's Next */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6 mb-8 text-left">
            <h3 className="text-white font-bold text-lg mb-4 flex items-center">
              <NeonCyanIcon type="rocket" size={24} className="text-blue-400 mr-2" />
              What You Can Do Now:
            </h3>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start">
                <span className="text-cyan-400 mr-3 font-bold">→</span>
                <span>Browse verified projects in your Deal Flow</span>
              </li>
              <li className="flex items-start">
                <span className="text-cyan-400 mr-3 font-bold">→</span>
                <span>Review AI-powered pitch analysis and ratings</span>
              </li>
              <li className="flex items-start">
                <span className="text-cyan-400 mr-3 font-bold">→</span>
                <span>Connect with KYC-verified founders</span>
              </li>
              <li className="flex items-start">
                <span className="text-cyan-400 mr-3 font-bold">→</span>
                <span>Build your investment portfolio</span>
              </li>
              <li className="flex items-start">
                <span className="text-cyan-400 mr-3 font-bold">→</span>
                <span>Access detailed analytics and reports</span>
              </li>
            </ul>
          </div>

          {/* CTA Button */}
          <button
            onClick={() => {
              // approvalShown is already set in useEffect, just redirect
              router.push('/vc/dashboard');
            }}
            className="group relative inline-flex items-center justify-center space-x-3 px-12 py-5 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 hover:from-cyan-600 hover:via-purple-600 hover:to-pink-600 text-white text-xl font-bold rounded-full transition-all shadow-lg shadow-purple-500/50 hover:shadow-purple-500/70 hover:scale-105"
          >
            <NeonCyanIcon type="rocket" size={28} className="text-current group-hover:animate-bounce" />
            <span>Launch Your Dashboard</span>
            <NeonCyanIcon type="sparkles" size={24} className="text-current animate-pulse" />
          </button>

          <p className="text-gray-400 text-sm mt-6">
            You'll be redirected to your personalized VC Dashboard
          </p>
        </div>

        {/* Welcome Message */}
        <div className="mt-8 text-center">
          <p className="text-gray-400 text-lg">
            🎊 Welcome to the future of crypto investments! 🎊
          </p>
        </div>
      </div>
    </div>
  );
}

