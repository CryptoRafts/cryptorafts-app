"use client";

import { useState, useEffect } from "react";
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';
import type { ChatMessage } from "@/lib/chatService.enhanced";

interface Props {
  pinnedMessages: ChatMessage[];
  onUnpin: (messageId: string) => void;
  onJumpToMessage: (messageId: string) => void;
}

export default function PinnedMessagesBanner({ pinnedMessages, onUnpin, onJumpToMessage }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (pinnedMessages.length === 0) return null;

  const currentMessage = pinnedMessages[currentIndex];

  const nextMessage = () => {
    setCurrentIndex((prev) => (prev + 1) % pinnedMessages.length);
  };

  const prevMessage = () => {
    setCurrentIndex((prev) => (prev - 1 + pinnedMessages.length) % pinnedMessages.length);
  };

  const formatMessage = (message: ChatMessage) => {
    if (message.text.length > 100) {
      return message.text.substring(0, 100) + '...';
    }
    return message.text;
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="bg-blue-600/20 border-b border-blue-500/30 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-shrink-0">
            <NeonCyanIcon type="flag" size={16} className="text-blue-400" />
            <span className="text-xs font-medium text-blue-300">
              Pinned Message {pinnedMessages.length > 1 ? `${currentIndex + 1}/${pinnedMessages.length}` : ''}
            </span>
          </div>

          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white truncate">
                  {currentMessage.senderName}
                </span>
                <span className="text-xs text-blue-300 flex-shrink-0">
                  {formatTime(currentMessage.createdAt)}
                </span>
              </div>
              <p className="text-sm text-blue-100 truncate">
                {formatMessage(currentMessage)}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {!isCollapsed && pinnedMessages.length > 1 && (
            <>
              <button
                onClick={prevMessage}
                className="p-1 hover:bg-blue-500/30 rounded transition-colors"
                title="Previous pinned message"
              >
                <NeonCyanIcon type="arrow-left" size={16} className="text-blue-300" />
              </button>
              <button
                onClick={nextMessage}
                className="p-1 hover:bg-blue-500/30 rounded transition-colors"
                title="Next pinned message"
              >
                <NeonCyanIcon type="arrow-right" size={16} className="text-blue-300" />
              </button>
            </>
          )}

          {!isCollapsed && (
            <button
              onClick={() => onJumpToMessage(currentMessage.id)}
              className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
              title="Jump to message"
            >
              Jump
            </button>
          )}

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 hover:bg-blue-500/30 rounded transition-colors"
            title={isCollapsed ? 'Expand' : 'Collapse'}
          >
            {isCollapsed ? (
              <NeonCyanIcon type="chevron-down" size={16} className="text-blue-300" />
            ) : (
              <NeonCyanIcon type="chevron-down" size={16} className="text-blue-300 rotate-180" />
            )}
          </button>

          <button
            onClick={() => onUnpin(currentMessage.id)}
            className="p-1 hover:bg-red-500/30 rounded transition-colors"
            title="Unpin message"
          >
            <NeonCyanIcon type="close" size={16} className="text-red-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
