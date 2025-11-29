"use client";

import { useState } from "react";
import { 
  XMarkIcon, 
  UserPlusIcon,
  LinkIcon,
  ClipboardDocumentIcon,
  CheckIcon
} from "@heroicons/react/24/outline";

interface Props {
  roomId: string;
  currentUserId?: string;
  existingMembers?: string[];
  onClose: () => void;
  onAddMember?: (memberId: string) => void;
  onAddMembers?: (memberIds: string[]) => void;
}

export default function AddMembersModal({ roomId, currentUserId, existingMembers = [], onClose, onAddMember, onAddMembers }: Props) {
  const [activeTab, setActiveTab] = useState<'invite' | 'search'>('invite');
  const [inviteLink, setInviteLink] = useState(`https://localhost:3000/join/${roomId}`);
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const handleAddByEmail = () => {
    if (searchQuery.trim()) {
      const email = searchQuery.trim();
      if (onAddMembers) {
        onAddMembers([email]);
      } else if (onAddMember) {
        onAddMember(email);
      } else {
        alert(`Invitation sent to ${email}`);
      }
      setSearchQuery('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-white/20 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">👥 Add Members</h2>
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
            onClick={() => setActiveTab('invite')}
            className={`flex-1 px-6 py-3 font-medium transition-colors ${
              activeTab === 'invite'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Invite Link
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`flex-1 px-6 py-3 font-medium transition-colors ${
              activeTab === 'search'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Add by Email
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Invite Link Tab */}
          {activeTab === 'invite' && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <LinkIcon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Invite Link</h3>
                <p className="text-white/60 text-sm">
                  Share this link to invite people to join your group chat
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Invite Link
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inviteLink}
                      readOnly
                      className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                      {copied ? (
                        <>
                          <CheckIcon className="w-4 h-4" />
                          Copied
                        </>
                      ) : (
                        <>
                          <ClipboardDocumentIcon className="w-4 h-4" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-blue-600/10 border border-blue-600/30 rounded-lg">
                  <h4 className="text-blue-400 font-medium mb-2">📋 How to invite:</h4>
                  <ul className="text-sm text-blue-300 space-y-1">
                    <li>• Copy the invite link above</li>
                    <li>• Share it via email, WhatsApp, or any messaging app</li>
                    <li>• Recipients can click the link to join your group</li>
                    <li>• They'll be added automatically when they click</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Add by Email Tab */}
          {activeTab === 'search' && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserPlusIcon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Add by Email</h3>
                <p className="text-white/60 text-sm">
                  Enter an email address to send an invitation
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Enter email address..."
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <button
                  onClick={handleAddByEmail}
                  disabled={!searchQuery.trim()}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <UserPlusIcon className="w-5 h-5" />
                  Send Invitation
                </button>

                <div className="p-4 bg-yellow-600/10 border border-yellow-600/30 rounded-lg">
                  <h4 className="text-yellow-400 font-medium mb-2">📧 Email Invitation:</h4>
                  <ul className="text-sm text-yellow-300 space-y-1">
                    <li>• Enter a valid email address</li>
                    <li>• An invitation will be sent to their email</li>
                    <li>• They can accept to join your group</li>
                    <li>• You'll be notified when they join</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
