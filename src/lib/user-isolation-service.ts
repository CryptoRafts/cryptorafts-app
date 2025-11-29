/**
 * User Isolation Service
 * Enforces strict userID-scoped isolation across all features
 * Everything is private by default - owner and explicitly invited members only
 */

import { db } from './firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  addDoc,
  serverTimestamp,
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore';

export interface TeamMember {
  userId: string;
  email: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  invitedBy: string;
  invitedAt: Date;
  status: 'active' | 'pending' | 'suspended' | 'revoked';
  permissions: string[];
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  members: TeamMember[];
  createdAt: Date;
  updatedAt: Date;
  settings: {
    isPrivate: boolean;
    allowInvites: boolean;
    requireApproval: boolean;
  };
}

export interface AccessLog {
  id: string;
  userId: string;
  resourceType: string;
  resourceId: string;
  action: 'read' | 'write' | 'delete' | 'invite' | 'revoke';
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  reason?: string;
}

export interface ResourceAccess {
  resourceId: string;
  resourceType: string;
  ownerId: string;
  teamId?: string;
  members: string[];
  permissions: {
    [userId: string]: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

class UserIsolationService {
  /**
   * Check if user has access to a resource
   */
  async hasAccess(
    userId: string, 
    resourceType: string, 
    resourceId: string, 
    requiredPermission: string = 'read'
  ): Promise<boolean> {
    try {
      const accessDoc = await getDoc(doc(db!, 'resourceAccess', `${resourceType}_${resourceId}`));
      
      if (!accessDoc.exists()) {
        await this.logAccess(userId, resourceType, resourceId, requiredPermission, false, 'No access record');
        return false;
      }

      const access = accessDoc.data() as ResourceAccess;
      
      // Owner always has full access
      if (access.ownerId === userId) {
        await this.logAccess(userId, resourceType, resourceId, requiredPermission, true);
        return true;
      }

      // Check if user is in members list
      if (!access.members.includes(userId)) {
        await this.logAccess(userId, resourceType, resourceId, requiredPermission, false, 'Not a member');
        return false;
      }

      // Check specific permissions
      const userPermissions = access.permissions[userId] || [];
      if (!userPermissions.includes(requiredPermission) && !userPermissions.includes('*')) {
        await this.logAccess(userId, resourceType, resourceId, requiredPermission, false, 'Insufficient permissions');
        return false;
      }

      await this.logAccess(userId, resourceType, resourceId, requiredPermission, true);
      return true;
    } catch (error) {
      console.error('Error checking access:', error);
      await this.logAccess(userId, resourceType, resourceId, requiredPermission, false, 'System error');
      return false;
    }
  }

  /**
   * Create resource access record - private by default
   */
  async createResourceAccess(
    resourceType: string,
    resourceId: string,
    ownerId: string,
    teamId?: string,
    initialMembers: string[] = []
  ): Promise<void> {
    const accessRecord: ResourceAccess = {
      resourceId,
      resourceType,
      ownerId,
      teamId,
      members: [ownerId, ...initialMembers],
      permissions: {
        [ownerId]: ['*'] // Owner has all permissions
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Set default read permissions for initial members
    initialMembers.forEach(memberId => {
      accessRecord.permissions[memberId] = ['read'];
    });

    await setDoc(doc(db!, 'resourceAccess', `${resourceType}_${resourceId}`), accessRecord);
    await this.logAccess(ownerId, resourceType, resourceId, 'write', true, 'Resource created');
  }

  /**
   * Grant access to a resource (invite-only)
   */
  async grantAccess(
    resourceType: string,
    resourceId: string,
    granterId: string,
    targetUserId: string,
    permissions: string[]
  ): Promise<boolean> {
    // Check if granter has permission to invite
    const canGrant = await this.hasAccess(granterId, resourceType, resourceId, 'invite');
    if (!canGrant) {
      return false;
    }

    const accessRef = doc(db!, 'resourceAccess', `${resourceType}_${resourceId}`);
    const accessDoc = await getDoc(accessRef);
    
    if (!accessDoc.exists()) {
      return false;
    }

    const access = accessDoc.data() as ResourceAccess;
    
    // Add user to members if not already present
    if (!access.members.includes(targetUserId)) {
      access.members.push(targetUserId);
    }

    // Set permissions
    access.permissions[targetUserId] = permissions;
    access.updatedAt = new Date();

    await updateDoc(accessRef, {
      members: access.members,
      permissions: access.permissions,
      updatedAt: serverTimestamp()
    });

    await this.logAccess(granterId, resourceType, resourceId, 'invite', true, `Granted access to ${targetUserId}`);
    return true;
  }

  /**
   * Revoke access from a resource
   */
  async revokeAccess(
    resourceType: string,
    resourceId: string,
    revokerId: string,
    targetUserId: string
  ): Promise<boolean> {
    const canRevoke = await this.hasAccess(revokerId, resourceType, resourceId, 'revoke');
    if (!canRevoke) {
      return false;
    }

    const accessRef = doc(db!, 'resourceAccess', `${resourceType}_${resourceId}`);
    const accessDoc = await getDoc(accessRef);
    
    if (!accessDoc.exists()) {
      return false;
    }

    const access = accessDoc.data() as ResourceAccess;
    
    // Cannot revoke owner's access
    if (access.ownerId === targetUserId) {
      return false;
    }

    // Remove user from members and permissions
    const updatedMembers = access.members.filter(id => id !== targetUserId);
    const updatedPermissions = { ...access.permissions };
    delete updatedPermissions[targetUserId];

    await updateDoc(accessRef, {
      members: updatedMembers,
      permissions: updatedPermissions,
      updatedAt: serverTimestamp()
    });

    await this.logAccess(revokerId, resourceType, resourceId, 'revoke', true, `Revoked access from ${targetUserId}`);
    return true;
  }

  /**
   * Get all resources user has access to (scoped to userID)
   */
  async getUserResources(
    userId: string, 
    resourceType?: string
  ): Promise<ResourceAccess[]> {
    try {
      let q = query(
        collection(db!, 'resourceAccess'),
        where('members', 'array-contains', userId),
        orderBy('updatedAt', 'desc')
      );

      if (resourceType) {
        q = query(q, where('resourceType', '==', resourceType));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as ResourceAccess);
    } catch (error) {
      console.error('Error getting user resources:', error);
      return [];
    }
  }

  /**
   * Log all access attempts for audit trail
   */
  async logAccess(
    userId: string,
    resourceType: string,
    resourceId: string,
    action: string,
    success: boolean,
    reason?: string
  ): Promise<void> {
    try {
      const logEntry: Omit<AccessLog, 'id'> = {
        userId,
        resourceType,
        resourceId,
        action: action as any,
        timestamp: new Date(),
        success,
        reason
      };

      await addDoc(collection(db!, 'accessLogs'), logEntry);
    } catch (error) {
      console.error('Error logging access:', error);
    }
  }

  /**
   * Get access logs for audit trail
   */
  async getAccessLogs(
    resourceType: string,
    resourceId: string,
    limitCount: number = 100
  ): Promise<AccessLog[]> {
    try {
      const q = query(
        collection(db!, 'accessLogs'),
        where('resourceType', '==', resourceType),
        where('resourceId', '==', resourceId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AccessLog));
    } catch (error) {
      console.error('Error getting access logs:', error);
      return [];
    }
  }

  /**
   * Create a team (invite-only, private by default)
   */
  async createTeam(
    name: string,
    ownerId: string,
    ownerEmail: string,
    description?: string
  ): Promise<string> {
    const team: Omit<Team, 'id'> = {
      name,
      description,
      ownerId,
      members: [{
        userId: ownerId,
        email: ownerEmail,
        role: 'owner',
        invitedBy: ownerId,
        invitedAt: new Date(),
        status: 'active',
        permissions: ['*']
      }],
      createdAt: new Date(),
      updatedAt: new Date(),
      settings: {
        isPrivate: true,
        allowInvites: true,
        requireApproval: true
      }
    };

    const docRef = await addDoc(collection(db!, 'teams'), team);
    
    // Create resource access for the team itself
    await this.createResourceAccess('team', docRef.id, ownerId);
    
    return docRef.id;
  }

  /**
   * Invite user to team (invite-only)
   */
  async inviteToTeam(
    teamId: string,
    inviterId: string,
    targetUserId: string,
    targetEmail: string,
    role: 'admin' | 'member' | 'viewer' = 'member'
  ): Promise<boolean> {
    // Check if inviter has permission
    const canInvite = await this.hasAccess(inviterId, 'team', teamId, 'invite');
    if (!canInvite) {
      return false;
    }

    const teamDoc = await getDoc(doc(db!, 'teams', teamId));
    if (!teamDoc.exists()) {
      return false;
    }

    const team = teamDoc.data() as Team;
    
    // Check if user is already a member
    if (team.members.some(m => m.userId === targetUserId)) {
      return false;
    }

    // Add new member
    const newMember: TeamMember = {
      userId: targetUserId,
      email: targetEmail,
      role,
      invitedBy: inviterId,
      invitedAt: new Date(),
      status: 'pending',
      permissions: this.getRolePermissions(role)
    };

    const updatedMembers = [...team.members, newMember];
    
    await updateDoc(doc(db!, 'teams', teamId), {
      members: updatedMembers,
      updatedAt: serverTimestamp()
    });

    // Grant access to team resource
    await this.grantAccess('team', teamId, inviterId, targetUserId, newMember.permissions);

    return true;
  }

  /**
   * Get role-based permissions
   */
  private getRolePermissions(role: string): string[] {
    switch (role) {
      case 'owner':
        return ['*'];
      case 'admin':
        return ['read', 'write', 'invite', 'revoke'];
      case 'member':
        return ['read', 'write'];
      case 'viewer':
        return ['read'];
      default:
        return ['read'];
    }
  }

  /**
   * Get user's teams (only teams where user is a member)
   */
  async getUserTeams(userId: string): Promise<Team[]> {
    try {
      const resources = await this.getUserResources(userId, 'team');
      const teamIds = resources.map(r => r.resourceId);
      
      if (teamIds.length === 0) {
        return [];
      }

      const teams: Team[] = [];
      for (const teamId of teamIds) {
        const teamDoc = await getDoc(doc(db!, 'teams', teamId));
        if (teamDoc.exists()) {
          teams.push({ id: teamDoc.id, ...teamDoc.data() } as Team);
        }
      }

      return teams;
    } catch (error) {
      console.error('Error getting user teams:', error);
      return [];
    }
  }

  /**
   * Delete resource and its access record
   */
  async deleteResource(
    resourceType: string,
    resourceId: string,
    deleterId: string
  ): Promise<boolean> {
    const canDelete = await this.hasAccess(deleterId, resourceType, resourceId, 'delete');
    if (!canDelete) {
      return false;
    }

    await deleteDoc(doc(db!, 'resourceAccess', `${resourceType}_${resourceId}`));
    await this.logAccess(deleterId, resourceType, resourceId, 'delete', true);
    
    return true;
  }
}

export const userIsolationService = new UserIsolationService();

