"use client";

import { useState, useEffect, useRef } from "react";
import { enhancedChatService } from "@/lib/chatService.enhanced";
import type { ChatRoom, ChatMessage } from "@/lib/chatService.enhanced";
import MessageBubbleTelegram from "./MessageBubbleTelegram";
import VoiceRecorderFixed from "./VoiceRecorderFixed";
import PinnedMessagesBanner from "./PinnedMessagesBanner";
import { 
  PaperAirplaneIcon, 
  PaperClipIcon, 
  MicrophoneIcon,
  MagnifyingGlassIcon,
  EllipsisHorizontalIcon,
  BellIcon,
  BellSlashIcon,
  MapPinIcon,
  UserPlusIcon,
  PhotoIcon,
  VideoCameraIcon,
  DocumentIcon,
  FaceSmileIcon
} from "@heroicons/react/24/outline";

interface Props {
  room: ChatRoom | null;
  currentUserId: string;
  onBack: () => void;
}

interface DaySection {
  date: string;
  messages: ChatMessage[];
}

export default function ChatInterfaceTelegram({ room, currentUserId, onBack }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState<ChatMessage[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Group messages by day and sender for Telegram-like display
  const groupMessagesByDay = (messages: ChatMessage[]): DaySection[] => {
    const groups: { [date: string]: ChatMessage[] } = {};
    
    messages.forEach(message => {
      const date = new Date(message.createdAt).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });

    return Object.entries(groups)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([date, msgs]) => ({
        date,
        messages: msgs.sort((a, b) => a.createdAt - b.createdAt)
      }));
  };

  // Determine if messages should be grouped together
  const shouldGroupWithNext = (current: ChatMessage, next: ChatMessage | undefined): boolean => {
    if (!next) return false;
    if (current.senderId !== next.senderId) return false;
    
    const timeDiff = next.createdAt - current.createdAt;
    return timeDiff < 120000; // 2 minutes
  };

  const shouldGroupWithPrev = (current: ChatMessage, prev: ChatMessage | undefined): boolean => {
    if (!prev) return false;
    if (current.senderId !== prev.senderId) return false;
    
    const timeDiff = current.createdAt - prev.createdAt;
    return timeDiff < 120000; // 2 minutes
  };

  const formatDayHeader = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString([], { 
        weekday: 'long',
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  // Subscribe to messages
  useEffect(() => {
    if (!room) return;

    const unsubscribe = enhancedChatService.subscribeToMessages(
      room.id,
      (newMessages) => {
        // Extract pinned messages
        const pinned = newMessages.filter(msg => msg.isPinned);
        setPinnedMessages(pinned);
        
        console.log(`💬 [TELEGRAM] ${newMessages.length} messages loaded (${pinned.length} pinned)`);
        setMessages(newMessages);
        
        // Auto-scroll to bottom with smooth animation
        setTimeout(() => {
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ 
              behavior: 'smooth',
              block: 'end'
            });
          }
        }, 100);
      }
    );

    return unsubscribe;
  }, [room]);

  // Subscribe to typing indicators
  useEffect(() => {
    if (!room) return;

    const unsubscribe = enhancedChatService.subscribeToTyping(room.id, (users) => {
      setTypingUsers(users.filter(id => id !== currentUserId));
    });

    return unsubscribe;
  }, [room, currentUserId]);

  const sendMessage = async () => {
    if (!room || !text.trim()) return;

    const messageText = text.trim();
    setText("");
    
    try {
      await enhancedChatService.sendMessage({
        roomId: room.id,
        userId: currentUserId,
        userName: room.memberNames?.[currentUserId] || 'Unknown',
        userAvatar: room.memberAvatars?.[currentUserId] || undefined,
        text: messageText
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleVoiceSend = async (audioBlob: Blob, duration: number) => {
    if (!room) return;

    try {
      // Upload voice note
      const formData = new FormData();
      formData.append('file', audioBlob, 'voice-note.webm');
      formData.append('roomId', room.id);
      formData.append('senderId', currentUserId);
      formData.append('senderName', room.memberNames?.[currentUserId] || 'Unknown');
      formData.append('senderAvatar', room.memberAvatars?.[currentUserId] || '');
      formData.append('type', 'voice');
      formData.append('duration', duration.toString());

      const response = await fetch('/api/chat/upload-file', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to send voice note');
      }

      const result = await response.json();
      console.log('✅ Voice note sent:', result.messageId);
    } catch (error) {
      console.error('Error sending voice note:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleTyping = () => {
    if (!room) return;
    
    setIsTyping(true);
    
    // Send typing indicator
    enhancedChatService.setTyping(room.id, currentUserId, true);
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Stop typing after 3 seconds
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      enhancedChatService.setTyping(room.id, currentUserId, false);
    }, 3000);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    // TODO: Implement actual mute functionality
  };

  const handleSearch = () => {
    setShowSearch(!showSearch);
    if (!showSearch) {
      setSearchQuery("");
    }
  };

  const filteredMessages = messages.filter(message => 
    searchQuery === "" || 
    message.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
    message.senderName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const daySections = groupMessagesByDay(filteredMessages);

  if (!room) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">💬</div>
          <h2 className="text-xl font-semibold text-white mb-2">No Chat Selected</h2>
          <p className="text-white/60">Select a chat to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-gray-800/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors lg:hidden"
          >
            ←
          </button>
          
          {/* Group Avatar */}
          <div className="relative">
            {room.groupAvatar ? (
              <img 
                src={room.groupAvatar} 
                alt={room.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <span className="text-white font-semibold">
                  {room?.name?.charAt(0)?.toUpperCase() || 'C'}
                </span>
              </div>
            )}
            {!isMuted && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-800" />
            )}
          </div>

          <div>
            <h2 className="font-semibold text-white">{room.name}</h2>
            <p className="text-sm text-white/60">
              {room.members.length} member{room.members.length !== 1 ? 's' : ''}
              {typingUsers.length > 0 && (
                <span className="text-blue-400">
                  • {typingUsers.length === 1 ? 'typing...' : `${typingUsers.length} typing...`}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <button
            onClick={handleSearch}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <MagnifyingGlassIcon className="w-5 h-5 text-white" />
          </button>

          {/* Mute/Unmute */}
          <button
            onClick={toggleMute}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            {isMuted ? (
              <BellSlashIcon className="w-5 h-5 text-red-400" />
            ) : (
              <BellIcon className="w-5 h-5 text-white" />
            )}
          </button>

          {/* More Menu */}
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <EllipsisHorizontalIcon className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className="p-4 border-b border-white/10">
          <input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
          />
        </div>
      )}

      {/* Pinned Messages Banner */}
      {pinnedMessages.length > 0 && (
        <PinnedMessagesBanner
          pinnedMessages={pinnedMessages}
          onUnpin={async (messageId) => {
            try {
              await enhancedChatService.unpinMessage(room.id, messageId);
            } catch (error) {
              console.error('Error unpinning message:', error);
            }
          }}
          onJumpToMessage={(messageId) => {
            // Scroll to message
            const messageElement = document.getElementById(`message-${messageId}`);
            if (messageElement) {
              messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }}
        />
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {daySections.map((section, sectionIndex) => (
          <div key={section.date}>
            {/* Day Header */}
            <div className="flex items-center justify-center my-4">
              <div className="bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full">
                <span className="text-xs font-medium text-white/70">
                  {formatDayHeader(section.date)}
                </span>
              </div>
            </div>

            {/* Messages for this day */}
            {section.messages.map((message, messageIndex) => {
              const prevMessage = messageIndex > 0 ? section.messages[messageIndex - 1] : undefined;
              const nextMessage = messageIndex < section.messages.length - 1 ? section.messages[messageIndex + 1] : undefined;
              
              const isOwn = message.senderId === currentUserId;
              const showAvatar = !isOwn && !shouldGroupWithPrev(message, prevMessage);
              const showName = !isOwn && !shouldGroupWithPrev(message, prevMessage);
              const isFirstInGroup = !shouldGroupWithPrev(message, prevMessage);
              const isLastInGroup = !shouldGroupWithNext(message, nextMessage);

              return (
                <div key={message.id} id={`message-${message.id}`}>
                  <MessageBubbleTelegram
                    message={message}
                    isOwn={isOwn}
                    onReply={() => {}}
                    roomId={room.id}
                    currentUserId={currentUserId}
                    showAvatar={showAvatar}
                    showName={showName}
                    isFirstInGroup={isFirstInGroup}
                    isLastInGroup={isLastInGroup}
                  />
                </div>
              );
            })}
          </div>
        ))}

        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <div className="flex justify-start">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2 max-w-xs">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
                <span className="text-xs text-white/70">
                  {typingUsers.length === 1 ? 'typing...' : `${typingUsers.length} typing...`}
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-white/10 bg-gray-800/50 backdrop-blur-sm">
        <div className="flex items-end gap-3">
          {/* Attachment Button */}
          <button className="p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0">
            <PaperClipIcon className="w-5 h-5 text-white" />
          </button>

          {/* Text Input */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                handleTyping();
              }}
              onKeyPress={handleKeyPress}
              placeholder={`Message ${room.name}...`}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/50 focus:outline-none focus:border-blue-500 resize-none min-h-[44px] max-h-32"
              rows={1}
              style={{
                height: 'auto',
                overflow: 'hidden'
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = target.scrollHeight + 'px';
              }}
            />
          </div>

          {/* Emoji Button */}
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
          >
            <FaceSmileIcon className="w-5 h-5 text-white" />
          </button>

          {/* Voice/Send Button */}
          {text.trim() ? (
            <button
              onClick={sendMessage}
              className="p-2 bg-blue-600 hover:bg-blue-700 rounded-full transition-colors flex-shrink-0"
            >
              <PaperAirplaneIcon className="w-5 h-5 text-white" />
            </button>
          ) : (
            <button
              onClick={() => setShowVoiceRecorder(true)}
              className="p-2 hover:bg-white/10 rounded-full transition-colors flex-shrink-0"
            >
              <MicrophoneIcon className="w-5 h-5 text-white" />
            </button>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 mt-2">
          <button className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
            <PhotoIcon className="w-4 h-4 text-white" />
          </button>
          <button className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
            <VideoCameraIcon className="w-4 h-4 text-white" />
          </button>
          <button className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
            <DocumentIcon className="w-4 h-4 text-white" />
          </button>
          <button className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
            <UserPlusIcon className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Voice Recorder Modal */}
      {showVoiceRecorder && (
        <VoiceRecorderFixed
          onSend={handleVoiceSend}
          onClose={() => setShowVoiceRecorder(false)}
        />
      )}
    </div>
  );
}
