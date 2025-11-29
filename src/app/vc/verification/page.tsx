"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/providers/SimpleAuthProvider";
import { useRouter } from "next/navigation";
import { vcAuthManager } from "@/lib/vc-auth";
import { db, doc, getDoc, updateDoc, serverTimestamp } from "@/lib/firebase.client";
import { roleFlowManager } from "@/lib/role-flow-manager";
import Link from "next/link";
import Image from "next/image";
import VCKYBVerification from "@/components/VCKYBVerification";

interface VerificationStatus {
  kyb: {
    status: 'pending' | 'approved' | 'rejected';
    riskScore?: number;
    reasons?: string[];
    cooldownUntil?: number;
    submittedAt?: any;
  };
  kyc: {
    status: 'pending' | 'approved' | 'rejected';
    riskScore?: number;
    reasons?: string[];
    cooldownUntil?: number;
    submittedAt?: any;
  };
}

export default function VCVerification() {
  const { user, isLoading, isAuthenticated, claims } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [showKYBForm, setShowKYBForm] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [hasRedirected, setHasRedirected] = useState(false);

  // Single consolidated effect to prevent loops
  useEffect(() => {
    const checkAndRedirect = async () => {
      if (!isLoading && isAuthenticated && user && claims?.role === 'vc' && !hasRedirected) {
        try {
          // Use role flow manager to determine correct route
          const correctRoute = await roleFlowManager.getCorrectRoute();
          
          // If we're not on the correct route, redirect
          if (correctRoute !== '/vc/verification') {
            console.log('Redirecting to correct route:', correctRoute);
            setHasRedirected(true);
            window.location.href = correctRoute;
            return;
          }
          
          // Load verification status if we're on the correct route
          loadVerificationStatus();
        } catch (error) {
          console.error('Error checking route:', error);
        }
      } else if (!isLoading && (!isAuthenticated || claims?.role !== 'vc')) {
        router.push('/login');
      }
    };
    
    checkAndRedirect();
  }, [isLoading, isAuthenticated, user, claims, hasRedirected, router]);

  const loadVerificationStatus = async () => {
    if (!user || !db) return;
    const dbInstance = db; // Capture for type narrowing

    try {
      const userDoc = await getDoc(doc(dbInstance, 'users', user.uid));
      if (!userDoc.exists()) return;

      const userData = userDoc.data();
      setUserData(userData);
      const userOrgId = userData.orgId;
      
      if (!userOrgId) {
        console.log('No orgId found, redirecting to onboarding');
        setHasRedirected(true);
        window.location.href = '/vc/onboarding';
        return;
      }

      setOrgId(userOrgId);

      // Get organization KYB status
      const orgDoc = await getDoc(doc(dbInstance, 'organizations', userOrgId));
      const orgData = orgDoc.data();

      console.log('Organization KYB data:', orgData?.kyb);
      console.log('User KYC data:', userData.kyc);
      console.log('User onboarding step:', userData.onboarding?.step);
      
      // Check if user has completed onboarding (indicates KYB was submitted)
      const hasCompletedOnboarding = userData.onboarding?.step === 'done';
      const hasKYBData = orgData?.kyb && (orgData.kyb.status || orgData.kyb.riskScore || orgData.kyb.submittedAt);
      
      console.log('Has completed onboarding:', hasCompletedOnboarding);
      console.log('Has KYB data:', hasKYBData);
      
      setVerificationStatus({
        kyb: {
          status: orgData?.kyb?.status || 'pending',
          riskScore: orgData?.kyb?.riskScore,
          reasons: orgData?.kyb?.reasons,
          cooldownUntil: orgData?.kyb?.cooldownUntil,
          submittedAt: orgData?.kyb?.submittedAt || (hasCompletedOnboarding ? new Date() : undefined)
        },
        kyc: {
          status: userData.kyc?.status || 'pending',
          riskScore: userData.kyc?.riskScore,
          reasons: userData.kyc?.reasons,
          cooldownUntil: userData.kyc?.cooldownUntil,
          submittedAt: userData.kyc?.submittedAt
        }
      });

      // Check if KYB is approved (KYC is optional for VCs)
      if (orgData?.kyb?.status === 'approved') {
        console.log('KYB approved, redirecting to dashboard');
        setHasRedirected(true);
        window.location.href = '/vc/dashboard';
      }
    } catch (error) {
      console.error('Error loading verification status:', error);
      // Set default status if there's a permission error
      setVerificationStatus({
        kyb: {
          status: 'pending',
          riskScore: 0,
          reasons: [],
          cooldownUntil: undefined,
          submittedAt: undefined
        },
        kyc: {
          status: 'pending',
          riskScore: 0,
          reasons: [],
          cooldownUntil: undefined,
          submittedAt: undefined
        }
      });
      console.log('Using default verification status due to permission error');
    }
  };

  const startKYB = async () => {
    if (!orgId) return;
    setShowKYBForm(true);
  };

  const handleKYBComplete = async (result: any) => {
    setShowKYBForm(false);
    
    // Update user's onboarding step to 'done' when KYB is completed
    if (user && orgId && db) {
      try {
        await updateDoc(doc(db!, 'users', user.uid), {
          'onboarding.step': 'done',
          'onboarding.completedAt': Date.now(),
          updatedAt: serverTimestamp()
        });
        console.log('User onboarding step updated to done');
        
        // Mark KYB step as completed in role flow manager
        await roleFlowManager.markStepCompleted('kyb');
        
        // Get the correct route and redirect
        setTimeout(async () => {
          const correctRoute = await roleFlowManager.getCorrectRoute();
          console.log('Redirecting to correct route:', correctRoute);
          setHasRedirected(true);
          window.location.href = correctRoute;
        }, 1000);
      } catch (error) {
        console.error('Error updating user onboarding step:', error);
        // Still redirect to dashboard even if update fails
        setTimeout(async () => {
          const correctRoute = await roleFlowManager.getCorrectRoute();
          setHasRedirected(true);
          window.location.href = correctRoute;
        }, 1000);
      }
    } else {
      // If we can't update, still redirect to dashboard
      setTimeout(async () => {
        const correctRoute = await roleFlowManager.getCorrectRoute();
        setHasRedirected(true);
        window.location.href = correctRoute;
      }, 1000);
    }
    
    await loadVerificationStatus();
  };

  const startKYC = async () => {
    if (!user) return;
    
    setBusy(true);
    setError(null);
    
    try {
      // Simulate KYC process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update KYC status to approved (in real implementation, this would be done by webhook)
      await vcAuthManager.updateKYCStatus(user.uid, 'approved', 10, [], 'demo_vendor_ref');
      
      // Reload status
      await loadVerificationStatus();
    } catch (err: any) {
      setError(err?.message || 'Failed to start KYC process');
    } finally {
      setBusy(false);
    }
  };

  const retryKYB = async () => {
    if (!orgId) return;
    
    setBusy(true);
    setError(null);
    
    try {
      // Reset KYB status
      await vcAuthManager.updateKYBStatus(orgId, 'pending', undefined, [], undefined);
      
      // Show KYB form for resubmission
      setShowKYBForm(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to retry KYB');
    } finally {
      setBusy(false);
    }
  };

  const retryKYC = async () => {
    if (!user) return;
    
    setBusy(true);
    setError(null);
    
    try {
      // Reset KYC status
      await vcAuthManager.updateKYCStatus(user.uid, 'pending', undefined, [], undefined);
      
      // Reload status
      await loadVerificationStatus();
    } catch (err: any) {
      setError(err?.message || 'Failed to retry KYC');
    } finally {
      setBusy(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-400 bg-green-400/20';
      case 'rejected': return 'text-red-400 bg-red-400/20';
      case 'pending': return 'text-yellow-400 bg-yellow-400/20';
      default: return 'text-blue-400 bg-blue-400/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return '✅';
      case 'rejected': return '❌';
      case 'pending': return '⏳';
      default: return '🔄';
    }
  };

  const canRetry = (cooldownUntil?: number) => {
    if (!cooldownUntil) return true;
    return new Date() > new Date(cooldownUntil);
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
        <Link href="/role" className="btn-primary">Choose Role</Link>
      </div>
    );
  }

  if (!verificationStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white/60">Loading verification status...</p>
        </div>
      </div>
    );
  }

  // Show KYB form if needed
  if (showKYBForm && orgId) {
    return (
      <div className="min-h-screen neo-blue-background">
        <VCKYBVerification orgId={orgId} onComplete={handleKYBComplete} />
      </div>
    );
  }

  return (
    <div className="min-h-screen neo-blue-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image
              src="/cryptorafts.logo.png"
              alt="Cryptorafts"
              width={64}
              height={64}
              className="drop-shadow-[0_0_24px_rgba(255,255,255,.08)]"
              priority
            />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Verification Required</h1>
          <p className="text-white/60">Complete KYB verification to access the VC portal (KYC is optional)</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* KYB Verification */}
          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Organization KYB</h2>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(verificationStatus.kyb.status)}`}>
                <span className="mr-2">{getStatusIcon(verificationStatus.kyb.status)}</span>
                {verificationStatus.kyb.status.toUpperCase()}
              </div>
            </div>

            {/* KYB Rejection Message */}
            {verificationStatus.kyb.status === 'rejected' && (
              <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <h3 className="text-red-400 font-medium mb-2">KYB Verification Rejected</h3>
                <p className="text-red-300 text-sm mb-2">Your KYB submission was rejected. Please review the reasons below and resubmit.</p>
                {verificationStatus.kyb.reasons && verificationStatus.kyb.reasons.length > 0 && (
                  <ul className="text-red-300 text-sm space-y-1">
                    {verificationStatus.kyb.reasons.map((reason, index) => (
                      <li key={index}>• {reason}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <p className="text-white/60 text-sm mb-4">
              Verify your organization's business credentials and compliance status.
            </p>

            {verificationStatus.kyb.riskScore && (
              <div className="mb-4">
                <p className="text-white/60 text-sm">Risk Score: <span className="font-mono">{verificationStatus.kyb.riskScore}/100</span></p>
              </div>
            )}

            {verificationStatus.kyb.reasons && verificationStatus.kyb.reasons.length > 0 && (
              <div className="mb-4">
                <p className="text-white/60 text-sm mb-2">Verification Details:</p>
                <ul className="space-y-1">
                  {verificationStatus.kyb.reasons.map((reason, index) => (
                    <li key={index} className="text-white/60 text-sm">• {reason}</li>
                  ))}
                </ul>
              </div>
            )}

            {verificationStatus.kyb.cooldownUntil && !canRetry(verificationStatus.kyb.cooldownUntil) && (
              <div className="mb-4 bg-yellow-400/20 border border-yellow-400/30 rounded-lg p-3">
                <p className="text-yellow-300 text-sm">
                  Cooldown until: {new Date(verificationStatus.kyb.cooldownUntil).toLocaleString()}
                </p>
              </div>
            )}

            <div className="space-y-2">
              {verificationStatus.kyb.status === 'pending' && !verificationStatus.kyb.submittedAt && !verificationStatus.kyb.riskScore && (
                <button
                  onClick={startKYB}
                  disabled={busy}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
                >
                  {busy ? 'Processing...' : 'Start KYB Verification'}
                </button>
              )}

              {verificationStatus.kyb.status === 'pending' && (verificationStatus.kyb.submittedAt || verificationStatus.kyb.riskScore || userData?.onboarding?.step === 'done') && (
                <div className="text-center">
                  <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
                    <p className="text-yellow-400 text-sm font-medium">⏳ Waiting for Admin Approval</p>
                    <p className="text-yellow-300 text-xs mt-1">Your KYB submission is under review by our compliance team.</p>
                  </div>
                </div>
              )}

              {verificationStatus.kyb.status === 'rejected' && canRetry(verificationStatus.kyb.cooldownUntil) && (
                <button
                  onClick={retryKYB}
                  disabled={busy}
                  className="w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white rounded-lg transition-colors"
                >
                  {busy ? 'Processing...' : 'Retry KYB Verification'}
                </button>
              )}

              {verificationStatus.kyb.status === 'approved' && (
                <div className="text-center">
                  <p className="text-green-400 text-sm font-medium">✅ KYB Approved</p>
                </div>
              )}
            </div>
          </div>

          {/* KYC Verification */}
          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Representative KYC (Optional)</h2>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(verificationStatus.kyc.status)}`}>
                <span className="mr-2">{getStatusIcon(verificationStatus.kyc.status)}</span>
                {verificationStatus.kyc.status.toUpperCase()}
              </div>
            </div>

            <p className="text-white/60 text-sm mb-4">
              Verify your identity as the primary contact for this organization. This step is optional for VCs.
            </p>

            {verificationStatus.kyc.riskScore && (
              <div className="mb-4">
                <p className="text-white/60 text-sm">Risk Score: <span className="font-mono">{verificationStatus.kyc.riskScore}/100</span></p>
              </div>
            )}

            {verificationStatus.kyc.reasons && verificationStatus.kyc.reasons.length > 0 && (
              <div className="mb-4">
                <p className="text-white/60 text-sm mb-2">Verification Details:</p>
                <ul className="space-y-1">
                  {verificationStatus.kyc.reasons.map((reason, index) => (
                    <li key={index} className="text-white/60 text-sm">• {reason}</li>
                  ))}
                </ul>
              </div>
            )}

            {verificationStatus.kyc.cooldownUntil && !canRetry(verificationStatus.kyc.cooldownUntil) && (
              <div className="mb-4 bg-yellow-400/20 border border-yellow-400/30 rounded-lg p-3">
                <p className="text-yellow-300 text-sm">
                  Cooldown until: {new Date(verificationStatus.kyc.cooldownUntil).toLocaleString()}
                </p>
              </div>
            )}

            <div className="space-y-2">
              {verificationStatus.kyc.status === 'pending' && !verificationStatus.kyc.submittedAt && (
                <button
                  onClick={startKYC}
                  disabled={busy}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
                >
                  {busy ? 'Processing...' : 'Start KYC Verification'}
                </button>
              )}

              {verificationStatus.kyc.status === 'pending' && verificationStatus.kyc.submittedAt && (
                <div className="text-center">
                  <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
                    <p className="text-yellow-400 text-sm font-medium">⏳ Waiting for Admin Approval</p>
                    <p className="text-yellow-300 text-xs mt-1">Your KYC submission is under review by our compliance team.</p>
                  </div>
                </div>
              )}

              {verificationStatus.kyc.status === 'rejected' && canRetry(verificationStatus.kyc.cooldownUntil) && (
                <button
                  onClick={retryKYC}
                  disabled={busy}
                  className="w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white rounded-lg transition-colors"
                >
                  {busy ? 'Processing...' : 'Retry KYC Verification'}
                </button>
              )}

              {verificationStatus.kyc.status === 'approved' && (
                <div className="text-center">
                  <p className="text-green-400 text-sm font-medium">✅ KYC Approved</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status Summary */}
        <div className="mt-8 bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Verification Status</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <span className="text-white/60">Organization KYB:</span>
              <span className={`font-medium ${verificationStatus.kyb.status === 'approved' ? 'text-green-400' : 'text-yellow-400'}`}>
                {verificationStatus.kyb.status === 'approved' ? 'Approved' : 'Pending'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/60">Representative KYC:</span>
              <span className={`font-medium ${verificationStatus.kyc.status === 'approved' ? 'text-green-400' : 'text-yellow-400'}`}>
                {verificationStatus.kyc.status === 'approved' ? 'Approved' : 'Pending'}
              </span>
            </div>
          </div>

          {verificationStatus.kyb.status === 'approved' && (
            <div className="mt-4 text-center">
              <p className="text-green-400 font-medium mb-2">🎉 KYB verification complete!</p>
              <p className="text-white/60 text-sm">Redirecting to dashboard...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
