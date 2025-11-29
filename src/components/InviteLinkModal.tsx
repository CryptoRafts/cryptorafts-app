"use client";

import { useState } from "react";
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';

interface Props {
  roomId: string;
  roomName: string;
  onClose: () => void;
}

export default function InviteLinkModal({ roomId, roomName, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  // Generate invite link (you can make this more sophisticated with actual invite codes in Firebase)
  const inviteLink = `${window.location.origin}/messages/join?room=${roomId}`;
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = inviteLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (!canShare) {
      handleCopy();
      return;
    }

    try {
      await navigator.share({
        title: `Join ${roomName}`,
        text: `You've been invited to join the chat: ${roomName}`,
        url: inviteLink,
      });
    } catch (err) {
      console.log('Share cancelled');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-white/20 rounded-2xl p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <NeonCyanIcon type="link" size={24} className="text-white" />
            Invite Team Member
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <NeonCyanIcon type="close" size={20} className="text-white" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-white/70 mb-2">Share this link to invite team members to the chat:</p>
            <div className="flex gap-2">
              <div className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white text-sm truncate font-mono">
                {inviteLink}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleCopy}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {copied ? (
                <>
                  <NeonCyanIcon type="check" size={20} className="text-white" />
                  Copied!
                </>
              ) : (
                <>
                  <NeonCyanIcon type="document" size={20} className="text-white" />
                  Copy Link
                </>
              )}
            </button>

            {canShare && (
              <button
                onClick={handleShare}
                className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                📤 Share
              </button>
            )}
          </div>

          <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-3">
            <p className="text-xs text-blue-300">
              💡 <strong>Tip:</strong> Anyone with this link can join the chat. Share it only with team members you trust.
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

