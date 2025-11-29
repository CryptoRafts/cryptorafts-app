"use client";

import { useState, useRef } from "react";
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';
import type { ChatRoom } from "@/lib/chatService.enhanced";
import { enhancedChatService } from "@/lib/chatService.enhanced";
import AddMembersModal from "./AddMembersModal";

interface Props {
  room: ChatRoom;
  currentUserId: string;
  onClose: () => void;
  onUpdateSettings: (settings: any) => void;
  onAddMembers: (memberIds: string[]) => void;
  onRemoveMember: (memberId: string) => void;
  onChangeAvatar: (file: File) => void;
  onLeaveGroup: () => void;
  onDeleteGroup: () => void;
}

export default function GroupSettingsWorking({ 
  room, 
  currentUserId, 
  onClose, 
  onUpdateSettings,
  onAddMembers,
  onRemoveMember,
  onChangeAvatar,
  onLeaveGroup,
  onDeleteGroup
}: Props) {
  const [activeTab, setActiveTab] = useState<'general' | 'members' | 'privacy'>('general');
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [showChangeName, setShowChangeName] = useState(false);
  const [newGroupName, setNewGroupName] = useState(room.name);
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [localSettings, setLocalSettings] = useState({
    voiceNotesAllowed: true,
    videoCallAllowed: true,
    fileUploadsAllowed: true,
    messagesAllowed: true,
    ...room.settings
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isOwner = room.createdBy === currentUserId;
  const isAdmin =
    isOwner ||
    room.memberRoles?.[currentUserId] === 'admin' ||
    (room as Record<string, any>)?.admins?.includes?.(currentUserId);
  const groupAvatar = room.groupAvatar ?? (room as Record<string, any>)?.avatarUrl ?? null;

  const handleSaveSettings = () => {
    onUpdateSettings(localSettings);
    onClose();
  };

  const handleSaveName = async () => {
    if (newGroupName.trim() && newGroupName !== room.name) {
      try {
        setIsUpdatingName(true);
        console.log('📝 Update group name to:', newGroupName);
        
        // Get current user's name from room.memberNames
        const currentUserName = room.memberNames?.[currentUserId] || 'Unknown';
        
        // Update group name via chat service
        await enhancedChatService.updateGroupName(room.id, newGroupName.trim(), currentUserId, currentUserName);
        
        setShowChangeName(false);
        console.log('✅ Group name updated successfully');
      } catch (error) {
        console.error('❌ Failed to update group name:', error);
        alert('Failed to update group name. Please try again.');
      } finally {
        setIsUpdatingName(false);
      }
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert('Image must be less than 5MB');
      return;
    }

    try {
      setIsUploadingAvatar(true);
      console.log('📸 Uploading group avatar...');
      
      onChangeAvatar(file);
      
      console.log('✅ Avatar uploaded successfully');
    } catch (error) {
      console.error('❌ Failed to upload avatar:', error);
      alert('Failed to upload avatar. Please try again.');
    } finally {
      setIsUploadingAvatar(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getDisplayName = (name: string) => {
    if (!name) return 'Unknown User';
    if (name.includes('@')) {
      return name.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    return name;
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[9999] p-4">
      <div className="neo-glass-card rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden relative z-[10000]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">Group Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-cyan-500/20 rounded-lg transition-colors border border-transparent hover:border-cyan-400/30"
          >
            <NeonCyanIcon type="close" size={20} className="text-white" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-cyan-400/20">
          {[
            { id: 'general', label: 'General', icon: '⚙️' },
            { id: 'members', label: 'Members', icon: '👥' },
            { id: 'privacy', label: 'Privacy', icon: '🔒' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-400/10'
                  : 'text-white/60 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* Group Info */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  {groupAvatar ? (
                    <img
                      src={groupAvatar}
                      alt={room.name}
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                      <span className="text-white text-2xl font-semibold">
                        {room?.name?.charAt(0)?.toUpperCase() || 'C'}
                      </span>
                    </div>
                  )}
                  {isAdmin && (
                    <>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute -bottom-1 -right-1 p-2 bg-cyan-600 hover:bg-cyan-700 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-cyan-400/30"
                        title="Change group picture"
                        disabled={isUploadingAvatar}
                      >
                        <NeonCyanIcon type="photo" size={16} className="text-white" />
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarUpload}
                      />
                    </>
                  )}
                </div>
                <div className="flex-1">
                  {showChangeName && isAdmin ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        className="w-full px-3 py-2 bg-white/5 border border-cyan-400/20 rounded-lg text-white focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                        placeholder="Enter group name"
                        maxLength={50}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveName}
                          disabled={isUpdatingName || !newGroupName.trim()}
                          className="px-3 py-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20"
                        >
                          {isUpdatingName ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={() => {
                            setShowChangeName(false);
                            setNewGroupName(room.name);
                          }}
                          className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-semibold text-white">{room.name}</h3>
                      {isAdmin && (
                        <button
                          onClick={() => setShowChangeName(true)}
                          className="p-1 hover:bg-white/10 rounded transition-colors"
                          title="Change group name"
                        >
                          <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      )}
                    </div>
                  )}
                  <p className="text-sm text-white/60">{room.members.length} members</p>
                </div>
              </div>

              {/* Permissions */}
              {isAdmin && (
                <div className="space-y-3">
                  <h4 className="font-medium text-white mb-3">📋 Permissions</h4>
                  
                  <div className="space-y-3">
                    <label className="flex items-center justify-between">
                      <span className="text-white">Allow voice notes</span>
                      <input
                        type="checkbox"
                        checked={localSettings.voiceNotesAllowed}
                        onChange={(e) => setLocalSettings(prev => ({ ...prev, voiceNotesAllowed: e.target.checked }))}
                        className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500"
                      />
                    </label>
                    
                    <label className="flex items-center justify-between">
                      <span className="text-white">Allow video calls</span>
                      <input
                        type="checkbox"
                        checked={localSettings.videoCallAllowed}
                        onChange={(e) => setLocalSettings(prev => ({ ...prev, videoCallAllowed: e.target.checked }))}
                        className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500"
                      />
                    </label>
                    
                    <label className="flex items-center justify-between">
                      <span className="text-white">Allow file uploads</span>
                      <input
                        type="checkbox"
                        checked={localSettings.fileUploadsAllowed}
                        onChange={(e) => setLocalSettings(prev => ({ ...prev, fileUploadsAllowed: e.target.checked }))}
                        className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500"
                      />
                    </label>
                    
                    <label className="flex items-center justify-between">
                      <span className="text-white">Allow messages</span>
                      <input
                        type="checkbox"
                        checked={localSettings.messagesAllowed}
                        onChange={(e) => setLocalSettings(prev => ({ ...prev, messagesAllowed: e.target.checked }))}
                        className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500"
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Members Tab */}
          {activeTab === 'members' && (
            <div className="space-y-4">
              {isAdmin && (
                <button
                  onClick={() => setShowAddMembers(true)}
                  className="w-full p-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors shadow-lg shadow-cyan-500/20"
                >
                  <NeonCyanIcon type="user-plus" size={20} className="text-white" />
                  Add Members
                </button>
              )}
              
              <div className="space-y-2">
                {room.members.map((memberId) => {
                  const memberName = room.memberNames?.[memberId] || 'Unknown User';
                  const displayName = getDisplayName(memberName) || 'Unknown';
                  const isOwnerMember = memberId === room.createdBy;
                  const isAdminMember =
                    room.memberRoles?.[memberId] === 'admin' ||
                    (room as Record<string, any>)?.admins?.includes?.(memberId);
                  const isCurrentUser = memberId === currentUserId;
                  
                  return (
                    <div key={memberId} className="flex items-center justify-between p-3 neo-glass-card rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                          <span className="text-white font-semibold">
                            {(displayName || 'U').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-white font-medium">{displayName}</p>
                          <p className="text-white/60 text-sm">
                            {isOwnerMember ? 'Owner' : isAdminMember ? 'Admin' : 'Member'}
                          </p>
                        </div>
                      </div>
                      
                      {!isCurrentUser && isAdmin && (
                        <button
                          onClick={() => onRemoveMember(memberId)}
                          className="p-2 text-red-400 hover:bg-red-400/20 rounded-lg transition-colors border border-transparent hover:border-red-400/30"
                          title="Remove member"
                        >
                          <NeonCyanIcon type="user-minus" size={20} className="text-red-400" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Privacy Tab */}
          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <div className="p-4 bg-white/5 rounded-lg">
                <h4 className="text-white font-medium mb-2">Group Privacy</h4>
                <p className="text-white/60 text-sm">
                  This is a private group chat. Only invited members can see and participate in conversations.
                </p>
              </div>
              
              <div className="p-4 bg-white/5 rounded-lg">
                <h4 className="text-white font-medium mb-2">Data & Security</h4>
                <p className="text-white/60 text-sm">
                  All messages are encrypted and stored securely. Group admins can manage member permissions.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-cyan-400/20">
          <div className="flex gap-2">
            <button
              onClick={onLeaveGroup}
              className="px-4 py-2 text-red-400 hover:bg-red-400/20 rounded-lg transition-colors border border-transparent hover:border-red-400/30"
            >
              Leave Group
            </button>
            {isOwner && (
              <button
                onClick={() => {
                  if (confirm('⚠️ Are you sure you want to delete this group? This will permanently delete the group and all messages. This action cannot be undone.')) {
                    onDeleteGroup();
                  }
                }}
                className="px-4 py-2 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors border border-transparent hover:border-red-500/30"
              >
                Delete Group
              </button>
            )}
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-cyan-400/20"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveSettings}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg transition-colors shadow-lg shadow-cyan-500/20"
            >
              Save Changes
            </button>
          </div>
        </div>

        {/* Add Members Modal */}
        {showAddMembers && (
          <AddMembersModal
            roomId={room.id}
            existingMembers={room.members}
            onClose={() => setShowAddMembers(false)}
            onAddMembers={onAddMembers}
          />
        )}
      </div>
    </div>
  );
}
