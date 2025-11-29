"use client";

import { useState } from "react";
import type { ChatMessage } from "@/lib/chatService.production";
import { ArrowUturnLeftIcon, FlagIcon, EllipsisHorizontalIcon } from "@heroicons/react/24/outline";

interface Props {
  message: ChatMessage;
  isOwn: boolean;
  showAvatar: boolean;
  canPin: boolean;
  onReaction: (emoji: string) => void;
  onReply: () => void;
  onPin: () => void;
  onReport: () => void;
}

export default function MessageBubbleProduction({ message, isOwn, showAvatar, canPin, onReaction, onReply, onPin, onReport }: Props) {
  const [showActions, setShowActions] = useState(false);

  const isSystem = message.type === 'system' || message.senderId === 'raftai' || message.senderId === 'system';
  const isAI = message.senderId === 'raftai' && message.type === 'aiReply';

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate?.() || (typeof timestamp === 'number' ? new Date(timestamp) : new Date());
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

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
          {!isOwn && showAvatar && (
            <p className="text-xs text-white/60 mb-1 px-3">
              {isAI ? '🤖 RaftAI' : message.senderName}
            </p>
          )}

          <div className={`px-4 py-2 rounded-2xl ${
            isAI ? 'bg-blue-500/20 border border-blue-500/30 text-blue-100' :
            isOwn ? 'bg-blue-600 text-white' : 'bg-white/10 text-white'
          } ${message.isPinned ? 'ring-2 ring-yellow-500/50' : ''}`}>
            {message.isPinned && (
              <div className="text-xs text-yellow-400 mb-1">📌 Pinned</div>
            )}

            {message.replyTo && (
              <div className="mb-2 pb-2 border-b border-current opacity-60 text-xs">
                <ArrowUturnLeftIcon className="w-3 h-3 inline mr-1" />
                Replying to message
              </div>
            )}

            {message.text && (
              <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
            )}

            <div className="text-xs opacity-60 mt-1 text-right">
              {formatTime(message.createdAt)}
              {message.isEdited && <span className="ml-1">edited</span>}
            </div>

            {message.reactions && Object.keys(message.reactions).length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2 -mb-1">
                {Object.entries(message.reactions).map(([emoji, userIds]) => (
                  <button
                    key={emoji}
                    onClick={() => onReaction(emoji)}
                    className={`text-xs px-2 py-0.5 rounded-full border ${
                      userIds.includes(message.senderId) ? 'bg-blue-500 border-blue-400' : 'bg-white/10 border-white/20 hover:bg-white/20'
                    }`}
                  >
                    {emoji} {userIds.length}
                  </button>
                ))}
              </div>
            )}
          </div>

          {showActions && !isSystem && (
            <div className={`flex items-center gap-1 mt-1`}>
              <div className="flex items-center gap-0.5 bg-gray-800 rounded-lg border border-white/10 p-0.5">
                <button onClick={() => onReaction('👍')} className="px-2 py-1 hover:bg-white/10 rounded text-sm">👍</button>
                <button onClick={onReply} className="p-1 hover:bg-white/10 rounded" title="Reply">
                  <ArrowUturnLeftIcon className="w-4 h-4 text-white/60" />
                </button>
                {canPin && (
                  <button onClick={onPin} className="p-1 hover:bg-white/10 rounded" title="Pin">
                    <span className="text-sm">{message.isPinned ? '📌' : '📍'}</span>
                  </button>
                )}
                <button onClick={onReport} className="p-1 hover:bg-white/10 rounded" title="Report">
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

