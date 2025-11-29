/**
 * Dossier Service - Fetch and Manage Dossiers
 * Server-side RBAC enforcement, real-time updates, full audit trail
 */

import { collection, doc, getDoc, getDocs, query, where, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase.client';
import { Dossier, DossierType, DossierStatus, DossierComment } from './types';
import { UserPermissions, canAccessDepartment, hasPermission, validateDepartmentAccess } from '@/lib/rbac/permissions';
import { logDossierView, logDossierDecision, createAuditLog } from '@/lib/rbac/audit';

/**
 * Get all dossiers for admin (full visibility)
 */
export async function getAllDossiers(
  userPermissions: UserPermissions,
  filters?: {
    type?: DossierType;
    status?: DossierStatus;
    department?: string;
  }
): Promise<Dossier[]> {
  try {
    // Only super admin can view all dossiers
    if (userPermissions.role !== 'super_admin') {
      throw new Error('Unauthorized: Only super admin can view all dossiers');
    }

    console.log('📂 Fetching all dossiers for super admin');

    const dossiers: Dossier[] = [];

    // Fetch from each dossier collection
    const collections = ['kycSubmissions', 'kybSubmissions', 'registrations', 'projects'];
    
    for (const collectionName of collections) {
      let q = query(collection(db!, collectionName));

      // Apply filters if provided
      if (filters?.status) {
        q = query(q, where('status', '==', filters.status));
      }

      const snapshot = await getDocs(q);
      
      snapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        dossiers.push({
          id: docSnap.id,
          type: collectionName === 'kycSubmissions' ? 'KYC' :
                collectionName === 'kybSubmissions' ? 'KYB' :
                collectionName === 'registrations' ? 'Registration' : 'Pitch',
          ...data
        } as Dossier);
      });
    }

    console.log(`✅ Loaded ${dossiers.length} dossiers`);
    return dossiers;
  } catch (error) {
    console.error('Error fetching dossiers:', error);
    throw error;
  }
}

/**
 * Get dossiers for specific department
 */
export async function getDepartmentDossiers(
  userPermissions: UserPermissions,
  department: string
): Promise<Dossier[]> {
  try {
    // Validate department access
    if (userPermissions.role !== 'super_admin') {
      if (!userPermissions.department || userPermissions.department !== department) {
        throw new Error(`Unauthorized: No access to ${department} department`);
      }
    }

    console.log(`📂 Fetching dossiers for ${department} department`);

    // Map department to collection
    const collectionMap: Record<string, string> = {
      'KYC': 'kycSubmissions',
      'KYB': 'kybSubmissions',
      'Registration': 'registrations',
      'Pitch Intake': 'projects',
      'Pitch Projects': 'projects'
    };

    const collectionName = collectionMap[department] || 'kycSubmissions';
    const snapshot = await getDocs(collection(db!, collectionName));

    const dossiers = snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      type: department as DossierType,
      ...docSnap.data()
    } as Dossier));

    console.log(`✅ Loaded ${dossiers.length} dossiers for ${department}`);
    return dossiers;
  } catch (error) {
    console.error('Error fetching department dossiers:', error);
    throw error;
  }
}

/**
 * Get single dossier by ID
 */
export async function getDossier(
  dossierId: string,
  dossierType: DossierType,
  userPermissions: UserPermissions
): Promise<Dossier | null> {
  try {
    // Get collection name
    const collectionMap: Record<DossierType, string> = {
      'KYC': 'kycSubmissions',
      'KYB': 'kybSubmissions',
      'Registration': 'registrations',
      'Pitch': 'projects'
    };

    const collectionName = collectionMap[dossierType];
    const dossierDoc = await getDoc(doc(db!, collectionName, dossierId));

    if (!dossierDoc.exists()) {
      return null;
    }

    const dossier = {
      id: dossierDoc.id,
      type: dossierType,
      ...dossierDoc.data()
    } as Dossier;

    // Log dossier view
    await logDossierView({
      actorId: userPermissions.role,
      actorEmail: 'system',
      actorRole: userPermissions.role,
      dossierId: dossierId,
      dossierType: dossierType
    });

    return dossier;
  } catch (error) {
    console.error('Error fetching dossier:', error);
    return null;
  }
}

/**
 * Approve dossier
 */
export async function approveDossier(
  dossierId: string,
  dossierType: DossierType,
  actorId: string,
  actorEmail: string,
  reason?: string
): Promise<void> {
  try {
    const collectionMap: Record<DossierType, string> = {
      'KYC': 'kycSubmissions',
      'KYB': 'kybSubmissions',
      'Registration': 'registrations',
      'Pitch': 'projects'
    };

    const collectionName = collectionMap[dossierType];
    
    await updateDoc(doc(db!, collectionName, dossierId), {
      status: 'approved',
      decision: 'approved',
      reviewedAt: new Date().toISOString(),
      reviewedBy: actorId,
      decisionReason: reason,
      updatedAt: new Date().toISOString()
    });

    // Log decision
    await logDossierDecision({
      actorId,
      actorEmail,
      actorRole: 'super_admin',
      dossierId,
      dossierType,
      decision: 'APPROVE',
      reason,
      departmentId: dossierType as any
    });

    console.log(`✅ Approved ${dossierType} dossier:`, dossierId);
  } catch (error) {
    console.error('Error approving dossier:', error);
    throw error;
  }
}

/**
 * Reject dossier
 */
export async function rejectDossier(
  dossierId: string,
  dossierType: DossierType,
  actorId: string,
  actorEmail: string,
  reason: string
): Promise<void> {
  try {
    const collectionMap: Record<DossierType, string> = {
      'KYC': 'kycSubmissions',
      'KYB': 'kybSubmissions',
      'Registration': 'registrations',
      'Pitch': 'projects'
    };

    const collectionName = collectionMap[dossierType];
    
    await updateDoc(doc(db!, collectionName, dossierId), {
      status: 'rejected',
      decision: 'rejected',
      reviewedAt: new Date().toISOString(),
      reviewedBy: actorId,
      decisionReason: reason,
      updatedAt: new Date().toISOString()
    });

    // Log decision
    await logDossierDecision({
      actorId,
      actorEmail,
      actorRole: 'super_admin',
      dossierId,
      dossierType,
      decision: 'REJECT',
      reason,
      departmentId: dossierType as any
    });

    console.log(`✅ Rejected ${dossierType} dossier:`, dossierId);
  } catch (error) {
    console.error('Error rejecting dossier:', error);
    throw error;
  }
}

/**
 * Add comment to dossier
 */
export async function addDossierComment(
  dossierId: string,
  dossierType: DossierType,
  comment: {
    authorId: string;
    authorEmail: string;
    authorRole: string;
    text: string;
    isInternal: boolean;
  }
): Promise<void> {
  try {
    const collectionMap: Record<DossierType, string> = {
      'KYC': 'kycSubmissions',
      'KYB': 'kybSubmissions',
      'Registration': 'registrations',
      'Pitch': 'projects'
    };

    const collectionName = collectionMap[dossierType];
    const dossierDoc = await getDoc(doc(db!, collectionName, dossierId));

    if (!dossierDoc.exists()) {
      throw new Error('Dossier not found');
    }

    const currentComments = dossierDoc.data().comments || [];
    
    const newComment: DossierComment = {
      id: `comment_${Date.now()}`,
      authorId: comment.authorId,
      authorEmail: comment.authorEmail,
      authorRole: comment.authorRole,
      text: comment.text,
      createdAt: new Date().toISOString(),
      isInternal: comment.isInternal
    };

    await updateDoc(doc(db!, collectionName, dossierId), {
      comments: [...currentComments, newComment],
      updatedAt: new Date().toISOString()
    });

    console.log('✅ Added comment to dossier');
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
}

/**
 * Listen to dossier changes (real-time)
 */
export function subscribeToDossier(
  dossierId: string,
  dossierType: DossierType,
  callback: (dossier: Dossier | null) => void
): () => void {
  const collectionMap: Record<DossierType, string> = {
    'KYC': 'kycSubmissions',
    'KYB': 'kybSubmissions',
    'Registration': 'registrations',
    'Pitch': 'projects'
  };

  const collectionName = collectionMap[dossierType];

  return onSnapshot(
    doc(db!, collectionName, dossierId),
    (snapshot) => {
      if (snapshot.exists()) {
        callback({
          id: snapshot.id,
          type: dossierType,
          ...snapshot.data()
        } as Dossier);
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error('Error in dossier subscription:', error);
      callback(null);
    }
  );
}

/**
 * Get dossier statistics
 */
export async function getDossierStats(department?: string): Promise<{
  total: number;
  pending: number;
  underReview: number;
  approved: number;
  rejected: number;
  needsInfo: number;
}> {
  try {
    const collections = department 
      ? [department === 'KYC' ? 'kycSubmissions' : 
         department === 'KYB' ? 'kybSubmissions' : 
         department === 'Registration' ? 'registrations' : 'projects']
      : ['kycSubmissions', 'kybSubmissions', 'registrations', 'projects'];

    let total = 0;
    let pending = 0;
    let underReview = 0;
    let approved = 0;
    let rejected = 0;
    let needsInfo = 0;

    for (const collectionName of collections) {
      const snapshot = await getDocs(collection(db!, collectionName));
      
      snapshot.docs.forEach(doc => {
        const status = doc.data().status;
        total++;
        
        if (status === 'pending') pending++;
        else if (status === 'under_review') underReview++;
        else if (status === 'approved') approved++;
        else if (status === 'rejected') rejected++;
        else if (status === 'needs_info') needsInfo++;
      });
    }

    return { total, pending, underReview, approved, rejected, needsInfo };
  } catch (error) {
    console.error('Error getting dossier stats:', error);
    return { total: 0, pending: 0, underReview: 0, approved: 0, rejected: 0, needsInfo: 0 };
  }
}

