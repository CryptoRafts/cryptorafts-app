"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/SimpleAuthProvider";
import { db, doc, getDoc } from "@/lib/firebase.client";

export default function VCPortal(){
  const { user, isLoading, isAuthenticated, claims } = useAuth();
  const router = useRouter();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated && user && claims?.role === 'vc') {
      checkVCStatus();
    }
  }, [isLoading, isAuthenticated, user?.uid, claims?.role]);

  const checkVCStatus = async () => {
    if (!user || hasRedirected || !db) return;
    setHasRedirected(true);

    try {
      // Check user's profile in Firestore
      const userDoc = await getDoc(doc(db!, 'users', user.uid));
      
      if (!userDoc.exists()) {
        // New VC user - start with registration
        console.log('🔍 No user document found, redirecting to registration');
        router.push('/vc/register');
        return;
      }

      const userData = userDoc.data();
      const kybStatus = userData.kybStatus || userData.kyb?.status;
      const raftaiStatus = userData.raftaiStatus || userData.raftai?.status;
      const profileCompleted = userData.profileCompleted;
      const kybComplete = userData.kybComplete;

      console.log('🔍 VC Status Check:', {
        profileCompleted,
        kybComplete,
        kybStatus,
        raftaiStatus,
        userData
      });

      // ONBOARDING FLOW:
      // 1. Profile/Organization Registration (with logo)
      if (!profileCompleted) {
        console.log('❌ Profile not completed, redirecting to register');
        router.push('/vc/register');
        return;
      }

      // 2. KYB Verification
      if (!kybComplete && kybStatus !== 'approved') {
        console.log('❌ KYB not completed, redirecting to KYB');
        router.push('/vc/kyb');
        return;
      }

      // 3. Waiting for Approval (RaftAI + Admin)
      if (kybStatus !== 'approved' && kybStatus !== 'verified') {
        console.log('⏳ KYB not approved yet, redirecting to waiting approval');
        router.push('/vc/waiting-approval');
        return;
      }

      // 4. Approved! Show congratulations (one-time only) OR go directly to dashboard
      if (kybStatus === 'approved' || kybStatus === 'verified') {
        if (!userData.approvalShown) {
          console.log('🎉 Approved! Showing congratulations');
          router.push('/vc/approved');
          return;
        } else {
          // Already shown, go directly to dashboard
          console.log('✅ Approval already shown, redirecting to dashboard');
          router.push('/vc/dashboard');
          return;
        }
      }

      // 5. All complete - go to dashboard
      console.log('✅ All checks passed, redirecting to dashboard');
      router.push('/vc/dashboard');
    } catch (error) {
      console.error('❌ Error checking VC status:', error);
      // On error, redirect to registration to start fresh
      router.push('/vc/register');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated || claims?.role !== 'vc') {
    return (
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-white/60">This page is for VCs only.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-white/60">Checking VC status...</p>
      </div>
    </div>
  );
}
