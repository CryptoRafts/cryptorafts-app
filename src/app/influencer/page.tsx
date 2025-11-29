"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { db } from '@/lib/firebase.client';
import { doc, getDoc } from 'firebase/firestore';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function InfluencerPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      if (isLoading || !user || !db) {
        setChecking(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db!, 'users', user.uid));
        
        if (!userDoc.exists()) {
          // No profile, redirect to register
          router.push('/influencer/register');
          return;
        }

        const userData = userDoc.data();
        
        // Check if profile is completed
        if (!userData.profileCompleted) {
          router.push('/influencer/register');
          return;
        }

        // Check KYC status
        const kycStatus = userData.kycStatus || userData.kyc?.status || 'not_submitted';
        
        if (kycStatus === 'not_submitted') {
          router.push('/influencer/kyc');
          return;
        }

        if (kycStatus === 'pending') {
          router.push('/influencer/pending-approval');
          return;
        }

        if (kycStatus === 'rejected') {
          router.push('/influencer/kyc');
          return;
        }

        // If approved, go to dashboard
        if (kycStatus === 'approved' || kycStatus === 'verified') {
          router.push('/influencer/dashboard');
          return;
        }

        // Default to dashboard
        router.push('/influencer/dashboard');
      } catch (error) {
        console.error('Error checking status:', error);
        router.push('/influencer/register');
      } finally {
        setChecking(false);
      }
    };

    checkStatus();
  }, [user, isLoading, router]);

  if (isLoading || checking) {
    return (
      <div className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return null;
}
