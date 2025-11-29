"use client";
import React from 'react';
import { db } from '@/lib/firebase.client';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { auth } from '@/lib/firebase.client';
import { useSimpleAuth } from '@/lib/auth-simple';

export interface GateStatus {
  isUnlocked: boolean;
  requirements: string[];
  completed: string[];
  missing: string[];
  nextSteps: string[];
  estimatedTime?: number;
}

export interface VerificationGate {
  kycRequired: boolean;
  kybRequired: boolean;
  profileCompleted: boolean;
  roleSelected: boolean;
  onboardingCompleted: boolean;
}

export class RealTimeGating {
  private static instance: RealTimeGating;
  private listeners: Map<string, () => void> = new Map();

  static getInstance(): RealTimeGating {
    if (!RealTimeGating.instance) {
      RealTimeGating.instance = new RealTimeGating();
    }
    return RealTimeGating.instance;
  }

  async checkGateStatus(userId: string, gateType: string): Promise<GateStatus> {
    try {
      const firestore = db;
      if (!firestore) {
        throw new Error('Firestore not initialized');
      }

      const userDocRef = doc(firestore, 'users', userId);
      
      return new Promise((resolve) => {
        const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data();
            const status = this.calculateGateStatus(userData, gateType);
            resolve(status);
          } else {
            resolve({
              isUnlocked: false,
              requirements: ['User profile not found'],
              completed: [],
              missing: ['User profile not found'],
              nextSteps: ['Create user profile']
            });
          }
        });
        
        // Store listener for cleanup
        this.listeners.set(`${userId}_${gateType}`, unsubscribe);
      });
    } catch (error) {
      console.error('Error checking gate status:', error);
      return {
        isUnlocked: false,
        requirements: ['Error checking status'],
        completed: [],
        missing: ['Error checking status'],
        nextSteps: ['Contact support']
      };
    }
  }

  private calculateGateStatus(userData: any, gateType: string): GateStatus {
    const requirements: string[] = [];
    const completed: string[] = [];
    const missing: string[] = [];
    const nextSteps: string[] = [];

    // Base requirements for all gates
    const baseRequirements = [
      'User profile created',
      'Role selected',
      'Profile completed'
    ];

    // Role-specific requirements
    const role = userData.role;
    const isOrgRole = ['vc', 'exchange', 'ido', 'agency'].includes(role);
    
    if (isOrgRole) {
      requirements.push('KYB verification', 'Representative KYC');
    } else {
      requirements.push('KYC verification');
    }

    // Gate-specific requirements
    switch (gateType) {
      case 'founder_portal':
        requirements.push('KYC approved');
        if (userData.kybStatus !== 'approved') {
          requirements.push('Optional: KYB verification');
        }
        break;
      
      case 'vc_portal':
        requirements.push('KYB approved', 'Representative KYC approved');
        break;
      
      case 'exchange_portal':
        requirements.push('KYB approved', 'Representative KYC approved');
        break;
      
      case 'ido_portal':
        requirements.push('KYB approved', 'Representative KYC approved');
        break;
      
      case 'influencer_portal':
        requirements.push('KYC approved');
        break;
      
      case 'agency_portal':
        requirements.push('KYB approved', 'Representative KYC approved');
        break;
      
      case 'pitch_submission':
        requirements.push('KYC approved', 'Profile photo uploaded');
        break;
      
      case 'deal_flow':
        requirements.push('KYB approved', 'Representative KYC approved');
        break;
      
      case 'campaign_management':
        requirements.push('KYC approved', 'Profile photo uploaded');
        break;
    }

    // Check completion status
    if (userData.profileCompleted) completed.push('Profile completed');
    else missing.push('Profile completed');

    if (userData.role) completed.push('Role selected');
    else missing.push('Role selected');

    if (userData.kycStatus === 'approved') completed.push('KYC approved');
    else if (userData.kycStatus === 'pending') missing.push('KYC verification');
    else missing.push('KYC verification');

    if (isOrgRole) {
      if (userData.kybStatus === 'approved') completed.push('KYB approved');
      else if (userData.kybStatus === 'pending') missing.push('KYB verification');
      else missing.push('KYB verification');

      if (userData.representativeKyc === 'approved') completed.push('Representative KYC approved');
      else missing.push('Representative KYC approved');
    }

    // Generate next steps
    if (missing.includes('Profile completed')) {
      nextSteps.push('Complete your profile with required information');
    }
    if (missing.includes('KYC verification')) {
      nextSteps.push('Start KYC verification process');
    }
    if (missing.includes('KYB verification')) {
      nextSteps.push('Start KYB verification process');
    }
    if (missing.includes('Representative KYC approved')) {
      nextSteps.push('Complete representative KYC verification');
    }

    // Calculate estimated time
    const estimatedTime = this.calculateEstimatedTime(missing);

    const isUnlocked = missing.length === 0 || 
                      (gateType === 'founder_portal' && 
                       !missing.includes('KYC verification') && 
                       !missing.includes('Profile completed'));

    return {
      isUnlocked,
      requirements,
      completed,
      missing,
      nextSteps,
      estimatedTime
    };
  }

  private calculateEstimatedTime(missing: string[]): number {
    const timeEstimates = {
      'Profile completed': 10,
      'KYC verification': 15,
      'KYB verification': 20,
      'Representative KYC approved': 15,
      'Role selected': 2
    };

    return missing.reduce((total, item) => {
      return total + (timeEstimates[item as keyof typeof timeEstimates] || 5);
    }, 0);
  }

  async unlockFeature(userId: string, feature: string): Promise<boolean> {
    try {
      const firestore = db;
      if (!firestore) {
        throw new Error('Firestore not initialized');
      }
      const userDoc = doc(firestore, 'users', userId);
      await updateDoc(userDoc, {
        [`unlockedFeatures.${feature}`]: true,
        lastUpdated: Date.now()
      });

      // Trigger claims refresh
      await this.refreshUserClaims(userId);
      return true;
    } catch (error) {
      console.error('Error unlocking feature:', error);
      return false;
    }
  }

  async lockFeature(userId: string, feature: string): Promise<boolean> {
    try {
      const firestore = db;
      if (!firestore) {
        throw new Error('Firestore not initialized');
      }
      const userDoc = doc(firestore, 'users', userId);
      await updateDoc(userDoc, {
        [`unlockedFeatures.${feature}`]: false,
        lastUpdated: Date.now()
      });

      // Trigger claims refresh
      await this.refreshUserClaims(userId);
      return true;
    } catch (error) {
      console.error('Error locking feature:', error);
      return false;
    }
  }

  private async refreshUserClaims(userId: string): Promise<void> {
    try {
      // Force token refresh by calling getIdToken(true)
      const user = auth.currentUser;
      if (user && user.uid === userId) {
        await user.getIdToken(true);
      }
    } catch (error) {
      console.error('Error refreshing user claims:', error);
    }
  }

  cleanup(): void {
    // Clean up all listeners
    this.listeners.forEach((unsubscribe) => {
      try {
        unsubscribe();
      } catch (error) {
        console.error('Error cleaning up listener:', error);
      }
    });
    this.listeners.clear();
  }
}

// React hook for real-time gating
export function useRealTimeGate(gateType: string) {
  const { user } = useSimpleAuth();
  const [gateStatus, setGateStatus] = React.useState<GateStatus | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const realTimeGating = RealTimeGating.getInstance();
    
    realTimeGating.checkGateStatus(user.uid, gateType).then((status) => {
      setGateStatus(status);
      setLoading(false);
    });

    return () => {
      // Cleanup is handled by the RealTimeGating class
    };
  }, [user?.uid, gateType]);

  return { gateStatus, loading };
}

// Gate component for conditional rendering
export function Gate({ 
  gateType, 
  children, 
  fallback, 
  showRequirements = true 
}: {
  gateType: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showRequirements?: boolean;
}) {
  const { gateStatus, loading } = useRealTimeGate(gateType);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (gateStatus?.isUnlocked) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (showRequirements && gateStatus) {
    return (
      <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
        <div className="text-center space-y-6">
          <div className="text-6xl">🔒</div>
          
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Feature Locked
            </h2>
            <p className="text-slate-400 mb-4">
              Complete the requirements below to unlock this feature
            </p>
          </div>

          {gateStatus.estimatedTime && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <p className="text-blue-400 text-sm">
                Estimated time to complete: {gateStatus.estimatedTime} minutes
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <div>
              <h3 className="font-semibold text-white mb-3">✅ Completed</h3>
              <ul className="space-y-2">
                {gateStatus.completed.map((item, index) => (
                  <li key={index} className="flex items-center gap-2 text-green-400">
                    <span>✓</span>
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-3">❌ Missing</h3>
              <ul className="space-y-2">
                {gateStatus.missing.map((item, index) => (
                  <li key={index} className="flex items-center gap-2 text-red-400">
                    <span>✗</span>
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {gateStatus.nextSteps.length > 0 && (
            <div className="bg-slate-800/50 border border-white/10 rounded-lg p-4">
              <h3 className="font-semibold text-white mb-2">Next Steps:</h3>
              <ul className="space-y-1">
                {gateStatus.nextSteps.map((step, index) => (
                  <li key={index} className="text-sm text-slate-300">
                    {index + 1}. {step}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={() => window.location.href = '/onboarding'}
            className="btn-neon-primary"
          >
            Complete Requirements
          </button>
        </div>
      </div>
    );
  }

  return null;
}
