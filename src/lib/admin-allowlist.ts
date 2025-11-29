// src/lib/admin-allowlist.ts
// Email Allowlist Management for Department Access

import { db } from './firebase.client';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { DepartmentId, DepartmentRole, getPermissionsForRole } from './admin-rbac';

function ensureDb() {
  if (!db) {
    throw new Error('Firestore not initialized');
  }
  return db;
}

export interface AddMemberParams {
  email: string;
  departmentId: DepartmentId;
  role: DepartmentRole;
  addedBy: string;
}

export interface RemoveMemberParams {
  memberId: string;
  removedBy: string;
  reason?: string;
}

// Add member to department allowlist
export async function addMemberToAllowlist(params: AddMemberParams): Promise<{ success: boolean; memberId?: string; error?: string }> {
  try {
    const { email, departmentId, role, addedBy } = params;
    const database = ensureDb();
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, error: 'Invalid email format' };
    }
    
    // Check if member already exists
    const membersRef = collection(database, 'department_members');
    const existingQuery = query(
      membersRef,
      where('email', '==', email.toLowerCase()),
      where('departmentId', '==', departmentId),
      where('status', '==', 'active')
    );
    
    const existingSnapshot = await getDocs(existingQuery);
    
    if (!existingSnapshot.empty) {
      return {
        success: false,
        error: `${email} is already a member of ${departmentId} department`,
      };
    }
    
    // Add to allowlist
    const memberData = {
      email: email.toLowerCase(),
      departmentId,
      role,
      status: 'active',
      permissions: getPermissionsForRole(role),
      addedBy,
      addedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(membersRef, memberData);
    
    // Log to audit
    await logAllowlistAction({
      actorEmail: addedBy,
      action: 'ADD_MEMBER',
      departmentId,
      targetEmail: email,
      metadata: { role, memberId: docRef.id },
    });
    
    console.log(`✅ Added ${email} to ${departmentId} as ${role}`);
    
    return {
      success: true,
      memberId: docRef.id,
    };
  } catch (error) {
    console.error('Error adding member to allowlist:', error);
    return {
      success: false,
      error: (error as Error).message || 'Failed to add member',
    };
  }
}

// Remove member from allowlist
export async function removeMemberFromAllowlist(params: RemoveMemberParams): Promise<{ success: boolean; error?: string }> {
  try {
    const { memberId, removedBy, reason } = params;
    const database = ensureDb();
    
    const memberRef = doc(database, 'department_members', memberId);
    
    // Update status to 'removed' (soft delete for audit trail)
    await updateDoc(memberRef, {
      status: 'removed',
      removedBy,
      removedAt: serverTimestamp(),
      removalReason: reason || 'No reason provided',
      updatedAt: serverTimestamp(),
    });
    
    // Log to audit
    await logAllowlistAction({
      actorEmail: removedBy,
      action: 'REMOVE_MEMBER',
      departmentId: 'System', // Will be populated from member data
      targetId: memberId,
      metadata: { reason },
    });
    
    console.log(`✅ Removed member ${memberId} from allowlist`);
    
    return { success: true };
  } catch (error) {
    console.error('Error removing member from allowlist:', error);
    return {
      success: false,
      error: (error as Error).message || 'Failed to remove member',
    };
  }
}

// Suspend member temporarily
export async function suspendMember(memberId: string, suspendedBy: string, reason: string): Promise<{ success: boolean; error?: string }> {
  try {
    const database = ensureDb();
    const memberRef = doc(database, 'department_members', memberId);
    
    await updateDoc(memberRef, {
      status: 'suspended',
      suspendedBy,
      suspendedAt: serverTimestamp(),
      suspensionReason: reason,
      updatedAt: serverTimestamp(),
    });
    
    await logAllowlistAction({
      actorEmail: suspendedBy,
      action: 'SUSPEND_MEMBER',
      departmentId: 'System',
      targetId: memberId,
      metadata: { reason },
    });
    
    console.log(`✅ Suspended member ${memberId}`);
    
    return { success: true };
  } catch (error) {
    console.error('Error suspending member:', error);
    return {
      success: false,
      error: (error as Error).message || 'Failed to suspend member',
    };
  }
}

// Reactivate suspended member
export async function reactivateMember(memberId: string, reactivatedBy: string): Promise<{ success: boolean; error?: string }> {
  try {
    const database = ensureDb();
    const memberRef = doc(database, 'department_members', memberId);
    
    await updateDoc(memberRef, {
      status: 'active',
      reactivatedBy,
      reactivatedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    await logAllowlistAction({
      actorEmail: reactivatedBy,
      action: 'REACTIVATE_MEMBER',
      departmentId: 'System',
      targetId: memberId,
      metadata: {},
    });
    
    console.log(`✅ Reactivated member ${memberId}`);
    
    return { success: true };
  } catch (error) {
    console.error('Error reactivating member:', error);
    return {
      success: false,
      error: (error as Error).message || 'Failed to reactivate member',
    };
  }
}

// Update member role
export async function updateMemberRole(
  memberId: string,
  newRole: DepartmentRole,
  updatedBy: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const database = ensureDb();
    const memberRef = doc(database, 'department_members', memberId);
    
    await updateDoc(memberRef, {
      role: newRole,
      permissions: getPermissionsForRole(newRole),
      updatedBy,
      updatedAt: serverTimestamp(),
    });
    
    await logAllowlistAction({
      actorEmail: updatedBy,
      action: 'UPDATE_ROLE',
      departmentId: 'System',
      targetId: memberId,
      metadata: { newRole },
    });
    
    console.log(`✅ Updated member ${memberId} role to ${newRole}`);
    
    return { success: true };
  } catch (error) {
    console.error('Error updating member role:', error);
    return {
      success: false,
      error: (error as Error).message || 'Failed to update role',
    };
  }
}

// Get all members of a department
export async function getDepartmentMembers(departmentId: DepartmentId): Promise<any[]> {
  try {
    const database = ensureDb();
    const membersRef = collection(database, 'department_members');
    const q = query(
      membersRef,
      where('departmentId', '==', departmentId),
      where('status', '==', 'active')
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      addedAt: doc.data().addedAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    }));
  } catch (error) {
    console.error('Error getting department members:', error);
    return [];
  }
}

// Check if email is in any allowlist
export async function isInAllowlist(email: string): Promise<boolean> {
  try {
    const database = ensureDb();
    const membersRef = collection(database, 'department_members');
    const q = query(
      membersRef,
      where('email', '==', email.toLowerCase()),
      where('status', '==', 'active')
    );
    
    const snapshot = await getDocs(q);
    
    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking allowlist:', error);
    return false;
  }
}

// Log allowlist action to audit trail
async function logAllowlistAction(params: {
  actorEmail: string;
  action: string;
  departmentId: string;
  targetEmail?: string;
  targetId?: string;
  metadata: any;
}) {
  try {
    const database = ensureDb();
    const auditRef = collection(database, 'audit_logs');
    
    // Build audit log data, only including defined fields
    const auditData: any = {
      actorEmail: params.actorEmail,
      action: params.action,
      category: 'ALLOWLIST',
      departmentId: params.departmentId,
      targetType: 'department_member',
      metadata: params.metadata || {},
      timestamp: serverTimestamp(),
      success: true,
    };

    // Only add targetEmail if defined
    if (params.targetEmail) {
      auditData.targetEmail = params.targetEmail;
    }

    // Only add targetId if defined
    if (params.targetId) {
      auditData.targetId = params.targetId;
    }
    
    await addDoc(auditRef, auditData);
    console.log('✅ Audit log created successfully');
  } catch (error) {
    console.error('❌ Error logging allowlist action:', error);
    // Don't throw - audit logging failure shouldn't break the main operation
  }
}

// Export allowlist functions
export const allowlist = {
  addMember: addMemberToAllowlist,
  removeMember: removeMemberFromAllowlist,
  suspendMember,
  reactivateMember,
  updateRole: updateMemberRole,
  getMembers: getDepartmentMembers,
  isInAllowlist,
};

