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

export default function ExchangeTeam() {
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
        // OPTIMIZED: Reduced timeout for faster loading
        const isReady = await waitForFirebase(3000);
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
            collection(dbInstance, 'exchange_team_members'),
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
            collection(dbInstance, 'exchange_team_members'),
            where('orgId', '==', userOrgId)
          );

          const unsubscribe = onSnapshot(membersQuery, (snapshot) => {
            const members = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as TeamMember[];

            // Sort: owner first, then admin, then by status (active > invited > inactive)
            members.sort((a, b) => {
              const roleOrder = { owner: 0, admin: 1, member: 2, viewer: 3 };
              const statusOrder = { active: 0, invited: 1, inactive: 2 };
              
              if (roleOrder[a.role] !== roleOrder[b.role]) {
                return roleOrder[a.role] - roleOrder[b.role];
              }
              return statusOrder[a.status] - statusOrder[b.status];
            });

            console.log('✅ [EXCHANGE TEAM] Team members updated:', members.length);
            setTeamMembers(members);
            setLoading(false);
          }, (error) => {
            console.error('❌ [EXCHANGE TEAM] Error loading team members:', error);
            setLoading(false);
          });

          return () => unsubscribe();
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('❌ [EXCHANGE TEAM] Error setting up team listener:', error);
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
    if (!user || !orgId) return;

    setInviteLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/exchange/team/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: inviteForm.email.toLowerCase(),
          fullName: inviteForm.fullName,
          role: inviteForm.role
        })
      });

      const result = await response.json();

      if (result.error) {
        alert(`Error: ${result.error}`);
      } else {
        alert(`✅ Invitation sent to ${inviteForm.email}`);
        setShowInviteModal(false);
        setInviteForm({ email: '', fullName: '', role: 'member' });
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
    setEditForm({ role: member.role === 'owner' ? 'admin' : member.role });
    setShowEditModal(true);
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedMember) return;

    setUpdateLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/exchange/team/update-role', {
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
      const response = await fetch('/api/exchange/team/remove', {
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
      <div className="min-h-screen bg-black pt-32 pb-12 px-4">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-6">
            <Link href="/exchange/dashboard" className="inline-flex items-center text-cyan-400 hover:text-cyan-300 mb-4">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </Link>
            <div className="neo-glass-card rounded-2xl p-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">Team Management</h2>
                  <p className="text-white/90 text-lg">Manage your exchange team members and permissions</p>
                </div>
                <div className="hidden lg:block">
                  <div className="w-20 h-20 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-2xl flex items-center justify-center shadow-lg border border-cyan-400/30">
                    <NeonCyanIcon type="users" size={40} className="text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="neo-glass-card rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-400/70 text-sm">Total Members</p>
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                </div>
                <NeonCyanIcon type="users" size={32} className="text-cyan-400" />
              </div>
            </div>
            <div className="neo-glass-card rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-400/70 text-sm">Active Members</p>
                  <p className="text-2xl font-bold text-white">{stats.active}</p>
                </div>
                <NeonCyanIcon type="verified" size={32} className="text-green-400" />
              </div>
            </div>
            <div className="neo-glass-card rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-400/70 text-sm">Pending Invites</p>
                  <p className="text-2xl font-bold text-white">{stats.invited}</p>
                </div>
                <NeonCyanIcon type="clock" size={32} className="text-yellow-400" />
              </div>
            </div>
            <div className="neo-glass-card rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-400/70 text-sm">Admins</p>
                  <p className="text-2xl font-bold text-white">{stats.admins}</p>
                </div>
                <NeonCyanIcon type="shield" size={32} className="text-cyan-400" />
              </div>
            </div>
          </div>

          {/* Add Team Member Button */}
          {canManage && (
            <div className="mb-6">
              <button
                onClick={() => setShowInviteModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold rounded-lg transition-all border-2 border-cyan-400/50 shadow-lg shadow-cyan-500/20 flex items-center gap-2"
              >
                <NeonCyanIcon type="users" size={20} className="text-white" />
                Add Team Member
              </button>
            </div>
          )}

          {/* Team Members List */}
          <div className="neo-glass-card rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-6">Team Members</h3>
            {teamMembers.length === 0 ? (
              <div className="text-center py-12">
                <NeonCyanIcon type="users" size={64} className="text-cyan-400/50 mx-auto mb-4" />
                <h4 className="text-xl font-bold text-white mb-2">No Team Members Yet</h4>
                <p className="text-cyan-400/70 mb-6">Start by inviting team members to your exchange</p>
                {canManage && (
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold rounded-lg transition-all border-2 border-cyan-400/50 shadow-lg shadow-cyan-500/20"
                  >
                    Invite First Member
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {teamMembers.map((member) => (
                  <div key={member.id} className="neo-glass-card rounded-lg p-4 hover:border-cyan-400/40 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-lg flex items-center justify-center border border-cyan-400/30">
                          <span className="text-white font-bold text-lg">
                            {(member.fullName || member.email || 'T').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-white font-semibold text-lg">
                              {member.fullName || member.email}
                              {member.userId === user?.uid && (
                                <span className="ml-2 text-cyan-400 text-sm">(You)</span>
                              )}
                            </h4>
                          </div>
                          <p className="text-cyan-400/70 text-sm">{member.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                              member.role === 'owner' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-400/30' :
                              member.role === 'admin' ? 'bg-blue-500/20 text-blue-400 border-blue-400/30' :
                              member.role === 'member' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-400/30' :
                              'bg-gray-500/20 text-gray-400 border-gray-400/30'
                            }`}>
                              {member.role}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                              member.status === 'active' ? 'bg-green-500/20 text-green-400 border-green-400/30' :
                              member.status === 'invited' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-400/30' :
                              'bg-gray-500/20 text-gray-400 border-gray-400/30'
                            }`}>
                              {member.status}
                            </span>
                          </div>
                        </div>
                      </div>
                      {canManage && member.userId !== user?.uid && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditRole(member)}
                            className="px-3 py-1.5 text-cyan-400 hover:text-cyan-300 text-sm font-medium border border-cyan-400/30 rounded-lg hover:border-cyan-400/50 transition-all"
                          >
                            Edit Role
                          </button>
                          <button
                            onClick={() => handleRemove(member.id, member.email)}
                            className="px-3 py-1.5 text-red-400 hover:text-red-300 text-sm font-medium border border-red-400/30 rounded-lg hover:border-red-400/50 transition-all"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Invite Modal */}
          {showInviteModal && (
            <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
              <div className="neo-glass-card rounded-2xl p-8 max-w-md w-full">
                <h3 className="text-2xl font-bold text-white mb-6">Invite Team Member</h3>
                <form onSubmit={handleInvite} className="space-y-4">
                  <div>
                    <label className="block text-white/70 text-sm font-medium mb-2">Email Address</label>
                    <input
                      type="email"
                      required
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                      className="w-full px-4 py-2 bg-black/40 border border-cyan-400/30 rounded-lg text-white focus:border-cyan-400 focus:outline-none"
                      placeholder="team@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-white/70 text-sm font-medium mb-2">Full Name</label>
                    <input
                      type="text"
                      required
                      value={inviteForm.fullName}
                      onChange={(e) => setInviteForm({ ...inviteForm, fullName: e.target.value })}
                      className="w-full px-4 py-2 bg-black/40 border border-cyan-400/30 rounded-lg text-white focus:border-cyan-400 focus:outline-none"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-white/70 text-sm font-medium mb-2">Role</label>
                    <select
                      value={inviteForm.role}
                      onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value as any })}
                      className="w-full px-4 py-2 bg-black/40 border border-cyan-400/30 rounded-lg text-white focus:border-cyan-400 focus:outline-none"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                      <option value="viewer">Viewer</option>
                    </select>
                    <p className="text-cyan-400/70 text-xs mt-1">
                      {inviteForm.role === 'admin' && 'Can manage team members and settings'}
                      {inviteForm.role === 'member' && 'Can view and manage listings'}
                      {inviteForm.role === 'viewer' && 'Read-only access'}
                    </p>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowInviteModal(false);
                        setInviteForm({ email: '', fullName: '', role: 'member' });
                      }}
                      className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all border border-white/20"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={inviteLoading}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold rounded-lg transition-all border-2 border-cyan-400/50 shadow-lg shadow-cyan-500/20 disabled:opacity-50"
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
            <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
              <div className="neo-glass-card rounded-2xl p-8 max-w-md w-full">
                <h3 className="text-2xl font-bold text-white mb-6">Edit Role</h3>
                <form onSubmit={handleUpdateRole} className="space-y-4">
                  <div>
                    <label className="block text-white/70 text-sm font-medium mb-2">Member</label>
                    <p className="text-white">{selectedMember.fullName || selectedMember.email}</p>
                  </div>
                  <div>
                    <label className="block text-white/70 text-sm font-medium mb-2">Role</label>
                    <select
                      value={editForm.role}
                      onChange={(e) => setEditForm({ role: e.target.value as any })}
                      className="w-full px-4 py-2 bg-black/40 border border-cyan-400/30 rounded-lg text-white focus:border-cyan-400 focus:outline-none"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                      <option value="viewer">Viewer</option>
                    </select>
                    <p className="text-cyan-400/70 text-xs mt-1">
                      {editForm.role === 'admin' && 'Can manage team members and settings'}
                      {editForm.role === 'member' && 'Can view and manage listings'}
                      {editForm.role === 'viewer' && 'Read-only access'}
                    </p>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditModal(false);
                        setSelectedMember(null);
                      }}
                      className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all border border-white/20"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updateLoading}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold rounded-lg transition-all border-2 border-cyan-400/50 shadow-lg shadow-cyan-500/20 disabled:opacity-50"
                    >
                      {updateLoading ? 'Updating...' : 'Update Role'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}

