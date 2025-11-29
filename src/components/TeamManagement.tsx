'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { userIsolationService, Team, TeamMember } from '@/lib/user-isolation-service';
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';

interface TeamManagementProps {
  onTeamSelect?: (teamId: string) => void;
  selectedTeamId?: string;
}

export default function TeamManagement({ onTeamSelect, selectedTeamId }: TeamManagementProps) {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member' | 'viewer'>('member');

  useEffect(() => {
    if (user) {
      loadUserTeams();
    }
  }, [user]);

  const loadUserTeams = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const userTeams = await userIsolationService.getUserTeams(user.uid);
      setTeams(userTeams);
    } catch (error) {
      console.error('Error loading teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!user || !newTeamName.trim()) return;

    try {
      const teamId = await userIsolationService.createTeam(
        newTeamName.trim(),
        user.uid,
        user.email || '',
        newTeamDescription.trim() || undefined
      );
      
      setNewTeamName('');
      setNewTeamDescription('');
      setShowCreateModal(false);
      await loadUserTeams();
    } catch (error) {
      console.error('Error creating team:', error);
    }
  };

  const handleInviteUser = async () => {
    if (!selectedTeam || !inviteEmail.trim()) return;

    try {
      // In a real app, you'd look up the user by email first
      // For now, we'll use a placeholder
      const success = await userIsolationService.inviteToTeam(
        selectedTeam.id,
        user!.uid,
        'placeholder-user-id', // Would be resolved from email
        inviteEmail.trim(),
        inviteRole
      );

      if (success) {
        setInviteEmail('');
        setShowInviteModal(false);
        await loadUserTeams();
      }
    } catch (error) {
      console.error('Error inviting user:', error);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <NeonCyanIcon type="shield" size={16} className="text-purple-400" />;
      case 'admin':
        return <NeonCyanIcon type="settings" size={16} className="text-blue-400" />;
      case 'member':
        return <NeonCyanIcon type="users" size={16} className="text-green-400" />;
      case 'viewer':
        return <NeonCyanIcon type="eye" size={16} className="text-gray-400" />;
      default:
        return <NeonCyanIcon type="users" size={16} className="text-gray-400" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'admin':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'member':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'viewer':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  if (loading) {
    return (
      <div className="glass p-6 rounded-xl border border-white/10">
        <div className="animate-pulse">
          <div className="h-6 bg-white/10 rounded mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-white/5 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Teams</h2>
          <p className="text-white/60">Manage your teams and collaborate securely</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <NeonCyanIcon type="plus" size={20} className="text-current" />
          Create Team
        </button>
      </div>

      {/* Teams List */}
      <div className="grid gap-4">
        {teams.map((team) => (
          <div
            key={team.id}
            className={`glass p-6 rounded-xl border transition-all duration-300 cursor-pointer ${
              selectedTeamId === team.id 
                ? 'border-blue-500/50 bg-blue-500/10' 
                : 'border-white/10 hover:border-white/20'
            }`}
            onClick={() => {
              setSelectedTeam(team);
              onTeamSelect?.(team.id);
            }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">{team.name}</h3>
                {team.description && (
                  <p className="text-white/60 text-sm mb-3">{team.description}</p>
                )}
                <div className="flex items-center gap-4 text-sm text-white/70">
                  <span className="flex items-center gap-1">
                    <NeonCyanIcon type="users" size={16} className="text-current" />
                    {team.members.length} members
                  </span>
                  <span className="flex items-center gap-1">
                    <NeonCyanIcon type="shield" size={16} className="text-current" />
                    {team.settings.isPrivate ? 'Private' : 'Public'}
                  </span>
                </div>
              </div>
              
              {team.members.find(m => m.userId === user?.uid)?.role === 'owner' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTeam(team);
                    setShowInviteModal(true);
                  }}
                  className="btn-secondary flex items-center gap-2"
                >
                  <NeonCyanIcon type="user-plus" size={16} className="text-current" />
                  Invite
                </button>
              )}
            </div>

            {/* Team Members */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-white/80 mb-2">Members</h4>
              <div className="flex flex-wrap gap-2">
                {team.members.slice(0, 5).map((member) => (
                  <div
                    key={member.userId}
                    className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-2 ${getRoleColor(member.role)}`}
                  >
                    {getRoleIcon(member.role)}
                    <span>{member.role}</span>
                    {member.status === 'pending' && (
                      <span className="text-yellow-400">•</span>
                    )}
                  </div>
                ))}
                {team.members.length > 5 && (
                  <div className="px-3 py-1 rounded-full text-xs font-medium border border-white/20 text-white/60">
                    +{team.members.length - 5} more
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {teams.length === 0 && (
          <div className="glass p-12 rounded-xl border border-white/10 text-center">
            <NeonCyanIcon type="users" size={64} className="text-white/20 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No teams yet</h3>
            <p className="text-white/60 mb-6">Create your first team to start collaborating securely</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary flex items-center gap-2 mx-auto"
            >
              <NeonCyanIcon type="plus" size={20} className="text-current" />
              Create Team
            </button>
          </div>
        )}
      </div>

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass rounded-2xl max-w-md w-full p-6 border border-white/30">
            <h3 className="text-xl font-bold text-white mb-4">Create New Team</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Team Name
                </label>
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50"
                  placeholder="Enter team name"
                />
              </div>
              
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={newTeamDescription}
                  onChange={(e) => setNewTeamDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50 resize-none"
                  rows={3}
                  placeholder="Describe your team's purpose"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={handleCreateTeam}
                disabled={!newTeamName.trim()}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                <NeonCyanIcon type="check" size={20} className="text-current" />
                Create Team
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="btn-secondary flex items-center justify-center gap-2"
              >
                <NeonCyanIcon type="close" size={20} className="text-current" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite User Modal */}
      {showInviteModal && selectedTeam && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass rounded-2xl max-w-md w-full p-6 border border-white/30">
            <h3 className="text-xl font-bold text-white mb-4">
              Invite to {selectedTeam.name}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50"
                  placeholder="user@example.com"
                />
              </div>
              
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500/50"
                >
                  <option value="viewer">Viewer - Read only</option>
                  <option value="member">Member - Read & Write</option>
                  <option value="admin">Admin - Manage team</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={handleInviteUser}
                disabled={!inviteEmail.trim()}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                <NeonCyanIcon type="envelope" size={20} className="text-current" />
                Send Invite
              </button>
              <button
                onClick={() => setShowInviteModal(false)}
                className="btn-secondary flex items-center justify-center gap-2"
              >
                <NeonCyanIcon type="close" size={20} className="text-current" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
