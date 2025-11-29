"use client";

import { useState } from "react";
import { enhancedChatService } from "@/lib/chatService.enhanced";
import type { ChatMessage } from "@/lib/chatService.enhanced";
import {
  ArrowUturnLeftIcon,
  EllipsisHorizontalIcon,
  DocumentIcon,
  PlayIcon,
  PauseIcon,
  ArrowDownTrayIcon
} from "@heroicons/react/24/outline";

interface Props {
  message: ChatMessage;
  isOwn: boolean;
  onReply: () => void;
  roomId: string;
  currentUserId: string;
}

export default function MessageBubbleEnhanced({ message, isOwn, onReply, roomId, currentUserId }: Props) {
  const [showMenu, setShowMenu] = useState(false);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);

  const handleReaction = async (emoji: string) => {
    const hasReacted = message.reactions[emoji]?.includes(currentUserId);
    if (hasReacted) {
      await enhancedChatService.removeReaction(roomId, message.id, emoji, currentUserId);
    } else {
      await enhancedChatService.addReaction(roomId, message.id, emoji, currentUserId);
    }
  };

  const handlePlayVoice = () => {
    if (!message.voiceUrl) return;

    if (audioRef) {
      if (isPlayingVoice) {
        audioRef.pause();
        setIsPlayingVoice(false);
      } else {
        audioRef.play();
        setIsPlayingVoice(true);
      }
    } else {
      const audio = new Audio(message.voiceUrl);
      audio.addEventListener('ended', () => setIsPlayingVoice(false));
      audio.addEventListener('error', () => {
        console.error('Error playing voice note');
        setIsPlayingVoice(false);
      });
      audio.play();
      setIsPlayingVoice(true);
      setAudioRef(audio);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (fileType?: string) => {
    if (!fileType) return <DocumentIcon className="w-8 h-8" />;
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.startsWith('video/')) return '🎥';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('sheet') || fileType.includes('excel')) return '📊';
    if (fileType.includes('presentation') || fileType.includes('powerpoint')) return '📽️';
    return <DocumentIcon className="w-8 h-8" />;
  };

  const isSystemMessage = message.type === 'system' || message.senderId === 'raftai' || message.senderId === 'system';

  if (isSystemMessage) {
    return (
      <div className="flex justify-center my-4">
        <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
          <p className="text-xs text-white/70 text-center">{message.text}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}>
      <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        {/* Sender Info */}
        {!isOwn && (
          <div className="flex items-center gap-2 px-2">
            {message.senderAvatar ? (
              <img 
                src={message.senderAvatar} 
                alt={message.senderName}
                className="w-6 h-6 rounded-full object-cover"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <span className="text-white text-xs font-semibold">
                  {message.senderName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <span className="text-xs font-medium text-white/80">{message.senderName}</span>
          </div>
        )}

        {/* Message Bubble */}
        <div className={`relative px-4 py-2 rounded-2xl ${
          isOwn 
            ? 'bg-blue-600 text-white' 
            : 'bg-white/10 backdrop-blur-sm text-white'
        }`}>
          {/* File Attachment */}
          {message.type === 'file' && message.fileUrl && (
            <div className="mb-2">
              {message.fileType?.startsWith('image/') ? (
                <a href={message.fileUrl} target="_blank" rel="noopener noreferrer">
                  <img 
                    src={message.fileUrl} 
                    alt={message.fileName}
                    className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                    style={{ maxHeight: '300px' }}
                  />
                </a>
              ) : message.fileType?.startsWith('video/') ? (
                <video 
                  src={message.fileUrl}
                  controls
                  className="max-w-full rounded-lg"
                  style={{ maxHeight: '300px' }}
                />
              ) : (
                <a 
                  href={message.fileUrl} 
                  download={message.fileName}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                >
                  <div className="text-2xl">{getFileIcon(message.fileType)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{message.fileName}</p>
                    <p className="text-xs opacity-70">{message.fileSize && formatFileSize(message.fileSize)}</p>
                  </div>
                  <ArrowDownTrayIcon className="w-5 h-5 flex-shrink-0" />
                </a>
              )}
            </div>
          )}

          {/* Voice Note */}
          {message.type === 'voice' && message.voiceUrl && (
            <div className="flex items-center gap-3 mb-2">
              <button
                onClick={handlePlayVoice}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
              >
                {isPlayingVoice ? (
                  <PauseIcon className="w-5 h-5" />
                ) : (
                  <PlayIcon className="w-5 h-5" />
                )}
              </button>
              <div className="flex-1">
                <div className="h-8 flex items-center gap-0.5">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-white/40 rounded-full"
                      style={{ height: `${Math.random() * 100}%` }}
                    />
                  ))}
                </div>
              </div>
              <span className="text-xs opacity-70">
                {Math.round(message.voiceDuration || 0)}s
              </span>
            </div>
          )}

          {/* Text */}
          <p className="whitespace-pre-wrap break-words">{message.text}</p>

          {/* Timestamp */}
          <p className={`text-xs mt-1 ${isOwn ? 'text-white/70' : 'text-white/50'}`}>
            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>

          {/* Actions Menu */}
          <div className="absolute -top-8 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-gray-800 border border-white/10 rounded-lg shadow-xl flex items-center gap-1 p-1">
              {/* Quick Reactions */}
              {['👍', '❤️', '😊', '🎉'].map(emoji => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className="hover:scale-125 transition-transform p-1"
                >
                  {emoji}
                </button>
              ))}
              
              {/* Reply */}
              <button
                onClick={onReply}
                className="p-1.5 hover:bg-white/10 rounded transition-colors"
                title="Reply"
              >
                <ArrowUturnLeftIcon className="w-4 h-4 text-white" />
              </button>

              {/* More Menu */}
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 hover:bg-white/10 rounded transition-colors"
              >
                <EllipsisHorizontalIcon className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Reactions */}
        {Object.keys(message.reactions).length > 0 && (
          <div className="flex flex-wrap gap-1 px-2">
            {Object.entries(message.reactions).map(([emoji, users]) => 
              users.length > 0 && (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 transition-all ${
                    users.includes(currentUserId)
                      ? 'bg-blue-600 text-white'
                      : 'bg-white/10 text-white/80 hover:bg-white/20'
                  }`}
                >
                  <span>{emoji}</span>
                  <span>{users.length}</span>
                </button>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}

