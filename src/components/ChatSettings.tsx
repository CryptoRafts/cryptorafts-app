"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  XMarkIcon,
  UserPlusIcon,
  PencilIcon,
  ArrowRightOnRectangleIcon,
  FlagIcon,
  EnvelopeIcon,
  UserGroupIcon,
  ShieldExclamationIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface ChatMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  avatar?: string;
  joinedAt: Date;
}

interface ChatSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  roomName: string;
  currentUser: {
    id: string;
    name: string;
    email: string;
    role: 'owner' | 'admin' | 'member';
  };
  members: ChatMember[];
  onUpdateRoom: (roomId: string, updates: any) => void;
  onInviteMember: (email: string, role: string) => Promise<boolean>;
  onRemoveMember: (memberId: string) => void;
  onLeaveRoom: () => void;
  onReportRoom: (reason: string, description: string) => void;
}

const ChatSettings: React.FC<ChatSettingsProps> = ({
  isOpen,
  onClose,
  roomId,
  roomName,
  currentUser,
  members,
  onUpdateRoom,
  onInviteMember,
  onRemoveMember,
  onLeaveRoom,
  onReportRoom
}) => {
  const [activeTab, setActiveTab] = useState<'members' | 'settings' | 'danger'>('members');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'member' | 'admin'>('member');
  const [newRoomName, setNewRoomName] = useState(roomName);
  const [isRenaming, setIsRenaming] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [isReporting, setIsReporting] = useState(false);

  const canManageMembers = currentUser.role === 'owner' || currentUser.role === 'admin';
  const canRename = currentUser.role === 'owner';
  const canLeave = currentUser.role !== 'owner';

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) return;
    
    setIsInviting(true);
    try {
      const success = await onInviteMember(inviteEmail.trim(), inviteRole);
      if (success) {
        setInviteEmail('');
        setInviteRole('member');
        // Show success message
      }
    } catch (error) {
      console.error('Error inviting member:', error);
    } finally {
      setIsInviting(false);
    }
  };

  const handleRenameRoom = async () => {
    if (!newRoomName.trim() || newRoomName === roomName) return;
    
    setIsRenaming(true);
    try {
      await onUpdateRoom(roomId, { name: newRoomName.trim() });
      // Show success message
    } catch (error) {
      console.error('Error renaming room:', error);
    } finally {
      setIsRenaming(false);
    }
  };

  const handleReportRoom = async () => {
    if (!reportReason.trim()) return;
    
    setIsReporting(true);
    try {
      await onReportRoom(reportReason.trim(), reportDescription.trim());
      setReportReason('');
      setReportDescription('');
      // Show success message
    } catch (error) {
      console.error('Error reporting room:', error);
    } finally {
      setIsReporting(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-500/20 text-purple-400';
      case 'admin': return 'bg-blue-500/20 text-blue-400';
      case 'member': return 'bg-green-500/20 text-green-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return '👑';
      case 'admin': return '🛡️';
      case 'member': return '👤';
      default: return '👤';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-2xl max-h-[90vh] bg-gray-900 rounded-2xl shadow-2xl border border-white/10 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div>
                <h2 className="text-2xl font-bold text-white">Chat Settings</h2>
                <p className="text-white/60">{roomName}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/10">
              {[
                { id: 'members', label: 'Members', icon: UserGroupIcon },
                { id: 'settings', label: 'Settings', icon: PencilIcon },
                { id: 'danger', label: 'Danger Zone', icon: ShieldExclamationIcon }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'text-blue-400 border-b-2 border-blue-400'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto max-h-[calc(90vh-200px)]">
              {activeTab === 'members' && (
                <div className="p-6 space-y-6">
                  {/* Invite Member */}
                  {canManageMembers && (
                    <div className="bg-white/5 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                        <UserPlusIcon className="w-5 h-5 text-blue-400" />
                        <span>Invite Members</span>
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-white/80 text-sm mb-2">Email Address</label>
                          <input
                            type="email"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            placeholder="Enter email address"
                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-white/80 text-sm mb-2">Role</label>
                          <select
                            value={inviteRole}
                            onChange={(e) => setInviteRole(e.target.value as any)}
                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
                          >
                            <option value="member">Member</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                        <button
                          onClick={handleInviteMember}
                          disabled={!inviteEmail.trim() || isInviting}
                          className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white transition-colors"
                        >
                          {isInviting ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span>Inviting...</span>
                            </>
                          ) : (
                            <>
                              <EnvelopeIcon className="w-4 h-4" />
                              <span>Send Invitation</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Members List */}
                  <div className="bg-white/5 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-white mb-4">Current Members ({members.length})</h3>
                    <div className="space-y-3">
                      {members.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-bold text-sm">
                                {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <p className="text-white font-medium">{member.name}</p>
                                <span className="text-lg">{getRoleIcon(member.role)}</span>
                              </div>
                              <p className="text-white/60 text-sm">{member.email}</p>
                              <p className="text-white/40 text-xs">
                                Joined {member.joinedAt ? 
                                  (member.joinedAt instanceof Date ? 
                                    member.joinedAt.toLocaleDateString() : 
                                    new Date(member.joinedAt).toLocaleDateString()
                                  ) : 
                                  'Unknown'
                                }
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(member.role)}`}>
                              {member.role}
                            </span>
                            {canManageMembers && member.id !== currentUser.id && member.role !== 'owner' && (
                              <button
                                onClick={() => onRemoveMember(member.id)}
                                className="p-1 hover:bg-red-500/20 rounded text-red-400 hover:text-red-300 transition-colors"
                                title="Remove member"
                              >
                                <XMarkIcon className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="p-6 space-y-6">
                  {/* Rename Room */}
                  {canRename && (
                    <div className="bg-white/5 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                        <PencilIcon className="w-5 h-5 text-blue-400" />
                        <span>Rename Room</span>
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-white/80 text-sm mb-2">Room Name</label>
                          <input
                            type="text"
                            value={newRoomName}
                            onChange={(e) => setNewRoomName(e.target.value)}
                            placeholder="Enter new room name"
                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <button
                          onClick={handleRenameRoom}
                          disabled={!newRoomName.trim() || newRoomName === roomName || isRenaming}
                          className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white transition-colors"
                        >
                          {isRenaming ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span>Renaming...</span>
                            </>
                          ) : (
                            <>
                              <PencilIcon className="w-4 h-4" />
                              <span>Rename Room</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Room Information */}
                  <div className="bg-white/5 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-white mb-4">Room Information</h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-white/60 text-sm">Room ID:</span>
                        <p className="text-white font-mono text-sm">{roomId}</p>
                      </div>
                      <div>
                        <span className="text-white/60 text-sm">Created:</span>
                        <p className="text-white text-sm">2 days ago</p>
                      </div>
                      <div>
                        <span className="text-white/60 text-sm">Members:</span>
                        <p className="text-white text-sm">{members.length} members</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'danger' && (
                <div className="p-6 space-y-6">
                  {/* Leave Room */}
                  {canLeave && (
                    <div className="bg-white/5 rounded-lg p-4 border border-yellow-500/20">
                      <h3 className="text-lg font-semibold text-yellow-400 mb-4 flex items-center space-x-2">
                        <ArrowRightOnRectangleIcon className="w-5 h-5" />
                        <span>Leave Room</span>
                      </h3>
                      <p className="text-white/80 text-sm mb-4">
                        You will no longer have access to this chat room. You can rejoin if you receive another invitation.
                      </p>
                      <button
                        onClick={onLeaveRoom}
                        className="flex items-center space-x-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 rounded-lg text-white transition-colors"
                      >
                        <ArrowRightOnRectangleIcon className="w-4 h-4" />
                        <span>Leave Room</span>
                      </button>
                    </div>
                  )}

                  {/* Report Room */}
                  <div className="bg-white/5 rounded-lg p-4 border border-red-500/20">
                    <h3 className="text-lg font-semibold text-red-400 mb-4 flex items-center space-x-2">
                      <FlagIcon className="w-5 h-5" />
                      <span>Report Room</span>
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-white/80 text-sm mb-2">Reason</label>
                        <select
                          value={reportReason}
                          onChange={(e) => setReportReason(e.target.value)}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-red-500"
                        >
                          <option value="">Select a reason</option>
                          <option value="spam">Spam or harassment</option>
                          <option value="inappropriate">Inappropriate content</option>
                          <option value="scam">Scam or fraud</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-white/80 text-sm mb-2">Description</label>
                        <textarea
                          value={reportDescription}
                          onChange={(e) => setReportDescription(e.target.value)}
                          placeholder="Please provide more details..."
                          rows={3}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-red-500 resize-none"
                        />
                      </div>
                      <button
                        onClick={handleReportRoom}
                        disabled={!reportReason.trim() || isReporting}
                        className="flex items-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white transition-colors"
                      >
                        {isReporting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Reporting...</span>
                          </>
                        ) : (
                          <>
                            <FlagIcon className="w-4 h-4" />
                            <span>Report Room</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ChatSettings;
