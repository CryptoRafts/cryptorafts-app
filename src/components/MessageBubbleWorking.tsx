"use client";

import React, { useState, useRef } from "react";
import { enhancedChatService } from "@/lib/chatService.enhanced";
import type { ChatMessage } from "@/lib/chatService.enhanced";
import NeonCyanIcon from '@/components/icons/NeonCyanIcon';

interface Props {
  message: ChatMessage;
  isOwn: boolean;
  onReply: () => void;
  roomId: string;
  currentUserId: string;
  showAvatar?: boolean;
  showName?: boolean;
  isFirstInGroup?: boolean;
  isLastInGroup?: boolean;
}

function MessageBubbleWorkingComponent({ 
  message, 
  isOwn, 
  onReply, 
  roomId, 
  currentUserId,
  showAvatar = false,
  showName = false,
  isFirstInGroup = true,
  isLastInGroup = true
}: Props) {
  // Validate props early - return null if invalid
  if (!message || typeof message !== 'object' || !message.id) {
    console.warn('MessageBubbleWorking: Invalid message prop', message);
    return null;
  }

  // Ensure onReply is a function
  const safeOnReply = typeof onReply === 'function' ? onReply : (() => {});
  
  // Ensure all required props are strings/booleans
  if (typeof roomId !== 'string' || typeof currentUserId !== 'string') {
    console.warn('MessageBubbleWorking: Invalid roomId or currentUserId', { roomId, currentUserId });
    return null;
  }

  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);

  // Extract username from email (hide email, show username)
  const getDisplayName = (name: any): string => {
    if (!name) return 'Unknown User';
    const nameStr = typeof name === 'string' ? name : String(name || 'Unknown User');
    if (nameStr.includes('@')) {
      return nameStr.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    return nameStr;
  };

  const displayName = getDisplayName(message.senderName || message.senderId || 'Unknown User');

  const handlePlayVoice = () => {
    const audioUrl = message.fileUrl || message.voiceUrl;
    if (!audioUrl) return;

    try {
      if (audioRef) {
        if (isPlayingVoice) {
          audioRef.pause();
          setIsPlayingVoice(false);
        } else {
          audioRef.play();
          setIsPlayingVoice(true);
        }
      } else {
        const audio = new Audio(audioUrl);
        audio.addEventListener('ended', () => setIsPlayingVoice(false));
        audio.addEventListener('error', () => {
          console.error('Error playing voice note');
          setIsPlayingVoice(false);
        });
        
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlayingVoice(true);
              setAudioRef(audio);
            })
            .catch((error: any) => {
              console.error('Error starting audio:', error);
              setIsPlayingVoice(false);
              setAudioRef(null);
            });
        } else {
          // Fallback for browsers that don't return a promise
          setIsPlayingVoice(true);
          setAudioRef(audio);
        }
      }
    } catch (error) {
      console.error('Error in handlePlayVoice:', error);
      setIsPlayingVoice(false);
    }
  };

  const getFileIcon = (fileType?: string) => {
    if (!fileType) return '📄';
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.startsWith('video/')) return '🎥';
    if (fileType.startsWith('audio/')) return '🎵';
    if (fileType.includes('pdf')) return '📕';
    if (fileType.includes('word') || fileType.includes('doc')) return '📘';
    if (fileType.includes('excel') || fileType.includes('sheet')) return '📗';
    if (fileType.includes('zip') || fileType.includes('rar')) return '📦';
    return '📄';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const isSystemMessage = message.type === 'system' || message.senderId === 'raftai' || message.senderId === 'system';

  if (isSystemMessage) {
    return (
      <div className="flex justify-center my-2">
        <div className="px-3 py-1 bg-yellow-600/20 text-yellow-400 text-sm rounded-full">
          {message.text}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1`}>
      <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
        
        {/* Sender Info (for others' messages) */}
        {!isOwn && showName && (
          <div className="flex items-center gap-2 px-2">
            {showAvatar && (
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <span className="text-white text-xs font-semibold">
                  {typeof displayName === 'string' && displayName.length > 0 ? displayName.charAt(0).toUpperCase() : 'U'}
                </span>
              </div>
            )}
            <span className="text-xs font-medium text-white/80">{displayName}</span>
          </div>
        )}

        {/* Message Container */}
        <div className="flex items-end gap-2">
          {/* Avatar (for others, only on first message in group) */}
          {!isOwn && showAvatar && isFirstInGroup && (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {message.senderAvatar && typeof message.senderAvatar === 'string' && message.senderAvatar.startsWith('http') ? (
                <img 
                  src={message.senderAvatar} 
                  alt={displayName}
                  className="w-8 h-8 rounded-full object-cover"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    img.style.display = 'none';
                    const fallback = img.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              ) : null}
              <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0 ${message.senderAvatar && typeof message.senderAvatar === 'string' && message.senderAvatar.startsWith('http') ? 'hidden' : ''}`}>
                <span className="text-white text-sm font-semibold">
                  {typeof displayName === 'string' && displayName.length > 0 ? displayName.charAt(0).toUpperCase() : 'U'}
                </span>
              </div>
            </div>
          )}
          
          {/* Spacer for alignment when no avatar */}
          {!isOwn && (!showAvatar || !isFirstInGroup) && (
            <div className="w-8 h-8 flex-shrink-0" />
          )}

          {/* Message Bubble */}
          <div className={`px-4 py-2 ${
            isOwn 
              ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/20' 
              : 'bg-white/5 backdrop-blur-sm text-white border border-cyan-400/20'
          } rounded-2xl ${
            isFirstInGroup ? 'rounded-t-2xl' : 'rounded-t-lg'
          } ${
            isLastInGroup ? 'rounded-b-2xl' : 'rounded-b-lg'
          }`}>
            
          {/* File Attachment */}
          {message.type === 'file' && message.fileUrl && (
            <div className="mb-2">
              {message.fileType?.startsWith('image/') ? (
                <div className="max-w-xs">
                  <img 
                    src={message.fileUrl} 
                    alt={message.fileName || 'Image'}
                    className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                    style={{ maxHeight: '300px' }}
                    onClick={() => {
                      if (message.fileUrl) {
                        // Open image in new tab
                        window.open(message.fileUrl, '_blank');
                      }
                    }}
                    onError={(e) => {
                      console.error('Image load error:', e);
                      const img = e.target as HTMLImageElement;
                      img.style.display = 'none';
                    }}
                  />
                  {message.fileName && (
                    <p className="text-xs opacity-70 mt-1 truncate">{message.fileName}</p>
                  )}
                </div>
              ) : message.fileType?.startsWith('video/') ? (
                <div className="max-w-xs">
                  <video 
                    src={message.fileUrl}
                    controls
                    className="max-w-full rounded-lg"
                    style={{ maxHeight: '300px' }}
                    onError={(e) => {
                      console.error('Video load error:', e);
                      const video = e.target as HTMLVideoElement;
                      video.style.display = 'none';
                    }}
                  >
                    Your browser does not support the video tag.
                  </video>
                  {message.fileName && (
                    <p className="text-xs opacity-70 mt-1 truncate">{message.fileName}</p>
                  )}
                </div>
              ) : (
                <div 
                  className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-cyan-400/20 hover:bg-cyan-500/10 hover:border-cyan-400/40 transition-colors cursor-pointer"
                  onClick={() => {
                    if (message.fileUrl) {
                      // Try to open/download the file
                      const link = document.createElement('a');
                      link.href = message.fileUrl;
                      link.download = message.fileName || 'document';
                      link.target = '_blank';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }
                  }}
                >
                  <div className="text-2xl">{getFileIcon(message.fileType)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{message.fileName || 'Document'}</p>
                    {message.fileSize && (
                      <p className="text-xs opacity-70">{formatFileSize(message.fileSize)}</p>
                    )}
                  </div>
                  <NeonCyanIcon type="download" size={20} className="flex-shrink-0" />
                </div>
              )}
            </div>
          )}

            {/* Voice Note */}
            {message.type === 'voice' && (message.fileUrl || message.voiceUrl) && (
              <div className="flex items-center gap-3 mb-2 min-w-[200px]">
                <button
                  onClick={handlePlayVoice}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors flex-shrink-0"
                  title={isPlayingVoice ? 'Pause voice note' : 'Play voice note'}
                >
                  {isPlayingVoice ? (
                    <NeonCyanIcon type="pause" size={20} className="text-white" />
                  ) : (
                    <NeonCyanIcon type="play" size={20} className="text-white" />
                  )}
                </button>
                <div className="flex-1">
                  <div className="h-8 flex items-center gap-0.5">
                    {/* Simple waveform visualization */}
                    {Array.from({ length: 20 }, (_, i) => (
                      <div
                        key={i}
                        className={`w-1 bg-white/40 rounded-full ${
                          isPlayingVoice ? 'animate-pulse' : ''
                        }`}
                        style={{ 
                          height: `${Math.random() * 20 + 8}px`,
                          animationDelay: `${i * 50}ms`
                        }}
                      />
                    ))}
                  </div>
                  <p className="text-xs opacity-70 mt-1">
                    Voice message {message.voiceDuration ? `(${Math.round(message.voiceDuration)}s)` : ''}
                  </p>
                </div>
                {/* Download button for voice notes */}
                <button
                  onClick={() => {
                    const audioUrl = message.fileUrl || message.voiceUrl;
                    if (audioUrl) {
                      const link = document.createElement('a');
                      link.href = audioUrl;
                      link.download = `voice-note-${message.id}.webm`;
                      link.target = '_blank';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }
                  }}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                  title="Download voice note"
                >
                  <NeonCyanIcon type="download" size={16} className="text-white" />
                </button>
              </div>
            )}

            {/* Message Text - Only show if not a file message, but show for voice */}
            {message.text && message.type !== 'file' && (
              <div className="whitespace-pre-wrap break-words">
                {message.text}
              </div>
            )}

            {/* Message Time */}
            <div className={`text-xs mt-1 ${
              isOwn ? 'text-blue-100' : 'text-white/50'
            }`}>
              {(() => {
                try {
                  if (!message.createdAt) return '';
                  // FIXED: Safely convert timestamp - handle all formats
                  const safeToDate = (timestamp: any): Date => {
                    if (!timestamp) return new Date();
                    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
                      return timestamp.toDate();
                    }
                    if (typeof timestamp === 'number') {
                      return new Date(timestamp);
                    }
                    if (timestamp instanceof Date) {
                      return timestamp;
                    }
                    try {
                      return new Date(timestamp);
                    } catch {
                      return new Date();
                    }
                  };
                  const date = safeToDate(message.createdAt);
                  if (isNaN(date.getTime())) return '';
                  return date.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
                  });
                } catch (e) {
                  return '';
                }
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Export the component directly without memo to avoid React rendering issues
// Memoization can cause issues in production builds
export default MessageBubbleWorkingComponent;
