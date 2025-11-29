"use client";

import { useState } from "react";
import { 
  XMarkIcon, 
  UserGroupIcon, 
  BellIcon, 
  BellSlashIcon,
  PhotoIcon,
  UserPlusIcon,
  TrashIcon,
  ShieldCheckIcon
} from "@heroicons/react/24/outline";
import AddMembersModal from "./AddMembersModal";
import type { ChatRoom } from "@/lib/chatService.enhanced";

interface Props {
  room: ChatRoom;
  currentUserId: string;
  onClose: () => void;
  onUpdateSettings: (settings: any) => void;
  onAddMembers: () => void;
  onRemoveMember: (memberId: string) => void;
  onChangeAvatar: () => void;
  onLeaveGroup: () => void;
}

export default function GroupSettingsModal({ 
  room, 
  currentUserId, 
  onClose,
  onUpdateSettings,
  onAddMembers,
  onRemoveMember,
  onChangeAvatar,
  onLeaveGroup
}: Props) {
  const [activeTab, setActiveTab] = useState<'general' | 'members' | 'privacy'>('general');
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [showChangeName, setShowChangeName] = useState(false);
  const [newGroupName, setNewGroupName] = useState(room.name);
  const [localSettings, setLocalSettings] = useState({
    voiceNotesAllowed: true,
    videoCallAllowed: true,
    fileUploadsAllowed: true,
    messagesAllowed: true,
    ...room.settings
  });

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

  const handleSaveName = () => {
    if (newGroupName.trim() && newGroupName !== room.name) {
      // Update group name
      console.log('Update group name to:', newGroupName);
      setShowChangeName(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-modal p-4">
      <div className="bg-gray-800 border border-white/20 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">⚙️ Group Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          <button
            onClick={() => setActiveTab('general')}
            className={`flex-1 px-6 py-3 font-medium transition-colors ${
              activeTab === 'general'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-white/60 hover:text-white'
            }`}
          >
            General
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`flex-1 px-6 py-3 font-medium transition-colors ${
              activeTab === 'members'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Members ({room.members.length})
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex-1 px-6 py-3 font-medium transition-colors ${
              activeTab === 'privacy'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Privacy
          </button>
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
                    <button
                      onClick={onChangeAvatar}
                      className="absolute -bottom-1 -right-1 p-2 bg-blue-600 hover:bg-blue-700 rounded-full transition-colors"
                      title="Change group picture"
                    >
                      <PhotoIcon className="w-4 h-4 text-white" />
                    </button>
                  )}
                </div>
                <div className="flex-1">
                  {showChangeName && isAdmin ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
                        placeholder="Enter group name"
                        maxLength={50}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveName}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                        >
                          Save
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
                  
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div>
                      <p className="text-white font-medium">Voice Notes</p>
                      <p className="text-sm text-white/60">Allow members to send voice messages</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localSettings.voiceNotesAllowed}
                        onChange={(e) => setLocalSettings({
                          ...localSettings,
                          voiceNotesAllowed: e.target.checked
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div>
                      <p className="text-white font-medium">Video Calls</p>
                      <p className="text-sm text-white/60">Allow video calls (30 min limit)</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localSettings.videoCallAllowed}
                        onChange={(e) => setLocalSettings({
                          ...localSettings,
                          videoCallAllowed: e.target.checked
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div>
                      <p className="text-white font-medium">File Uploads</p>
                      <p className="text-sm text-white/60">Allow members to upload files</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localSettings.fileUploadsAllowed}
                        onChange={(e) => setLocalSettings({
                          ...localSettings,
                          fileUploadsAllowed: e.target.checked
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
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
                  className="w-full p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <UserPlusIcon className="w-5 h-5" />
                  Add Members
                </button>
              )}

              <div className="space-y-2">
                {room.members.map((memberId) => (
                  <div 
                    key={memberId}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                        <span className="text-white font-semibold">
                          {((room?.memberNames?.[memberId] || 'Unknown')?.charAt(0)?.toUpperCase()) || 'U'}
                        </span>
                      </div>
                      <div>
                        <span className="text-white font-medium text-sm">
                          {room.memberNames?.[memberId] || memberId}
                        </span>
                        {room.memberRoles?.[memberId] === 'admin' || (room as Record<string, any>)?.admins?.includes?.(memberId) ? (
                          <span className="ml-2 text-xs bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded">
                            Admin
                          </span>
                        ) : null}
                        {!isOwner && memberId === room.createdBy && (
                          <span className="ml-2 text-xs bg-purple-600/20 text-purple-400 px-2 py-0.5 rounded">
                            Owner
                          </span>
                        )}
                      </div>
                    </div>

                    {isAdmin && memberId !== room.createdBy && memberId !== currentUserId && (
                      <button
                        onClick={() => onRemoveMember(memberId)}
                        className="p-2 hover:bg-red-600/20 text-red-400 rounded-lg transition-colors"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {!isOwner && (
                <button
                  onClick={onLeaveGroup}
                  className="w-full p-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                >
                  Leave Group
                </button>
              )}
            </div>
          )}

          {/* Privacy Tab */}
          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <div className="p-4 bg-white/5 rounded-lg">
                <h4 className="font-medium text-white mb-2">🔒 Privacy Settings</h4>
                <p className="text-sm text-white/60 mb-4">
                  Control who can see and access this group chat
                </p>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white">Invite Link</span>
                    <span className="text-sm text-green-400">Enabled</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white">Message History</span>
                    <span className="text-sm text-blue-400">Visible to all</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white">RaftAI Monitoring</span>
                    <span className="text-sm text-purple-400">Active</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-yellow-600/10 border border-yellow-600/30 rounded-lg">
                <p className="text-sm text-yellow-400">
                  ⚠️ All messages are monitored by RaftAI for security and compliance purposes.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          {isAdmin && activeTab === 'general' && (
            <button
              onClick={handleSaveSettings}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Save Changes
            </button>
          )}
        </div>
      </div>

      {/* Add Members Modal */}
      {showAddMembers && (
        <AddMembersModal
          roomId={room.id}
          currentUserId={currentUserId}
          onClose={() => setShowAddMembers(false)}
          onAddMember={(memberId) => {
            // Handle adding member
            console.log('Add member:', memberId);
            setShowAddMembers(false);
          }}
        />
      )}
    </div>
  );
}
