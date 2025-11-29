'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { db } from '@/lib/firebase.client';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, getDoc } from 'firebase/firestore';
import RoleGate from "@/components/RoleGate";
import BlockchainCard from "@/components/ui/BlockchainCard";
import AnimatedButton from "@/components/ui/AnimatedButton";
import StandardLoading from "@/components/ui/StandardLoading";
import { 
  UserGroupIcon,
  PlusIcon,
  XMarkIcon,
  CheckIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  UserPlusIcon,
  Cog6ToothIcon,
  ClipboardDocumentIcon,
  TrashIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  avatar?: string;
  joinedAt: Date;
  isOnline: boolean;
  lastSeen?: Date;
  permissions: {
    canInvite: boolean;
    canRemove: boolean;
    canManageRoles: boolean;
    canViewAnalytics: boolean;
  };
}

interface InviteCode {
  id: string;
  code: string;
  email?: string;
  fullName?: string;
  role: 'admin' | 'member' | 'viewer';
  roomScope: 'room_admin' | 'editor' | 'reader';
  createdAt: Date;
  expiresAt: Date;
  status: 'pending' | 'used' | 'expired' | 'revoked';
  usedBy?: string;
  usedAt?: Date;
  createdBy: string;
}

export default function VCTeamSettings() {
  const { user, isLoading } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showInviteCodeModal, setShowInviteCodeModal] = useState(false);
  const [generatedInvite, setGeneratedInvite] = useState<InviteCode | null>(null);
  
  // Invite form state
  const [inviteForm, setInviteForm] = useState({
    fullName: '',
    email: '',
    role: 'member' as 'admin' | 'member' | 'viewer',
    roomScope: 'editor' as 'room_admin' | 'editor' | 'reader'
  });

  useEffect(() => {
    if (!user) return;

    console.log('👥 Loading real-time team data for:', user.email);

    // Get user's organization ID
    const loadOrgAndTeam = async () => {
      if (!db) return;
      const dbInstance = db; // Capture for type narrowing
      try {
        const userDoc = await getDoc(doc(dbInstance, 'users', user.uid));
        if (!userDoc.exists()) {
          console.log('❌ User document not found');
          setDataLoading(false);
          return;
        }

        const userData = userDoc.data();
        const orgId = userData.orgId || userData.organization_id || user.uid;
        
        console.log('🏢 Organization ID:', orgId);

        // Load current user as owner
        const currentUserMember: TeamMember = {
          id: user.uid,
          name: user.displayName || userData.contact_name || userData.organization_name || 'You',
          email: user.email || '',
          role: 'owner',
          joinedAt: new Date(userData.createdAt || Date.now()),
          isOnline: true,
          permissions: {
            canInvite: true,
            canRemove: true,
            canManageRoles: true,
            canViewAnalytics: true
          }
        };

        setTeamMembers([currentUserMember]);

        // Listen to team members in real-time
        const membersQuery = query(
          collection(dbInstance, 'users'),
          where('orgId', '==', orgId)
        );

        const unsubscribeMembers = onSnapshot(membersQuery, (snapshot) => {
          console.log('👥 Team members updated:', snapshot.docs.length);
          
          const members: TeamMember[] = snapshot.docs
            .filter(doc => doc.id !== user.uid) // Exclude current user (already added as owner)
            .map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                name: data.displayName || data.contact_name || data.organization_name || 'Team Member',
                email: data.email || '',
                role: data.teamRole || 'member',
                joinedAt: data.joinedAt ? new Date(data.joinedAt) : new Date(),
                isOnline: data.isOnline || false,
                lastSeen: data.lastSeen ? new Date(data.lastSeen) : undefined,
                permissions: {
                  canInvite: data.teamRole === 'admin',
                  canRemove: false,
                  canManageRoles: false,
                  canViewAnalytics: data.teamRole === 'admin' || data.teamRole === 'member'
                }
              };
            });

          setTeamMembers([currentUserMember, ...members]);
        });

        // Listen to invite codes in real-time
        const invitesQuery = query(
          collection(dbInstance, 'teamInvites'),
          where('createdBy', '==', user.uid)
        );

        const unsubscribeInvites = onSnapshot(invitesQuery, (snapshot) => {
          console.log('📧 Invites updated:', snapshot.docs.length);
          
          const invites: InviteCode[] = snapshot.docs.map(doc => {
            const data = doc.data();
            const expiresAt = data.expiresAt?.toDate() || new Date();
            const now = new Date();
            let status = data.status || 'pending';
            
            // Auto-expire if past expiration
            if (status === 'pending' && expiresAt < now) {
              status = 'expired';
            }

            return {
              id: doc.id,
              code: data.code,
              email: data.email,
              fullName: data.fullName,
              role: data.role || 'member',
              roomScope: data.roomScope || 'editor',
              createdAt: data.createdAt?.toDate() || new Date(),
              expiresAt: expiresAt,
              status: status,
              usedBy: data.usedBy,
              usedAt: data.usedAt?.toDate(),
              createdBy: data.createdBy
            };
          });

          setInviteCodes(invites);
        });

        setDataLoading(false);

        // Cleanup listeners
        return () => {
          unsubscribeMembers();
          unsubscribeInvites();
        };
      } catch (error) {
        console.error('❌ Error loading team data:', error);
        setDataLoading(false);
      }
    };

    loadOrgAndTeam();
  }, [user]);

  const generateInviteCode = () => {
    const code = `VC-TEAM-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

    return {
      id: `invite-${Date.now()}`,
      code,
      email: inviteForm.email,
      fullName: inviteForm.fullName,
      role: inviteForm.role,
      roomScope: inviteForm.roomScope,
      createdAt: now,
      expiresAt,
      status: 'pending' as const,
      createdBy: user?.uid || ''
    };
  };

  const createInvite = async () => {
    if (!inviteForm.fullName.trim() || !inviteForm.email.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    if (!db) return;

    // AI Duplicate Check
    const existingUser = teamMembers.find(member => 
      member.email.toLowerCase() === inviteForm.email.toLowerCase()
    );

    if (existingUser) {
      alert('Existing User Detected! This user already has an account. You can attach them to your organization directly.');
      return;
    }

    try {
      const newInvite = generateInviteCode();
      const dbInstance = db; // Capture for type narrowing
      
      console.log('📧 Creating invite in Firebase...');
      
      // Save to Firebase
      await addDoc(collection(dbInstance, 'teamInvites'), {
        code: newInvite.code,
        email: inviteForm.email,
        fullName: inviteForm.fullName,
        role: inviteForm.role,
        roomScope: inviteForm.roomScope,
        createdAt: new Date(),
        expiresAt: newInvite.expiresAt,
        status: 'pending',
        createdBy: user?.uid || '',
        orgId: user?.uid // Organization ID
      });

      console.log('✅ Invite created successfully:', newInvite.code);

      setGeneratedInvite(newInvite);
      setShowInviteModal(false);
      setShowInviteCodeModal(true);

      // Reset form
      setInviteForm({
        fullName: '',
        email: '',
        role: 'member',
        roomScope: 'editor'
      });
    } catch (error) {
      console.error('❌ Error creating invite:', error);
      alert('Failed to create invite. Please try again.');
    }
  };

  const revokeInvite = async (inviteId: string) => {
    if (!db) return;
    try {
      console.log('🚫 Revoking invite:', inviteId);
      await updateDoc(doc(db!, 'teamInvites', inviteId), {
        status: 'revoked',
        revokedAt: new Date()
      });
      console.log('✅ Invite revoked successfully');
    } catch (error) {
      console.error('❌ Error revoking invite:', error);
      alert('Failed to revoke invite');
    }
  };

  const regenerateInvite = async (inviteId: string) => {
    if (!db) return;
    try {
      const newCode = generateInviteCode();
      console.log('🔄 Regenerating invite:', inviteId);
      
      await updateDoc(doc(db!, 'teamInvites', inviteId), {
        code: newCode.code,
        status: 'pending',
        createdAt: newCode.createdAt,
        expiresAt: newCode.expiresAt,
        regeneratedAt: new Date()
      });
      
      console.log('✅ Invite regenerated:', newCode.code);
    } catch (error) {
      console.error('❌ Error regenerating invite:', error);
      alert('Failed to regenerate invite');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-yellow-500/20 text-yellow-400';
      case 'admin': return 'bg-orange-500/20 text-orange-400';
      case 'member': return 'bg-blue-500/20 text-blue-400';
      case 'viewer': return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-green-500/20 text-green-400';
      case 'used': return 'bg-blue-500/20 text-blue-400';
      case 'expired': return 'bg-red-500/20 text-red-400';
      case 'revoked': return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const formatTimeRemaining = (expiresAt: Date) => {
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  if (isLoading || dataLoading) {
    return <StandardLoading title="Loading Team Settings" message="Loading your team settings..." />;
  }

  return (
    <RoleGate requiredRole="vc">
      <div className="min-h-screen relative neo-blue-background">
        <div className="container-perfect relative z-10">
          {/* Header */}
          <div className="neo-glass-card rounded-2xl p-6 md:p-8 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">Team Settings</h1>
                <p className="text-white/60 text-lg">Manage your VC team members and invitations</p>
              </div>
              <AnimatedButton
                variant="primary"
                size="md"
                icon={<UserPlusIcon className="w-5 h-5" />}
                onClick={() => setShowInviteModal(true)}
              >
                Invite Member
              </AnimatedButton>
            </div>
          </div>

          {/* Team Members */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <BlockchainCard variant="default" size="lg">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-2">Team Members</h3>
                <p className="text-white/60 text-sm">{teamMembers.length} members</p>
              </div>
              
              <div className="space-y-4">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-white">
                            {member.name.charAt(0)}
                          </span>
                        </div>
                        {member.isOnline && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-black"></div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="text-white font-medium">{member.name}</p>
                          {member.id === user?.uid && (
                            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">You</span>
                          )}
                        </div>
                        <p className="text-white/60 text-sm">{member.email}</p>
                        {member.lastSeen && !member.isOnline && (
                          <p className="text-white/40 text-xs">
                            Last seen {member.lastSeen.toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${getRoleColor(member.role)}`}>
                      {member.role}
                    </span>
                  </div>
                ))}
              </div>
            </BlockchainCard>

            {/* Invite Codes */}
            <BlockchainCard variant="default" size="lg">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-2">Invite Codes</h3>
                <p className="text-white/60 text-sm">{inviteCodes.length} total invites</p>
              </div>
              
              <div className="space-y-4">
                {inviteCodes.map((invite) => (
                  <div key={invite.id} className="p-4 bg-white/5 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <code className="text-white font-mono text-sm bg-black/40 px-2 py-1 rounded">
                          {invite.code}
                        </code>
                        <span className={`text-xs px-2 py-1 rounded ${getStatusColor(invite.status)}`}>
                          {invite.status}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        {invite.status === 'pending' && (
                          <>
                            <button
                              onClick={() => copyToClipboard(invite.code)}
                              className="p-1 hover:bg-white/10 rounded transition-colors"
                              title="Copy Code"
                            >
                              <ClipboardDocumentIcon className="w-4 h-4 text-white/60" />
                            </button>
                            <button
                              onClick={() => revokeInvite(invite.id)}
                              className="p-1 hover:bg-red-500/20 rounded transition-colors"
                              title="Revoke"
                            >
                              <TrashIcon className="w-4 h-4 text-red-400" />
                            </button>
                            <button
                              onClick={() => regenerateInvite(invite.id)}
                              className="p-1 hover:bg-blue-500/20 rounded transition-colors"
                              title="Regenerate"
                            >
                              <ArrowPathIcon className="w-4 h-4 text-blue-400" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      {invite.email && (
                        <div className="flex justify-between">
                          <span className="text-white/60">Email:</span>
                          <span className="text-white">{invite.email}</span>
                        </div>
                      )}
                      {invite.fullName && (
                        <div className="flex justify-between">
                          <span className="text-white/60">Name:</span>
                          <span className="text-white">{invite.fullName}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-white/60">Role:</span>
                        <span className="text-white capitalize">{invite.role}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/60">Room Scope:</span>
                        <span className="text-white capitalize">{invite.roomScope.replace('_', ' ')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/60">Expires:</span>
                        <span className={`${invite.status === 'expired' ? 'text-red-400' : 'text-white'}`}>
                          {formatTimeRemaining(invite.expiresAt)}
                        </span>
                      </div>
                      {invite.usedAt && (
                        <div className="flex justify-between">
                          <span className="text-white/60">Used:</span>
                          <span className="text-white">{invite.usedAt.toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {inviteCodes.length === 0 && (
                  <div className="text-center py-8">
                    <UserGroupIcon className="w-12 h-12 text-white/40 mx-auto mb-4" />
                    <p className="text-white/60">No invite codes yet</p>
                    <p className="text-white/40 text-sm">Create your first invite to get started</p>
                  </div>
                )}
              </div>
            </BlockchainCard>
          </div>

          {/* Invite Member Modal */}
          {showInviteModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-black/80 backdrop-blur-lg border border-white/20 rounded-xl p-6 max-w-md w-full">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">Invite Team Member</h3>
                  <button
                    onClick={() => setShowInviteModal(false)}
                    className="text-white/60 hover:text-white"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={inviteForm.fullName}
                      onChange={(e) => setInviteForm(prev => ({ ...prev, fullName: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
                      placeholder="Enter full name"
                    />
                  </div>

                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
                      placeholder="Enter email address"
                    />
                  </div>

                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">
                      Organization Role
                    </label>
                    <select
                      value={inviteForm.role}
                      onChange={(e) => setInviteForm(prev => ({ ...prev, role: e.target.value as any }))}
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">
                      Default Room Scope
                    </label>
                    <select
                      value={inviteForm.roomScope}
                      onChange={(e) => setInviteForm(prev => ({ ...prev, roomScope: e.target.value as any }))}
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="editor">Editor</option>
                      <option value="room_admin">Room Admin</option>
                      <option value="reader">Reader</option>
                    </select>
                  </div>
                </div>

                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={() => setShowInviteModal(false)}
                    className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createInvite}
                    className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Create Invite
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Invite Code Generated Modal */}
          {showInviteCodeModal && generatedInvite && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-black/80 backdrop-blur-lg border border-white/20 rounded-xl p-6 max-w-lg w-full">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckIcon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Invite Created!</h3>
                  <p className="text-white/60">Share this code with your team member</p>
                </div>

                <div className="bg-white/5 rounded-lg p-4 mb-6">
                  <div className="space-y-3">
                    <div>
                      <p className="text-white/60 text-sm">Invite Code</p>
                      <div className="flex items-center space-x-2">
                        <code className="flex-1 bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-white font-mono text-lg font-bold">
                          {generatedInvite.code}
                        </code>
                        <button
                          onClick={() => copyToClipboard(generatedInvite.code)}
                          className="px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
                          title="Copy to clipboard"
                        >
                          <ClipboardDocumentIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <p className="text-white/60 text-sm">Invite Link</p>
                      <div className="flex items-center space-x-2">
                        <code className="flex-1 bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-white font-mono text-sm">
                          {typeof window !== 'undefined' ? `${window.location.origin}/signup-with-invitation?code=${generatedInvite.code}` : ''}
                        </code>
                        <button
                          onClick={() => copyToClipboard(typeof window !== 'undefined' ? `${window.location.origin}/signup-with-invitation?code=${generatedInvite.code}` : '')}
                          className="px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
                          title="Copy to clipboard"
                        >
                          <ClipboardDocumentIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-6">
                  <div className="flex items-start space-x-2">
                    <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400 mt-0.5" />
                    <div>
                      <p className="text-yellow-400 font-medium text-sm">Important</p>
                      <p className="text-yellow-300/80 text-sm mt-1">
                        This code can only be used once. After it's used, create a new invite for additional members.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowInviteCodeModal(false);
                      setGeneratedInvite(null);
                    }}
                    className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </RoleGate>
  );
}
