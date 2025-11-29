"use client";

import { useState } from "react";
import { chatService } from "@/lib/chat/chatService";
import { XMarkIcon, ClipboardDocumentIcon, CheckIcon, UserPlusIcon } from "@heroicons/react/24/outline";

interface InviteModalProps {
  roomId: string;
  userId: string;
  onClose: () => void;
}

export default function InviteModal({ roomId, userId, onClose }: InviteModalProps) {
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const generateCode = async () => {
    setLoading(true);
    try {
      const code = await chatService.generateInvite(roomId, userId, 10);
      setInviteCode(code);
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!inviteCode) return;
    
    const inviteUrl = `${window.location.origin}/messages/join?code=${inviteCode}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl max-w-md w-full border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="text-white font-medium">Invite Members</h3>
          <button
            onClick={onClose}
            className="p-1 text-white/60 hover:text-white hover:bg-white/10 rounded"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!inviteCode ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserPlusIcon className="w-8 h-8 text-blue-400" />
              </div>
              <p className="text-white mb-2 font-medium">Create an invite link</p>
              <p className="text-white/60 text-sm mb-6">
                Anyone with this link can join the room
              </p>
              <button
                onClick={generateCode}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-white/10 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
              >
                {loading ? 'Generating...' : 'Generate Invite Link'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Invite code */}
              <div>
                <label className="text-white/60 text-xs block mb-2">Invite Code</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-blue-400 font-mono text-lg text-center">
                    {inviteCode}
                  </div>
                  <button
                    onClick={copyToClipboard}
                    className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                    title="Copy"
                  >
                    {copied ? (
                      <CheckIcon className="w-5 h-5 text-green-400" />
                    ) : (
                      <ClipboardDocumentIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Invite URL */}
              <div>
                <label className="text-white/60 text-xs block mb-2">Invite Link</label>
                <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white/80 text-sm break-all">
                  {window.location.origin}/messages/join?code={inviteCode}
                </div>
              </div>

              {/* Info */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <p className="text-blue-300 text-xs">
                  ✓ Valid for 7 days<br />
                  ✓ Max 10 uses<br />
                  ✓ Share with team members
                </p>
              </div>

              {/* Copy button */}
              <button
                onClick={copyToClipboard}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                {copied ? '✓ Copied!' : 'Copy Link'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

