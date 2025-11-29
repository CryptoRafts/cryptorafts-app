"use client";

import { useState } from "react";
import type { ChatMessage, ChatRoom } from "@/lib/chat/types";
import { 
  ArrowUturnLeftIcon,
  FlagIcon,
  EllipsisHorizontalIcon,
  UserPlusIcon
} from "@heroicons/react/24/outline";

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  showAvatar: boolean;
  room: ChatRoom;
  onReaction: (emoji: string) => void;
  onReply: () => void;
  onPin: () => void;
  onReport: () => void;
  canPin: boolean;
}

export default function MessageBubble({
  message,
  isOwn,
  showAvatar,
  room,
  onReaction,
  onReply,
  onPin,
  onReport,
  canPin
}: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  const isSystem = message.type === 'system' || message.senderId === 'raftai' || message.senderId === 'system';
  const isAI = message.senderId === 'raftai' && message.type === 'aiReply';

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = typeof timestamp === 'number' ? new Date(timestamp) : timestamp.toDate?.() || new Date();
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // System messages (centered)
  if (isSystem && !isAI) {
    return (
      <div className="flex justify-center my-2">
        <div className="px-4 py-1.5 bg-white/10 rounded-full text-xs text-white/60 max-w-md text-center">
          {message.text}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className={`flex items-end gap-2 max-w-[70%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        {showAvatar && !isOwn && (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
            {message.senderAvatar ? (
              <img src={message.senderAvatar} alt="" className="w-8 h-8 rounded-full object-cover" />
            ) : (
              message.senderName.charAt(0).toUpperCase()
            )}
          </div>
        )}

        <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
          {/* Sender name (if not own and not system) */}
          {!isOwn && showAvatar && (
            <p className="text-xs text-white/60 mb-1 px-3">
              {isAI ? '🤖 RaftAI' : message.senderName}
            </p>
          )}

          {/* Message bubble - Telegram style */}
          <div
            className={`px-4 py-2 rounded-2xl ${
              isAI
                ? 'bg-blue-500/20 border border-blue-500/30 text-blue-100'
                : isOwn
                ? 'bg-blue-600 text-white'
                : 'bg-white/10 text-white'
            } ${
              message.isPinned ? 'ring-2 ring-yellow-500/50' : ''
            }`}
          >
            {/* Pinned indicator */}
            {message.isPinned && (
              <div className="text-xs text-yellow-400 mb-1">📌 Pinned</div>
            )}

            {/* Reply-to indicator */}
            {message.replyTo && (
              <div className="mb-2 pb-2 border-b border-current opacity-60 text-xs">
                <ArrowUturnLeftIcon className="w-3 h-3 inline mr-1" />
                Replying to message
              </div>
            )}

            {/* File attachment */}
            {message.file && (
              <div className="mb-2 p-2 bg-black/20 rounded-lg">
                {message.file.status === 'pending' && (
                  <div className="text-xs text-yellow-400 mb-1">
                    ⏳ Pending RaftAI review...
                  </div>
                )}
                {message.file.status === 'rejected' && (
                  <div className="text-xs text-red-400 mb-1">
                    ❌ File blocked: {message.file.reviewNote}
                  </div>
                )}
                {message.file.status === 'approved' && (
                  <>
                    {message.file.type.startsWith('image/') && message.file.url && (
                      <img 
                        src={message.file.url} 
                        alt={message.file.name}
                        className="max-w-full rounded-lg mb-2"
                      />
                    )}
                    {message.file.type.startsWith('video/') && message.file.url && (
                      <video 
                        src={message.file.url}
                        controls
                        className="max-w-full rounded-lg mb-2"
                      />
                    )}
                    {message.file.type.startsWith('audio/') && message.file.url && (
                      <audio 
                        src={message.file.url}
                        controls
                        className="w-full mb-2"
                      />
                    )}
                    <div className="text-xs opacity-75">
                      📎 {message.file.name} ({(message.file.size / 1024).toFixed(1)} KB)
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Text */}
            {message.text && (
              <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
            )}

            {/* Time - show on hover */}
            <div className="text-xs opacity-60 mt-1 text-right">
              {formatTime(message.createdAt)}
              {message.isEdited && <span className="ml-1">edited</span>}
            </div>

            {/* Reactions */}
            {message.reactions && Object.keys(message.reactions).length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2 -mb-1">
                {Object.entries(message.reactions).map(([emoji, userIds]) => (
                  <button
                    key={emoji}
                    onClick={() => onReaction(emoji)}
                    className={`text-xs px-2 py-0.5 rounded-full border transition-all ${
                      userIds.includes(message.senderId)
                        ? 'bg-blue-500 border-blue-400 text-white'
                        : 'bg-white/10 border-white/20 hover:bg-white/20'
                    }`}
                  >
                    {emoji} {userIds.length}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick actions (show on hover) */}
          {showActions && !isSystem && (
            <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <div className="flex items-center gap-0.5 bg-gray-800 rounded-lg border border-white/10 p-0.5">
                {/* Quick reaction */}
                <button
                  onClick={() => onReaction('👍')}
                  className="px-2 py-1 hover:bg-white/10 rounded text-sm"
                  title="Like"
                >
                  👍
                </button>
                
                {/* Reply */}
                <button
                  onClick={onReply}
                  className="p-1 hover:bg-white/10 rounded"
                  title="Reply"
                >
                  <ArrowUturnLeftIcon className="w-4 h-4 text-white/60" />
                </button>

                {/* More reactions */}
                <div className="relative">
                  <button
                    onClick={() => setShowReactions(!showReactions)}
                    className="p-1 hover:bg-white/10 rounded"
                    title="Add reaction"
                  >
                    <EllipsisHorizontalIcon className="w-4 h-4 text-white/60" />
                  </button>
                  
                  {showReactions && (
                    <div className="absolute bottom-full mb-1 right-0 bg-gray-800 border border-white/10 rounded-lg p-2 z-10 flex gap-1">
                      {['👍', '❤️', '😂', '🔥', '🎉', '💯'].map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => {
                            onReaction(emoji);
                            setShowReactions(false);
                          }}
                          className="p-1.5 hover:bg-white/10 rounded text-lg"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pin (owner/admin only) */}
                {canPin && (
                  <button
                    onClick={onPin}
                    className="p-1 hover:bg-white/10 rounded"
                    title={message.isPinned ? 'Unpin' : 'Pin'}
                  >
                    <span className="text-sm">{message.isPinned ? '📌' : '📍'}</span>
                  </button>
                )}

                {/* Report */}
                <button
                  onClick={onReport}
                  className="p-1 hover:bg-white/10 rounded"
                  title="Report"
                >
                  <FlagIcon className="w-4 h-4 text-white/60" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

