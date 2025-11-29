// Real-time data loading for admin dashboard - NO MOCK DATA
// This file contains only real Firebase data fetching functions

import { ensureDb } from '@/lib/firebase-utils';
import { collection, getDocs, onSnapshot } from 'firebase/firestore';

export interface AdminStats {
  users: {
    total: number;
    active: number;
    pendingKYC: number;
    verified: number;
  };
  projects: {
    total: number;
    active: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  spotlights: {
    total: number;
    active: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  kyc: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    highRisk: number;
  };
  kyb: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  departments: {
    total: number;
    active: number;
    inactive: number;
    totalMembers: number;
  };
}

export async function loadRealAdminData(): Promise<AdminStats> {
  console.log('🔄 Loading REAL admin data from Firebase...');

  try {
    const dbInstance = ensureDb();
    if (!dbInstance) {
      throw new Error('Firebase database not initialized');
    }

    // Load Users - REAL DATA ONLY
    const usersSnapshot = await getDocs(collection(dbInstance, 'users'));
    const usersData = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Load Projects - REAL DATA ONLY
    const projectsSnapshot = await getDocs(collection(dbInstance, 'projects'));
    const projectsData = projectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Load Spotlights - REAL DATA ONLY
    const spotlightsSnapshot = await getDocs(collection(dbInstance, 'spotlights'));
    const spotlightsData = spotlightsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Load KYC Documents - REAL DATA ONLY
    const kycSnapshot = await getDocs(collection(dbInstance, 'kyc_documents'));
    const kycData = kycSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Load KYB Documents - REAL DATA ONLY
    const kybSnapshot = await getDocs(collection(dbInstance, 'organizations'));
    const kybData = kybSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Load Departments - REAL DATA ONLY
    const departmentsSnapshot = await getDocs(collection(dbInstance, 'departments'));
    const departmentsData = departmentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Calculate real stats
    const stats: AdminStats = {
      users: {
        total: usersData.length,
        active: usersData.filter((u: any) => u.isActive !== false).length,
        pendingKYC: usersData.filter((u: any) => u.kycStatus === 'pending').length,
        verified: usersData.filter((u: any) => u.kycStatus === 'approved' || u.verificationLevel === 'advanced').length
      },
      projects: {
        total: projectsData.length,
        active: projectsData.filter((p: any) => p.isActive !== false).length,
        pending: projectsData.filter((p: any) => p.status === 'pending').length,
        approved: projectsData.filter((p: any) => p.status === 'approved').length,
        rejected: projectsData.filter((p: any) => p.status === 'rejected').length
      },
      spotlights: {
        total: spotlightsData.length,
        active: spotlightsData.filter((s: any) => s.isActive === true).length,
        pending: spotlightsData.filter((s: any) => s.status === 'pending').length,
        approved: spotlightsData.filter((s: any) => s.status === 'approved' || s.status === 'active').length,
        rejected: spotlightsData.filter((s: any) => s.status === 'rejected').length
      },
      kyc: {
        total: kycData.length,
        pending: kycData.filter((k: any) => k.status === 'pending').length,
        approved: kycData.filter((k: any) => k.status === 'approved').length,
        rejected: kycData.filter((k: any) => k.status === 'rejected').length,
        highRisk: kycData.filter((k: any) => (k.riskScore || 0) > 70).length
      },
      kyb: {
        total: kybData.length,
        pending: kybData.filter((k: any) => k.kybStatus === 'pending').length,
        approved: kybData.filter((k: any) => k.kybStatus === 'approved').length,
        rejected: kybData.filter((k: any) => k.kybStatus === 'rejected').length
      },
      departments: {
        total: departmentsData.length,
        active: departmentsData.filter((d: any) => d.status === 'active').length,
        inactive: departmentsData.filter((d: any) => d.status === 'inactive').length,
        totalMembers: departmentsData.reduce((sum: number, d: any) => sum + (d.memberCount || 0), 0)
      }
    };

    console.log('✅ Real admin data loaded successfully:', stats);
    return stats;
  } catch (error: any) {
    console.error('❌ Error loading real admin data:', error);
    throw error;
  }
}

export function setupRealTimeUpdates(
  onStatsUpdate: (stats: AdminStats) => void
): () => void {
  console.log('🔄 Setting up real-time updates for admin dashboard...');

  const { ensureDb } = require('@/lib/firebase-utils');
  const dbInstance = ensureDb();
  
  if (!dbInstance) {
    console.error('❌ Firebase database not initialized');
    return () => {}; // Return empty cleanup function
  }

  const unsubscribeFunctions: (() => void)[] = [];

  // Setup real-time listener for each collection
  const collections = [
    'users',
    'projects',
    'spotlights',
    'kyc_documents',
    'organizations',
    'departments'
  ];

  collections.forEach(collectionName => {
    const unsubscribe = onSnapshot(
      collection(dbInstance, collectionName),
      async () => {
        console.log(`📊 ${collectionName} collection updated, reloading stats...`);
        try {
          const stats = await loadRealAdminData();
          onStatsUpdate(stats);
        } catch (error) {
          console.error(`❌ Error reloading stats after ${collectionName} update:`, error);
        }
      },
      (error: any) => {
        // Suppress Firestore internal assertion errors
        const errorMessage = error?.message || String(error);
        if (errorMessage.includes('FIRESTORE') && 
            errorMessage.includes('INTERNAL ASSERTION FAILED') &&
            (errorMessage.includes('Unexpected state') || 
             errorMessage.includes('ID: ca9') || 
             errorMessage.includes('ID: b815'))) {
          // Silently suppress - these are internal SDK errors
          return;
        }
        console.error(`❌ Error in real-time listener for ${collectionName}:`, error);
      }
    );

    unsubscribeFunctions.push(unsubscribe);
  });

  // Return cleanup function
  return () => {
    unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    console.log('🔄 Real-time updates cleaned up');
  };
}
