"use client";

import { useState, useRef, useEffect } from "react";
import { enhancedChatService } from "@/lib/chatService.enhanced";
import type { ChatMessage } from "@/lib/chatService.enhanced";
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';

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

export default function MessageBubbleTelegram({ 
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
  const [showMenu, setShowMenu] = useState(false);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);

  // Extract username from email (hide email, show username)
  const getDisplayName = (name: string) => {
    if (!name) return 'Unknown User';
    // If it's an email, extract the part before @
    if (name.includes('@')) {
      return name.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    // If it's already a username, return as is
    return name;
  };

  const displayName = getDisplayName(message.senderName);

  const handleReaction = async (emoji: string) => {
    const hasReacted = message.reactions[emoji]?.includes(currentUserId);
    if (hasReacted) {
      await enhancedChatService.removeReaction(roomId, message.id, emoji, currentUserId);
    } else {
      await enhancedChatService.addReaction(roomId, message.id, emoji, currentUserId);
    }
  };

  const handlePlayVoice = () => {
    if (!message.fileUrl) return;

    try {
      if (audioRef) {
        if (isPlayingVoice) {
          audioRef.pause();
          setIsPlayingVoice(false);
        } else {
          audioRef.play().catch(error => {
            console.error('Error playing audio:', error);
            setIsPlayingVoice(false);
          });
          setIsPlayingVoice(true);
        }
      } else {
        const audio = new Audio(message.fileUrl);
        audio.addEventListener('ended', () => setIsPlayingVoice(false));
        audio.addEventListener('error', () => {
          console.error('Error playing voice note');
          setIsPlayingVoice(false);
        });
        audio.addEventListener('loadstart', () => {
          console.log('Loading voice note...');
        });
        audio.addEventListener('canplay', () => {
          console.log('Voice note ready to play');
        });
        
        audio.play().then(() => {
          setIsPlayingVoice(true);
          setAudioRef(audio);
        }).catch(error => {
          console.error('Error starting audio playback:', error);
          setIsPlayingVoice(false);
        });
      }
    } catch (error) {
      console.error('Error in handlePlayVoice:', error);
      setIsPlayingVoice(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (fileType?: string) => {
    if (!fileType) return '📄';
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.startsWith('video/')) return '🎥';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('sheet') || fileType.includes('excel')) return '📊';
    if (fileType.includes('presentation') || fileType.includes('powerpoint')) return '📽️';
    return '📄';
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getDeliveryStatus = () => {
    // Simulate delivery status
    if (message.readBy.length > 1) {
      return <NeonCyanIcon type="check" size={16} className="text-blue-400" />; // Read
    } else if (message.readBy.length === 1) {
      return <NeonCyanIcon type="check" size={16} className="text-gray-400" />; // Delivered
    } else {
      return <NeonCyanIcon type="check" size={16} className="text-gray-400" />; // Sent
    }
  };

  const isSystemMessage = message.type === 'system' || message.senderId === 'raftai' || message.senderId === 'system';

  if (isSystemMessage) {
    return (
      <div className="flex justify-center my-2">
        <div className="bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full max-w-xs">
          <p className="text-xs text-white/70 text-center">{message.text}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group mb-1`}>
      <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
        
        {/* Sender Info (for others' messages) */}
        {!isOwn && showName && (
          <div className="flex items-center gap-2 px-2">
            {showAvatar && message.senderAvatar ? (
              <img 
                src={message.senderAvatar} 
                alt={displayName}
                className="w-5 h-5 rounded-full object-cover"
              />
            ) : showAvatar ? (
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <span className="text-white text-xs font-semibold">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              </div>
            ) : null}
            <span className="text-xs font-medium text-white/80">{displayName}</span>
          </div>
        )}

        {/* Message Container */}
        <div className="flex items-end gap-2">
          {/* Avatar (for others, only on first message in group) */}
          {!isOwn && showAvatar && isFirstInGroup && (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
              {message.senderAvatar ? (
                <img 
                  src={message.senderAvatar} 
                  alt={displayName}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <span className="text-white text-sm font-semibold">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          )}
          
          {/* Spacer for alignment when no avatar */}
          {!isOwn && (!showAvatar || !isFirstInGroup) && (
            <div className="w-8 h-8 flex-shrink-0" />
          )}

          {/* Message Bubble */}
          <div className={`relative max-w-full ${
            isOwn 
              ? 'bg-blue-600 text-white' 
              : 'bg-white/10 backdrop-blur-sm text-white'
          } rounded-2xl px-4 py-2 ${
            isFirstInGroup ? 'rounded-t-2xl' : 'rounded-t-lg'
          } ${
            isLastInGroup ? 'rounded-b-2xl' : 'rounded-b-lg'
          }`}>
            
            {/* File Attachment */}
            {((message.type === 'file' || message.type === 'video') && message.fileUrl) && (
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
                    onError={(e) => {
                      console.error('Video load error:', e);
                      // Fallback to download link if video fails to load
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement?.appendChild(
                        Object.assign(document.createElement('a'), {
                          href: message.fileUrl,
                          download: message.fileName,
                          className: 'flex items-center gap-3 p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors',
                          innerHTML: `
                            <div class="text-2xl">🎥</div>
                            <div class="flex-1 min-w-0">
                              <p class="font-medium truncate">${message.fileName}</p>
                              <p class="text-xs opacity-70">Click to download video</p>
                            </div>
                            <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                          `
                        })
                      );
                    }}
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
                    <NeonCyanIcon type="download" size={20} className="flex-shrink-0 text-white" />
                  </a>
                )}
              </div>
            )}

            {/* Voice Note */}
            {message.type === 'voice' && message.fileUrl && (
              <div className="flex items-center gap-3 mb-2 min-w-[200px]">
                <button
                  onClick={handlePlayVoice}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors flex-shrink-0"
                >
                  {isPlayingVoice ? (
                    <NeonCyanIcon type="pause" size={20} className="text-white" />
                  ) : (
                    <NeonCyanIcon type="play" size={20} className="text-white" />
                  )}
                </button>
                <div className="flex-1">
                  <div className="h-8 flex items-center gap-0.5">
                    {Array.from({ length: 40 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-1 bg-white/40 rounded-full"
                        style={{ height: `${Math.random() * 100}%` }}
                      />
                    ))}
                  </div>
                </div>
                <span className="text-xs opacity-70 flex-shrink-0">
                  {Math.round(message.voiceDuration || 0)}s
                </span>
              </div>
            )}

            {/* Text */}
            <p className="whitespace-pre-wrap break-words leading-relaxed">{message.text}</p>

            {/* Timestamp and Status */}
            <div className={`flex items-center gap-1 mt-1 ${
              isOwn ? 'justify-end' : 'justify-start'
            }`}>
              <span className={`text-xs ${
                isOwn ? 'text-white/70' : 'text-white/50'
              }`}>
                {formatTime(message.createdAt)}
              </span>
              {isOwn && getDeliveryStatus()}
            </div>

            {/* Context Menu */}
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
                  <NeonCyanIcon type="arrow-left" size={16} className="text-white" />
                </button>

                {/* More Menu */}
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1.5 hover:bg-white/10 rounded transition-colors"
                >
                  <NeonCyanIcon type="ellipsis" size={16} className="text-white" />
                </button>
              </div>
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
