// Team Access System with Email Invites and Invite Links
import { vcAuthManager } from './vc-auth';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  position: string;
  department: string;
  phone?: string;
  avatar?: string;
  timezone: string;
  joinedAt: Date;
  isActive: boolean;
  permissions: TeamPermissions;
}

export interface TeamPermissions {
  canInvite: boolean;
  canRemove: boolean;
  canRename: boolean;
  canManageFiles: boolean;
  canStartCalls: boolean;
  canCreateNotePoints: boolean;
  canModerate: boolean;
  canAccessFunding: boolean;
  canAccessCompliance: boolean;
}

export interface InviteLink {
  id: string;
  token: string;
  role: 'admin' | 'member' | 'viewer';
  roomScope?: string; // Optional room ID to auto-join
  usageLimit: number; // 1 or N
  usageCount: number;
  expiry: Date;
  domainRestrict?: string; // Optional domain restriction
  createdBy: string;
  createdAt: Date;
  isActive: boolean;
}

export interface EmailInvite {
  id: string;
  email: string;
  role: 'admin' | 'member' | 'viewer';
  roomScope?: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  sentAt: Date;
  expiresAt: Date;
  invitedBy: string;
  acceptedAt?: Date;
  token: string;
}

export interface ProfileGateData {
  fullName: string;
  avatar?: string; // Base64 or URL
  timezone: string;
  termsAccepted: boolean;
  privacyAccepted: boolean;
}

class TeamAccessManager {
  private inviteLinks: Map<string, InviteLink> = new Map();
  private emailInvites: Map<string, EmailInvite> = new Map();
  private teamMembers: Map<string, TeamMember[]> = new Map(); // orgId -> members

  // Create an invite link
  async createInviteLink(
    orgId: string,
    createdBy: string,
    options: {
      role: 'admin' | 'member' | 'viewer';
      roomScope?: string;
      usageLimit?: number;
      expiry?: Date;
      domainRestrict?: string;
    }
  ): Promise<{ success: boolean; inviteLink?: InviteLink; error?: string }> {
    try {
      const token = this.generateToken();
      const inviteLink: InviteLink = {
        id: `invite-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        token,
        role: options.role,
        roomScope: options.roomScope,
        usageLimit: options.usageLimit || 1,
        usageCount: 0,
        expiry: options.expiry || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days default
        domainRestrict: options.domainRestrict,
        createdBy,
        createdAt: new Date(),
        isActive: true
      };

      this.inviteLinks.set(inviteLink.id, inviteLink);

      return { success: true, inviteLink };
    } catch (error) {
      console.error('Error creating invite link:', error);
      return { success: false, error: error.message };
    }
  }

  // Send email invite
  async sendEmailInvite(
    orgId: string,
    email: string,
    invitedBy: string,
    options: {
      role: 'admin' | 'member' | 'viewer';
      roomScope?: string;
    }
  ): Promise<{ success: boolean; invite?: EmailInvite; error?: string }> {
    try {
      // Check if user already exists
      const existingInvite = Array.from(this.emailInvites.values())
        .find(invite => invite.email === email && invite.status === 'pending');

      if (existingInvite) {
        return { success: false, error: 'Invite already sent to this email' };
      }

      const token = this.generateToken();
      const invite: EmailInvite = {
        id: `email-invite-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        email,
        role: options.role,
        roomScope: options.roomScope,
        status: 'pending',
        sentAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        invitedBy,
        token
      };

      this.emailInvites.set(invite.id, invite);

      // Send email (in real implementation)
      await this.sendInviteEmail(invite);

      return { success: true, invite };
    } catch (error) {
      console.error('Error sending email invite:', error);
      return { success: false, error: error.message };
    }
  }

  // Consume invite link
  async consumeInviteLink(
    token: string,
    userEmail: string,
    profileData: ProfileGateData
  ): Promise<{ success: boolean; teamMember?: TeamMember; error?: string }> {
    try {
      // Find invite link
      const inviteLink = Array.from(this.inviteLinks.values())
        .find(invite => invite.token === token && invite.isActive);

      if (!inviteLink) {
        return { success: false, error: 'Invalid or expired invite link' };
      }

      // Check expiry
      if (new Date() > inviteLink.expiry) {
        return { success: false, error: 'Invite link has expired' };
      }

      // Check usage limit
      if (inviteLink.usageCount >= inviteLink.usageLimit) {
        return { success: false, error: 'Invite link usage limit reached' };
      }

      // Check domain restriction
      if (inviteLink.domainRestrict) {
        const emailDomain = userEmail.split('@')[1];
        if (emailDomain !== inviteLink.domainRestrict) {
          return { success: false, error: 'Email domain not allowed' };
        }
      }

      // Create team member
      const teamMember: TeamMember = {
        id: `member-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: profileData.fullName,
        email: userEmail,
        role: inviteLink.role,
        position: 'Team Member',
        department: 'General',
        avatar: profileData.avatar,
        timezone: profileData.timezone,
        joinedAt: new Date(),
        isActive: true,
        permissions: this.getDefaultPermissions(inviteLink.role)
      };

      // Update usage count
      inviteLink.usageCount++;

      // Add to team
      const orgId = this.getOrgIdFromInvite(inviteLink);
      const currentMembers = this.teamMembers.get(orgId) || [];
      currentMembers.push(teamMember);
      this.teamMembers.set(orgId, currentMembers);

      // Log the event
      await this.logTeamEvent('member_joined', {
        memberId: teamMember.id,
        inviteLinkId: inviteLink.id,
        role: teamMember.role
      });

      return { success: true, teamMember };
    } catch (error) {
      console.error('Error consuming invite link:', error);
      return { success: false, error: error.message };
    }
  }

  // Accept email invite
  async acceptEmailInvite(
    token: string,
    profileData: ProfileGateData
  ): Promise<{ success: boolean; teamMember?: TeamMember; error?: string }> {
    try {
      // Find email invite
      const invite = Array.from(this.emailInvites.values())
        .find(invite => invite.token === token && invite.status === 'pending');

      if (!invite) {
        return { success: false, error: 'Invalid or expired invite' };
      }

      // Check expiry
      if (new Date() > invite.expiresAt) {
        invite.status = 'expired';
        return { success: false, error: 'Invite has expired' };
      }

      // Create team member
      const teamMember: TeamMember = {
        id: `member-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: profileData.fullName,
        email: invite.email,
        role: invite.role,
        position: 'Team Member',
        department: 'General',
        avatar: profileData.avatar,
        timezone: profileData.timezone,
        joinedAt: new Date(),
        isActive: true,
        permissions: this.getDefaultPermissions(invite.role)
      };

      // Update invite status
      invite.status = 'accepted';
      invite.acceptedAt = new Date();

      // Add to team
      const orgId = this.getOrgIdFromEmailInvite(invite);
      const currentMembers = this.teamMembers.get(orgId) || [];
      currentMembers.push(teamMember);
      this.teamMembers.set(orgId, currentMembers);

      // Log the event
      await this.logTeamEvent('member_joined', {
        memberId: teamMember.id,
        emailInviteId: invite.id,
        role: teamMember.role
      });

      return { success: true, teamMember };
    } catch (error) {
      console.error('Error accepting email invite:', error);
      return { success: false, error: error.message };
    }
  }

  // Get team members for an organization
  getTeamMembers(orgId: string): TeamMember[] {
    return this.teamMembers.get(orgId) || [];
  }

  // Update team member
  async updateTeamMember(
    orgId: string,
    memberId: string,
    updates: Partial<TeamMember>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const members = this.teamMembers.get(orgId) || [];
      const memberIndex = members.findIndex(m => m.id === memberId);

      if (memberIndex === -1) {
        return { success: false, error: 'Member not found' };
      }

      members[memberIndex] = { ...members[memberIndex], ...updates };
      this.teamMembers.set(orgId, members);

      return { success: true };
    } catch (error) {
      console.error('Error updating team member:', error);
      return { success: false, error: error.message };
    }
  }

  // Remove team member
  async removeTeamMember(
    orgId: string,
    memberId: string,
    removedBy: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const members = this.teamMembers.get(orgId) || [];
      const member = members.find(m => m.id === memberId);

      if (!member) {
        return { success: false, error: 'Member not found' };
      }

      // Remove member
      const updatedMembers = members.filter(m => m.id !== memberId);
      this.teamMembers.set(orgId, updatedMembers);

      // Log the event
      await this.logTeamEvent('member_removed', {
        memberId,
        memberEmail: member.email,
        removedBy
      });

      return { success: true };
    } catch (error) {
      console.error('Error removing team member:', error);
      return { success: false, error: error.message };
    }
  }

  // Revoke invite link
  async revokeInviteLink(linkId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const inviteLink = this.inviteLinks.get(linkId);
      if (!inviteLink) {
        return { success: false, error: 'Invite link not found' };
      }

      inviteLink.isActive = false;
      return { success: true };
    } catch (error) {
      console.error('Error revoking invite link:', error);
      return { success: false, error: error.message };
    }
  }

  // Get invite link info
  getInviteLinkInfo(token: string): InviteLink | null {
    return Array.from(this.inviteLinks.values())
      .find(invite => invite.token === token && invite.isActive) || null;
  }

  // Private methods
  private generateToken(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  private getDefaultPermissions(role: string): TeamPermissions {
    const permissions: TeamPermissions = {
      canInvite: false,
      canRemove: false,
      canRename: false,
      canManageFiles: true,
      canStartCalls: true,
      canCreateNotePoints: true,
      canModerate: false,
      canAccessFunding: false,
      canAccessCompliance: false
    };

    switch (role) {
      case 'owner':
        Object.keys(permissions).forEach(key => {
          permissions[key as keyof TeamPermissions] = true;
        });
        break;
      case 'admin':
        permissions.canInvite = true;
        permissions.canRemove = true;
        permissions.canModerate = true;
        permissions.canAccessFunding = true;
        permissions.canAccessCompliance = true;
        break;
      case 'member':
        permissions.canCreateNotePoints = true;
        break;
      case 'viewer':
        // Default permissions (read-only)
        break;
    }

    return permissions;
  }

  private async sendInviteEmail(invite: EmailInvite): Promise<void> {
    // In a real implementation, this would send an actual email
    console.log('Sending invite email:', {
      to: invite.email,
      role: invite.role,
      token: invite.token,
      expiresAt: invite.expiresAt
    });
  }

  private getOrgIdFromInvite(inviteLink: InviteLink): string {
    // In a real implementation, this would be stored in the invite link
    return 'demo-org-123';
  }

  private getOrgIdFromEmailInvite(invite: EmailInvite): string {
    // In a real implementation, this would be stored in the email invite
    return 'demo-org-123';
  }

  private async logTeamEvent(event: string, data: any): Promise<void> {
    try {
      console.log('Team Event:', { event, data, timestamp: new Date() });
      // In a real implementation, this would save to Firebase
    } catch (error) {
      console.error('Error logging team event:', error);
    }
  }
}

// Export singleton instance
export const teamAccessManager = new TeamAccessManager();

