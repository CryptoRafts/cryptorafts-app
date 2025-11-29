"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/SimpleAuthProvider';
import ApprovalSuccess from './ApprovalSuccess';
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';

interface PendingApprovalProps {
  role: string;
  verificationType: 'kyc' | 'kyb';
}

export default function PendingApproval({ role, verificationType }: PendingApprovalProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<string>('pending');
  const [checking, setChecking] = useState(true);
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    if (!user) return;

    let isMounted = true;
    let unsubscribe: (() => void) | null = null;

    const setupListener = async () => {
      try {
        // FIXED: Use waitForFirebase and ensureDb properly
        const { ensureDb, waitForFirebase, createSnapshotErrorHandler } = await import('@/lib/firebase-utils');
        
        const isReady = await waitForFirebase(10000);
        if (!isReady || !isMounted) {
          if (isMounted) {
            setChecking(false);
          }
          return;
        }
        
        const firestore = ensureDb();
        if (!firestore || !isMounted) {
          if (isMounted) {
            setChecking(false);
          }
          return;
        }

        const { doc, onSnapshot, collection, query, where, getDocs } = await import('firebase/firestore');
        
        // Set up listener for user document
        const userUnsubscribe = onSnapshot(
          doc(firestore, 'users', user.uid),
          (snap) => {
            if (!isMounted) return;
            
            if (snap.exists()) {
              const data = snap.data();
              // Check all possible status fields - prioritize actual status over "not_submitted"
              // For KYB: prioritize kyb.status (nested object) or kybStatus, then kyb_status
              // Skip "not_submitted" if there's a more specific status
              let currentStatus: string;
              
              if (verificationType === 'kyc') {
                // For KYC: check all possible fields, prioritize non-empty values
                // Check if user has submitted KYC (has kyc_documents entry or kyc data)
                const hasKycSubmission = data.kyc || data.kycStatus || data.kyc_status || 
                                        (data.kyc && Object.keys(data.kyc).length > 0);
                
                // Priority order: kyc_status > kycStatus > kyc.status > (pending if submitted) > 'not_submitted'
                currentStatus = data.kyc_status || data.kycStatus || data.kyc?.status;
                
                // If no status found but user has submitted KYC, treat as pending
                if (!currentStatus && hasKycSubmission) {
                  currentStatus = 'pending';
                }
                
                // Default to 'not_submitted' only if truly no KYC data exists
                if (!currentStatus) {
                  currentStatus = 'not_submitted';
                }
              } else {
                // For KYB: prioritize kyb.status (nested), then kybStatus, then kyb_status
                // Normalize all statuses to lowercase for comparison
                const normalizeStatus = (status: any): string => {
                  if (!status) return '';
                  return String(status).toLowerCase().trim();
                };
                
                const kybStatusNested = normalizeStatus(data.kyb?.status);
                const kybStatusTop = normalizeStatus(data.kybStatus);
                const kyb_statusField = normalizeStatus(data.kyb_status);
                
                // Priority order: approved/verified > pending > not_submitted
                // If nested status exists and is not "not_submitted", use it
                if (kybStatusNested && kybStatusNested !== 'not_submitted' && kybStatusNested !== 'notsubmitted') {
                  currentStatus = kybStatusNested;
                } else if (kybStatusTop && kybStatusTop !== 'not_submitted' && kybStatusTop !== 'notsubmitted') {
                  currentStatus = kybStatusTop;
                } else if (kyb_statusField && kyb_statusField !== 'not_submitted' && kyb_statusField !== 'notsubmitted') {
                  currentStatus = kyb_statusField;
                } else {
                  // If all are "not_submitted" but user has submitted (has kybSubmittedAt), treat as pending
                  if (data.kybSubmittedAt || data.kyb?.submittedAt) {
                    currentStatus = 'pending';
                  } else {
                    // Use the first non-"not_submitted" value found, or default to pending
                    currentStatus = kybStatusNested || kybStatusTop || kyb_statusField || 'pending';
                  }
                }
              }
              
              console.log('🔍 [PendingApproval] Status check:', {
                verificationType,
                kycStatus: data.kycStatus,
                kyc_status: data.kyc_status,
                kyc_object_status: data.kyc?.status,
                kybStatus: data.kybStatus,
                kyb_status: data.kyb_status,
                kyb_object_status: data.kyb?.status,
                currentStatus,
                userId: user.uid,
                hasKycData: !!(data.kyc || data.kycStatus || data.kyc_status)
              });
              
              // Normalize currentStatus for comparison
              const normalizedStatus = currentStatus ? String(currentStatus).toLowerCase().trim() : '';
              
              // CRITICAL: If status is 'not_submitted', redirect to appropriate page
              if (normalizedStatus === 'not_submitted' || normalizedStatus === 'notsubmitted' || !normalizedStatus) {
                console.log('🛡️ [PendingApproval] Status is not_submitted, redirecting to appropriate page');
                if (isMounted) {
                  setChecking(false);
                  // Check if profile is completed
                  if (!data.profileCompleted) {
                    router.push(`/${role}/register`);
                  } else {
                    router.push(`/${role}/${verificationType === 'kyc' ? 'kyc' : 'kyb'}`);
                  }
                }
                return;
              }
              
              // Update status with normalized value
              currentStatus = normalizedStatus;
              
              console.log('✅ [PendingApproval] Setting status:', {
                normalizedStatus,
                willShowApproval: normalizedStatus === 'approved' || normalizedStatus === 'verified',
                rawData: {
                  kybStatus: data.kybStatus,
                  kyb_status: data.kyb_status,
                  kyb_object_status: data.kyb?.status
                }
              });
              
              setStatus(currentStatus || 'pending');
              
              // Get user name for congratulations screen
              if (data.name || data.displayName || data.fullName) {
                setUserName(data.name || data.displayName || data.fullName);
              } else if (user.displayName) {
                setUserName(user.displayName);
              } else if (user.email) {
                setUserName(user.email.split('@')[0]);
              }
            } else {
              console.warn('⚠️ [PendingApproval] User document does not exist');
            }
            if (isMounted) {
              setChecking(false);
            }
          },
          createSnapshotErrorHandler(`${role} ${verificationType} pending approval`)
        );
        
        // Also listen to organizations collection as backup (for KYB)
        let orgUnsubscribe: (() => void) | null = null;
        if (verificationType === 'kyb') {
          try {
            const orgsQuery = query(
              collection(firestore, 'organizations'),
              where('userId', '==', user.uid)
            );
            
            orgUnsubscribe = onSnapshot(
              orgsQuery,
              (orgSnapshot) => {
                if (!isMounted) return;
                
                if (!orgSnapshot.empty) {
                  const orgDoc = orgSnapshot.docs[0];
                  const orgData = orgDoc.data();
                  const orgKybStatus = orgData.kybStatus;
                  
                  if (orgKybStatus) {
                    const normalizedOrgStatus = String(orgKybStatus).toLowerCase().trim();
                    console.log('🏢 [PendingApproval] Organization status update:', {
                      orgKybStatus: normalizedOrgStatus,
                      userId: user.uid
                    });
                    
                    // If organization shows approved, update status immediately
                    if (normalizedOrgStatus === 'approved' || normalizedOrgStatus === 'verified') {
                      console.log('✅ [PendingApproval] Detected approval from organization document');
                      setStatus(normalizedOrgStatus);
                      setChecking(false);
                    } else if (normalizedOrgStatus === 'pending') {
                      // Keep pending status if org shows pending
                      setStatus('pending');
                    }
                  }
                }
              },
              createSnapshotErrorHandler(`${role} ${verificationType} organization status`)
            );
          } catch (orgError) {
            console.warn('⚠️ Could not set up organization listener:', orgError);
          }
        }
        
        // Combine both unsubscribe functions
        unsubscribe = () => {
          userUnsubscribe();
          if (orgUnsubscribe) {
            orgUnsubscribe();
          }
        };
      } catch (error) {
        if (isMounted) {
          console.error('❌ Error setting up status listener:', error);
          setChecking(false);
        }
      }
    };

    setupListener();

    return () => {
      isMounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user, role, verificationType, router]);

  const roleNames: Record<string, string> = {
    founder: 'Founder',
    vc: 'VC',
    exchange: 'Exchange',
    ido: 'IDO Platform',
    agency: 'Marketing Agency',
    influencer: 'Influencer',
  };

  const verificationLabels: Record<string, { title: string; description: string }> = {
    founder: {
      title: 'Founder Registration',
      description: 'Complete KYC verification to access the founder platform'
    },
    vc: {
      title: 'VC Registration',
      description: 'Complete KYC verification to access the VC platform'
    },
    exchange: {
      title: 'Exchange Registration',
      description: 'Complete KYB verification to access the exchange platform'
    },
    ido: {
      title: 'IDO Platform Registration',
      description: 'Complete KYB verification to access IDO features'
    },
    agency: {
      title: 'Marketing Agency Registration',
      description: 'Complete KYB verification to access marketing features'
    },
    influencer: {
      title: 'Influencer Registration',
      description: 'Complete KYC verification to access influencer features'
    },
  };

  if (checking) {
    return (
      <div 
        className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center pt-24"
        style={{
          backgroundImage: 'url("/worldmap.png")'
        }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Checking your status...</p>
        </div>
      </div>
    );
  }

  // Normalize status for comparison (handle both cases)
  const normalizedCurrentStatus = status ? String(status).toLowerCase().trim() : 'pending';
  
  console.log('🎯 [PendingApproval] Render check:', {
    status,
    normalizedCurrentStatus,
    willShowApproval: normalizedCurrentStatus === 'approved' || normalizedCurrentStatus === 'verified',
    checking
  });
  
  if (normalizedCurrentStatus === 'verified' || normalizedCurrentStatus === 'approved') {
    console.log('🎉 [PendingApproval] Showing ApprovalSuccess component');
    return (
      <ApprovalSuccess
        role={role}
        userName={userName}
        onContinue={() => {
          router.push(`/${role}/dashboard`);
        }}
      />
    );
  }

  if (status === 'rejected') {
    return (
      <div 
        className="min-h-screen bg-cover bg-center bg-no-repeat pt-24 pb-12 px-4"
        style={{
          backgroundImage: 'url("/worldmap.png")'
        }}
      >
        <div className="max-w-2xl mx-auto">
          <div className="bg-gradient-to-r from-red-600/20 to-orange-600/20 backdrop-blur-lg rounded-2xl p-8 border border-red-500/20 shadow-2xl">
            <div className="text-center mb-6">
              <div className="bg-red-500/20 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center border-2 border-red-400/30">
                <NeonCyanIcon type="exclamation" size={48} className="text-red-400" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Verification Rejected</h2>
              <p className="text-white/70 text-lg">
                Your {verificationType.toUpperCase()} submission needs to be resubmitted
              </p>
            </div>
            
            <div className="bg-gray-800/50 rounded-xl p-6 mb-6">
              <h3 className="text-white font-semibold mb-3 flex items-center">
                <NeonCyanIcon type="shield" size={20} className="text-current mr-2" />
                Next Steps
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-white/80">
                <li>Review your submission for any errors or missing information</li>
                <li>Update your documents and resubmit your {verificationType.toUpperCase()}</li>
                <li>Wait for admin review (usually 24-48 hours)</li>
              </ol>
            </div>

            <button
              onClick={() => router.push(`/${role}/${verificationType}`)}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white py-3 px-6 rounded-lg font-semibold transition-all duration-300"
            >
              Resubmit {verificationType.toUpperCase()}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat pt-24 pb-12 px-4"
      style={{
        backgroundImage: 'url("/worldmap.png")'
      }}
    >
      <div className="max-w-3xl mx-auto w-full">
        <div className="bg-gradient-to-r from-cyan-600/20 to-blue-600/20 backdrop-blur-lg rounded-2xl p-8 border border-cyan-500/20 shadow-2xl">
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center border-2 border-cyan-400/30">
              <NeonCyanIcon type="shield" size={48} className="text-cyan-300 animate-pulse" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Pending Approval
            </h1>
            <p className="text-white/70 text-lg">
              {verificationLabels[role]?.title}
            </p>
          </div>

          <div className="bg-gray-800/50 rounded-xl p-6 mb-6">
            <h3 className="text-white font-semibold mb-4 flex items-center">
              <NeonCyanIcon type="analytics" size={20} className="text-current mr-2" />
              What's Happening?
            </h3>
            <p className="text-white/80 mb-4">
              {verificationLabels[role]?.description}
            </p>
            <div className="flex items-start space-x-3 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <NeonCyanIcon type="analytics" size={20} className="text-cyan-500 flex-shrink-0 mt-0.5 animate-spin" />
              <div className="text-white/80 text-sm">
                Your {verificationType.toUpperCase()} submission is currently being reviewed by RaftAI and our team. 
                This typically takes 24-48 hours. You'll receive an email once the review is complete.
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-800/50 rounded-xl p-4 border border-white/10">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-full mb-3 border-2 border-blue-400/30">
                <NeonCyanIcon type="analytics" size={32} className="text-blue-300" />
              </div>
              <h4 className="text-white font-semibold mb-1">Profile Complete</h4>
              <p className="text-white/60 text-sm">Your profile information is submitted</p>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4 border border-yellow-500/20">
              <div className="flex items-center justify-center w-16 h-16 bg-yellow-500/20 rounded-full mb-3 border-2 border-yellow-400/30">
                <NeonCyanIcon type="shield" size={32} className="text-yellow-300" />
              </div>
              <h4 className="text-white font-semibold mb-1">Under Review</h4>
              <p className="text-white/60 text-sm">Documents being verified</p>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4 border border-white/10">
              <div className="flex items-center justify-center w-16 h-16 bg-gray-500/20 rounded-full mb-3 border-2 border-gray-400/30">
                <NeonCyanIcon type="shield" size={32} className="text-gray-300" />
              </div>
              <h4 className="text-white font-semibold mb-1">Awaiting Access</h4>
              <p className="text-white/60 text-sm">Platform access pending</p>
            </div>
          </div>

          <div className="bg-gray-800/50 rounded-xl p-6">
            <h3 className="text-white font-semibold mb-3">What to Expect</h3>
            <ul className="space-y-2 text-white/80 text-sm">
              <li className="flex items-start">
                <NeonCyanIcon type="check" size={20} className="text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span>Email notification when your account is approved</span>
              </li>
              <li className="flex items-start">
                <NeonCyanIcon type="check" size={20} className="text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span>Full access to all {roleNames[role]} platform features</span>
              </li>
              <li className="flex items-start">
                <NeonCyanIcon type="check" size={20} className="text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span>Dashboard with role-specific tools and analytics</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
