"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/SimpleAuthProvider';
import PendingApproval from "@/components/PendingApproval";
import { ensureDb, waitForFirebase } from '@/lib/firebase-utils';
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';
import ApprovalSuccess from '@/components/ApprovalSuccess';

export default function FounderPendingApproval() {
  const { user } = useAuth();
  const router = useRouter();
  const [pitchStatus, setPitchStatus] = useState<string>('pending');
  const [checkingPitch, setCheckingPitch] = useState(true);
  const [userName, setUserName] = useState<string>('');

  // Check pitch status separately
  useEffect(() => {
    if (!user) return;

    const checkPitchStatus = async () => {
      try {
        const isReady = await waitForFirebase(5000);
        if (!isReady) {
          setCheckingPitch(false);
          return;
        }

        const dbInstance = ensureDb();
        if (!dbInstance) {
          setCheckingPitch(false);
          return;
        }

        const { collection, query, where, getDocs, onSnapshot } = await import('firebase/firestore');
        
        // Check for user's latest pitch
        const projectsQuery = query(
          collection(dbInstance, 'projects'),
          where('founderId', '==', user.uid)
        );

        const unsubscribe = onSnapshot(projectsQuery, (snapshot) => {
          const projects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          
          // Sort by submittedAt descending
          projects.sort((a: any, b: any) => {
            const aTime = a.submittedAt?.toDate?.()?.getTime() || a.submittedAt || 0;
            const bTime = b.submittedAt?.toDate?.()?.getTime() || b.submittedAt || 0;
            return bTime - aTime;
          });

          if (projects.length > 0) {
            const latestProject = projects[0];
            const status = latestProject.status || latestProject.reviewStatus || 'pending';
            setPitchStatus(status);
            
            // Get user name
            if (latestProject.founderName) {
              setUserName(latestProject.founderName);
            }
          } else {
            setPitchStatus('not_submitted');
          }
          
          setCheckingPitch(false);
        }, (error: any) => {
          console.error('Error checking pitch status:', error);
          setCheckingPitch(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error setting up pitch status check:', error);
        setCheckingPitch(false);
      }
    };

    checkPitchStatus();
  }, [user]);

  // Show pitch approval status if pitch is pending
  if (!checkingPitch && (pitchStatus === 'pending' || pitchStatus === 'pending_review' || pitchStatus === 'under_review')) {
    return (
      <div 
        className="min-h-screen bg-cover bg-center bg-no-repeat pb-12 px-4"
        style={{
          backgroundImage: 'url("/worldmap.png")'
        }}
      >
        {/* Spacer for fixed header */}
        <div className="h-20 sm:h-24 md:h-28 flex-shrink-0"></div>
        <div className="max-w-2xl mx-auto">
          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-lg rounded-2xl p-8 border border-blue-500/20 shadow-2xl">
            <div className="text-center mb-6">
              <div className="bg-blue-500/20 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center border-2 border-blue-400/30">
                <NeonCyanIcon type="clock" size={48} className="text-blue-400" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Pitch Under Review</h2>
              <p className="text-white/70 text-lg">
                Your pitch is being reviewed by our admin team
              </p>
            </div>
            
            <div className="bg-gray-800/50 rounded-xl p-6 mb-6">
              <h3 className="text-white font-semibold mb-3 flex items-center">
                <NeonCyanIcon type="rocket" size={20} className="text-current mr-2" />
                What Happens Next?
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-white/80">
                <li>Admin reviews your pitch submission</li>
                <li>RaftAI analysis is performed on your project</li>
                <li>You'll be notified once your pitch is approved</li>
                <li>Once approved, your project will be visible to VCs, Exchanges, IDO platforms, and other roles</li>
              </ol>
            </div>

            <div className="text-center">
              <button
                onClick={() => router.push('/founder/dashboard')}
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold rounded-lg transition-all shadow-lg shadow-cyan-500/20"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show success if pitch is approved
  if (!checkingPitch && (pitchStatus === 'approved')) {
    return (
      <ApprovalSuccess
        role="founder"
        userName={userName || user?.displayName || 'Founder'}
        onContinue={() => {
          router.push('/founder/dashboard');
        }}
      />
    );
  }

  // Default: Show KYC pending approval
  return <PendingApproval role="founder" verificationType="kyc" />;
}
