'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { ensureDb, waitForFirebase } from '@/lib/firebase-utils';
import { collection, query, where, onSnapshot, doc, getDoc, getDocs } from 'firebase/firestore';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorBoundary from '@/components/ErrorBoundary';
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';

interface TeamMember {
  id: string;
  email: string;
  fullName?: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  status: 'invited' | 'active' | 'inactive';
  invitedBy?: string;
  invitedByEmail?: string;
  invitedAt?: any;
  joinedAt?: any;
  userId?: string;
  orgId?: string;
}

export default function VCTeam() {
  const { user, isLoading } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<'owner' | 'admin' | 'member' | 'viewer'>('member');
  
  const [inviteForm, setInviteForm] = useState({
    email: '',
    fullName: '',
    role: 'member' as 'admin' | 'member' | 'viewer'
  });

  const [editForm, setEditForm] = useState({
    role: 'member' as 'admin' | 'member' | 'viewer'
  });

  useEffect(() => {
    if (!user) return;

    const loadTeam = async () => {
      try {
        setLoading(true);
        const isReady = await waitForFirebase(5000);
        if (!isReady) {
          console.error('❌ Firebase not initialized');
          setLoading(false);
          return;
        }

        const dbInstance = ensureDb();
        if (!dbInstance) {
          console.error('❌ Database not available');
          setLoading(false);
          return;
        }

        // Get user's organization ID and role
        const userDoc = await getDoc(doc(dbInstance, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const userOrgId = userData.orgId || userData.organization_id || user.uid;
          setOrgId(userOrgId);
          
          // Get current user's role in team
          const userMemberQuery = query(
            collection(dbInstance, 'vc_team_members'),
            where('orgId', '==', userOrgId),
            where('userId', '==', user.uid)
          );
          const userMemberSnapshot = await getDocs(userMemberQuery);
          if (!userMemberSnapshot.empty) {
            const userMemberData = userMemberSnapshot.docs[0].data();
            setCurrentUserRole(userMemberData.role || 'member');
          } else if (user.uid === userOrgId) {
            setCurrentUserRole('owner');
          }

          // Set up real-time listener for team members
          const membersQuery = query(
            collection(dbInstance, 'vc_team_members'),
            where('orgId', '==', userOrgId)
          );

          const unsubscribe = onSnapshot(membersQuery, (snapshot) => {
            const members = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as TeamMember[];

            // Sort: active first, then by role (owner > admin > member > viewer), then by invitedAt
            members.sort((a, b) => {
              if (a.status === 'active' && b.status !== 'active') return -1;
              if (a.status !== 'active' && b.status === 'active') return 1;
              
              const roleOrder = { owner: 0, admin: 1, member: 2, viewer: 3 };
              const roleDiff = (roleOrder[a.role] || 3) - (roleOrder[b.role] || 3);
              if (roleDiff !== 0) return roleDiff;
              
              const aTime = a.invitedAt?.toMillis?.() || a.invitedAt?.seconds || 0;
              const bTime = b.invitedAt?.toMillis?.() || b.invitedAt?.seconds || 0;
              return bTime - aTime;
            });

            console.log('✅ Real-time team members update:', members.length);
            setTeamMembers(members);
            setLoading(false);
          }, (error) => {
            console.error('❌ Error listening to team members:', error);
            setLoading(false);
          });

          return () => unsubscribe();
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('❌ Error loading team:', error);
        setLoading(false);
      }
    };

    const cleanup = loadTeam();
    return () => {
      cleanup.then(unsub => unsub && unsub());
    };
  }, [user]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !inviteForm.email) return;

    setInviteLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/vc/team/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: inviteForm.email,
          fullName: inviteForm.fullName,
          role: inviteForm.role
        })
      });

      const result = await response.json();

      if (result.error) {
        alert(`Error: ${result.error}`);
      } else {
        alert(`✅ Invitation sent to ${inviteForm.email}. They can now log in with Google to join your team.`);
        setInviteForm({ email: '', fullName: '', role: 'member' });
        setShowInviteModal(false);
      }
    } catch (error) {
      console.error('Error inviting member:', error);
      alert('Failed to send invitation. Please try again.');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleEditRole = (member: TeamMember) => {
    setSelectedMember(member);
    setEditForm({ role: member.role });
    setShowEditModal(true);
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedMember) return;

    setUpdateLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/vc/team/update-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          memberId: selectedMember.id,
          role: editForm.role
        })
      });

      const result = await response.json();

      if (result.error) {
        alert(`Error: ${result.error}`);
      } else {
        alert(`✅ Role updated to ${editForm.role}`);
        setShowEditModal(false);
        setSelectedMember(null);
      }
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Failed to update role. Please try again.');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleRemove = async (memberId: string, memberEmail: string) => {
    if (!confirm(`Are you sure you want to remove ${memberEmail} from the team?`)) return;
    if (!user) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/vc/team/remove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ memberId })
      });

      const result = await response.json();

      if (result.error) {
        alert(`Error: ${result.error}`);
      } else {
        alert(`✅ ${memberEmail} removed from team`);
      }
    } catch (error) {
      console.error('Error removing member:', error);
      alert('Failed to remove member. Please try again.');
    }
  };

  if (isLoading || loading) {
    return <LoadingSpinner />;
  }

  const stats = {
    total: teamMembers.length,
    active: teamMembers.filter(m => m.status === 'active').length,
    invited: teamMembers.filter(m => m.status === 'invited').length,
    admins: teamMembers.filter(m => m.role === 'admin' || m.role === 'owner').length
  };

  const canManage = currentUserRole === 'owner' || currentUserRole === 'admin';

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-black pt-24 pb-12 px-4">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Link */}
          <div className="mb-4">
            <Link href="/vc/dashboard" className="inline-flex items-center text-cyan-400 hover:text-cyan-300 transition-colors">
              <NeonCyanIcon type="arrow-left" size={20} className="text-current mr-2" />
              Back to Dashboard
            </Link>
          </div>

          {/* Header */}
          <div className="neo-glass-card rounded-2xl p-8 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Team Management</h1>
                <p className="text-white/90 text-lg">
                  Manage your VC team members and their access permissions. Team members can log in with Google using their invited email to automatically join your organization.
                </p>
              </div>
              <div className="hidden lg:block">
                <div className="w-20 h-20 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-2xl flex items-center justify-center shadow-lg border border-cyan-400/30">
                  <NeonCyanIcon type="team" size={40} className="text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="neo-glass-card rounded-xl p-6 hover:border-cyan-400/50 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-400/70 text-sm">Total Members</p>
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-lg flex items-center justify-center border border-cyan-400/30">
                  <NeonCyanIcon type="users" size={24} className="text-white" />
                </div>
              </div>
            </div>

            <div className="neo-glass-card rounded-xl p-6 hover:border-cyan-400/50 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-400/70 text-sm">Active Members</p>
                  <p className="text-2xl font-bold text-white">{stats.active}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-green-500/30 to-emerald-500/30 rounded-lg flex items-center justify-center border border-green-400/30">
                  <NeonCyanIcon type="check" size={24} className="text-white" />
                </div>
              </div>
            </div>

            <div className="neo-glass-card rounded-xl p-6 hover:border-cyan-400/50 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-400/70 text-sm">Pending Invites</p>
                  <p className="text-2xl font-bold text-white">{stats.invited}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500/30 to-orange-500/30 rounded-lg flex items-center justify-center border border-yellow-400/30">
                  <NeonCyanIcon type="clock" size={24} className="text-white" />
                </div>
              </div>
            </div>

            <div className="neo-glass-card rounded-xl p-6 hover:border-cyan-400/50 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-400/70 text-sm">Admins</p>
                  <p className="text-2xl font-bold text-white">{stats.admins}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-lg flex items-center justify-center border border-purple-400/30">
                  <NeonCyanIcon type="shield" size={24} className="text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Add Member Button */}
          {canManage && (
            <div className="mb-6 flex justify-end">
              <button
                onClick={() => setShowInviteModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all border-2 border-cyan-400/50 shadow-lg shadow-cyan-500/20 flex items-center gap-2"
              >
                <NeonCyanIcon type="user-plus" size={20} className="text-white" />
                Add Team Member
              </button>
            </div>
          )}

          {/* Team Members List */}
          <div className="neo-glass-card rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Team Members</h2>
            
            {teamMembers.length === 0 ? (
              <div className="text-center py-12">
                <NeonCyanIcon type="users" size={64} className="text-cyan-400/50 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No Team Members Yet</h3>
                <p className="text-cyan-400/70 mb-6">Start by inviting team members to join your VC organization</p>
                {canManage && (
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all border-2 border-cyan-400/50 shadow-lg shadow-cyan-500/20"
                  >
                    Invite First Member
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {teamMembers.map((member) => {
                  const isCurrentUser = member.userId === user?.uid;
                  const canEdit = canManage && !isCurrentUser && member.role !== 'owner';
                  
                  return (
                    <div
                      key={member.id}
                      className="neo-glass-card rounded-xl p-6 hover:border-cyan-400/50 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          {/* Avatar */}
                          <div className="w-14 h-14 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-xl flex items-center justify-center border border-cyan-400/30">
                            <span className="text-white font-bold text-xl">
                              {(member.fullName || member.email || 'U').charAt(0).toUpperCase()}
                            </span>
                          </div>

                          {/* Member Info */}
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-bold text-white">
                                {member.fullName || member.email.split('@')[0]}
                                {isCurrentUser && (
                                  <span className="ml-2 text-cyan-400 text-sm">(You)</span>
                                )}
                              </h3>
                              <span className={`px-2 py-1 rounded text-xs font-medium border ${
                                member.status === 'active' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-400/30' :
                                member.status === 'invited' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-400/30' :
                                'bg-gray-500/20 text-gray-400 border-gray-400/30'
                              }`}>
                                {member.status}
                              </span>
                              <span className={`px-2 py-1 rounded text-xs font-medium border ${
                                member.role === 'owner' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-400/30' :
                                member.role === 'admin' ? 'bg-purple-500/20 text-purple-400 border-purple-400/30' :
                                member.role === 'member' ? 'bg-blue-500/20 text-blue-400 border-blue-400/30' :
                                'bg-gray-500/20 text-gray-400 border-gray-400/30'
                              }`}>
                                {member.role}
                              </span>
                            </div>
                            <p className="text-cyan-400/70 text-sm mb-1">{member.email}</p>
                            <div className="flex items-center gap-4 text-xs text-white/50">
                              {member.invitedAt && (
                                <span>
                                  Invited {member.invitedAt?.toDate?.()?.toLocaleDateString() || 
                                           new Date(member.invitedAt?.seconds * 1000).toLocaleDateString() || 
                                           'Unknown date'}
                                </span>
                              )}
                              {member.joinedAt && member.status === 'active' && (
                                <span>
                                  Joined {member.joinedAt?.toDate?.()?.toLocaleDateString() || 
                                          new Date(member.joinedAt?.seconds * 1000).toLocaleDateString() || 
                                          'Unknown date'}
                                </span>
                              )}
                              {member.status === 'invited' && (
                                <span className="text-yellow-400 flex items-center gap-1">
                                  <NeonCyanIcon type="info" size={14} className="text-current" />
                                  Waiting for Google login
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          {member.status === 'invited' && (
                            <span className="text-yellow-400 text-sm flex items-center gap-1 px-3 py-1 bg-yellow-500/10 rounded-lg border border-yellow-400/20">
                              <NeonCyanIcon type="clock" size={16} className="text-current" />
                              Pending
                            </span>
                          )}
                          {member.status === 'active' && (
                            <span className="text-green-400 text-sm flex items-center gap-1 px-3 py-1 bg-green-500/10 rounded-lg border border-green-400/20">
                              <NeonCyanIcon type="check" size={16} className="text-current" />
                              Active
                            </span>
                          )}
                          {canEdit && (
                            <button
                              onClick={() => handleEditRole(member)}
                              className="px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-all border border-cyan-400/30 flex items-center gap-2"
                            >
                              <NeonCyanIcon type="edit" size={16} className="text-current" />
                              Edit Role
                            </button>
                          )}
                          {canManage && !isCurrentUser && (
                            <button
                              onClick={() => handleRemove(member.id, member.email)}
                              className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all border border-red-400/30 flex items-center gap-2"
                            >
                              <NeonCyanIcon type="trash" size={16} className="text-current" />
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Invite Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="neo-glass-card rounded-2xl border border-white/20 max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Invite Team Member</h2>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <NeonCyanIcon type="close" size={24} className="text-current" />
                </button>
              </div>

              <form onSubmit={handleInvite} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    className="w-full bg-black/40 border border-cyan-400/30 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-cyan-400/50"
                    placeholder="team.member@example.com"
                  />
                  <p className="text-cyan-400/70 text-xs mt-1">
                    They will log in with Google using this email and automatically join your VC team
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    Full Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={inviteForm.fullName}
                    onChange={(e) => setInviteForm({ ...inviteForm, fullName: e.target.value })}
                    className="w-full bg-black/40 border border-cyan-400/30 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-cyan-400/50"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    Role
                  </label>
                  <select
                    value={inviteForm.role}
                    onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value as any })}
                    className="w-full bg-black/40 border border-cyan-400/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-400/50"
                  >
                    <option value="member">Member - Can view and accept projects</option>
                    <option value="admin">Admin - Can manage team and projects</option>
                    <option value="viewer">Viewer - Read-only access</option>
                  </select>
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="flex-1 px-4 py-3 bg-black/40 text-white rounded-lg hover:bg-black/60 transition-all border border-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={inviteLoading}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all border-2 border-cyan-400/50 shadow-lg shadow-cyan-500/20 disabled:opacity-50"
                  >
                    {inviteLoading ? 'Sending...' : 'Send Invitation'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Role Modal */}
        {showEditModal && selectedMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="neo-glass-card rounded-2xl border border-white/20 max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Edit Member Role</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedMember(null);
                  }}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <NeonCyanIcon type="close" size={24} className="text-current" />
                </button>
              </div>

              <div className="mb-4 p-4 bg-black/40 rounded-lg border border-cyan-400/20">
                <p className="text-white/70 text-sm mb-1">Member</p>
                <p className="text-white font-semibold">{selectedMember.fullName || selectedMember.email.split('@')[0]}</p>
                <p className="text-cyan-400/70 text-xs">{selectedMember.email}</p>
              </div>

              <form onSubmit={handleUpdateRole} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    Role
                  </label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ role: e.target.value as any })}
                    className="w-full bg-black/40 border border-cyan-400/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-400/50"
                  >
                    <option value="member">Member - Can view and accept projects</option>
                    <option value="admin">Admin - Can manage team and projects</option>
                    <option value="viewer">Viewer - Read-only access</option>
                  </select>
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedMember(null);
                    }}
                    className="flex-1 px-4 py-3 bg-black/40 text-white rounded-lg hover:bg-black/60 transition-all border border-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateLoading}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all border-2 border-cyan-400/50 shadow-lg shadow-cyan-500/20 disabled:opacity-50"
                  >
                    {updateLoading ? 'Updating...' : 'Update Role'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
