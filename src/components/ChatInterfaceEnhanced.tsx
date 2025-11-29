"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { enhancedChatService } from "@/lib/chatService.enhanced";
import type { ChatRoom, ChatMessage } from "@/lib/chatService.enhanced";
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';
import MessageBubbleEnhanced from "./MessageBubbleEnhanced";
import FileUploadModal from "./FileUploadModal";
import VoiceRecorder from "./VoiceRecorder";
import InviteLinkModal from "./InviteLinkModal";
import ReminderModal from "./ReminderModal";
import MilestoneModal from "./MilestoneModal";
import GroupAvatarModal from "./GroupAvatarModal";

interface Props {
  roomId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  userRole: string;
  onClose?: () => void;
}

export default function ChatInterfaceEnhanced({ roomId, userId, userName, userAvatar, userRole, onClose }: Props) {
  const router = useRouter();
  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showInviteLink, setShowInviteLink] = useState(false);
  const [showReminder, setShowReminder] = useState(false);
  const [showMilestone, setShowMilestone] = useState(false);
  const [showGroupAvatar, setShowGroupAvatar] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load room
  useEffect(() => {
    let mounted = true;
    enhancedChatService.getRoom(roomId).then(roomData => {
      if (mounted && roomData) {
        setRoom(roomData);
        setLoading(false);
      }
    });
    return () => { mounted = false; };
  }, [roomId]);

  // Subscribe to messages
  useEffect(() => {
    const unsubscribe = enhancedChatService.subscribeToMessages(roomId, (msgs) => {
      setMessages(msgs);
      // Auto-scroll to bottom after messages update
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      });
    });
    return unsubscribe;
  }, [roomId]);

  const playNotificationSound = () => {
    // Disabled notification sound to avoid 404 errors
    // Users can enable browser notifications instead
    return;
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || !room) return;

    const text = newMessage.trim();
    setNewMessage("");
    setReplyingTo(null);

    try {
      await enhancedChatService.sendMessage({
        roomId,
        userId,
        userName,
        userAvatar,
        text,
        replyTo: replyingTo?.id
      });
    } catch (error) {
      console.error('Error sending:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !room) return;

    // Check file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      alert('File too large! Max size is 100MB');
      return;
    }

    // Confirmation before sending
    const confirmed = window.confirm(`Send ${file.name}?`);
    if (!confirmed) {
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      await enhancedChatService.sendFileMessage({
        roomId,
        userId,
        userName,
        userAvatar,
        file
      });
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      console.error('Error sending file:', error);
      alert('Failed to send file');
    }
  };

  const handleVoiceNote = async (audioBlob: Blob, duration: number) => {
    try {
      await enhancedChatService.sendVoiceNote({
        roomId,
        userId,
        userName,
        userAvatar,
        audioBlob,
        duration
      });
      setShowVoiceRecorder(false);
    } catch (error) {
      console.error('Error sending voice note:', error);
      alert('Failed to send voice note');
    }
  };

  const handleToggleMute = async () => {
    if (!room) return;
    
    const isMuted = room.mutedBy?.includes(userId);
    if (isMuted) {
      await enhancedChatService.unmuteChat(roomId, userId);
    } else {
      await enhancedChatService.muteChat(roomId, userId);
    }
  };

  const handleBackToDashboard = () => {
    if (userRole === 'founder') {
      router.push('/founder/dashboard');
    } else if (userRole === 'vc') {
      router.push('/vc/dashboard');
    } else if (userRole === 'exchange') {
      router.push('/exchange/dashboard');
    } else if (userRole === 'admin') {
      router.push('/admin/dashboard');
    } else {
      router.push('/dashboard');
    }
  };

  const isOwnerOrAdmin = room?.memberRoles[userId] === 'owner' || room?.memberRoles[userId] === 'admin';
  const isMuted = room?.mutedBy?.includes(userId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-white/5 backdrop-blur-lg rounded-lg border border-white/10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-white/5 backdrop-blur-lg rounded-lg border border-white/10">
        <p className="text-white/60">Room not found</p>
        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
        >
          Back to list
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white/5 backdrop-blur-lg rounded-lg border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
        <div className="flex items-center gap-3">
          {/* Back Button */}
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <NeonCyanIcon type="arrow-left" size={20} className="text-white" />
          </button>

          {/* Room Avatar */}
          <div className="relative cursor-pointer" onClick={() => isOwnerOrAdmin && setShowGroupAvatar(true)}>
            {room.groupAvatar ? (
              <img 
                src={room.groupAvatar} 
                alt={room.name} 
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : room.counterpartLogo ? (
              <img 
                src={room.counterpartLogo} 
                alt={room.counterpartName} 
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {room?.name?.charAt(0)?.toUpperCase() || 'C'}
                </span>
              </div>
            )}
            {isOwnerOrAdmin && (
              <div className="absolute -bottom-1 -right-1 bg-blue-600 rounded-full p-0.5">
                <NeonCyanIcon type="photo" size={12} className="text-white" />
              </div>
            )}
          </div>

          {/* Room Info */}
          <div>
            <h3 className="text-white font-semibold">{room.name}</h3>
            <p className="text-xs text-white/60">{room.members?.length || 0} members</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Mute Toggle */}
          <button
            onClick={handleToggleMute}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <NeonCyanIcon type="bell-slash" size={20} className="text-red-400" />
            ) : (
              <NeonCyanIcon type="bell" size={20} className="text-white/60" />
            )}
          </button>

          {/* Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <NeonCyanIcon type="ellipsis" size={20} className="text-white" />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-gray-800 border border-white/10 rounded-lg shadow-xl z-50">
                <button
                  onClick={() => { setShowInviteLink(true); setShowMenu(false); }}
                  className="w-full text-left px-4 py-2 text-white hover:bg-white/10 flex items-center gap-2"
                >
                  <NeonCyanIcon type="user-plus" size={16} className="text-current" />
                  Invite Team Member
                </button>
                <button
                  onClick={() => { setShowReminder(true); setShowMenu(false); }}
                  className="w-full text-left px-4 py-2 text-white hover:bg-white/10 flex items-center gap-2"
                >
                  <NeonCyanIcon type="clock" size={16} className="text-current" />
                  Create Reminder
                </button>
                <button
                  onClick={() => { setShowMilestone(true); setShowMenu(false); }}
                  className="w-full text-left px-4 py-2 text-white hover:bg-white/10 flex items-center gap-2"
                >
                  <NeonCyanIcon type="flag" size={16} className="text-current" />
                  Add Milestone
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-white/40">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubbleEnhanced
                key={msg.id}
                message={msg}
                isOwn={msg.senderId === userId}
                onReply={() => setReplyingTo(msg)}
                roomId={roomId}
                currentUserId={userId}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Reply Preview */}
      {replyingTo && (
        <div className="px-4 py-2 bg-white/5 border-t border-white/10 flex items-center justify-between">
          <div className="flex-1">
            <p className="text-xs text-blue-400 font-medium">Replying to {replyingTo.senderName}</p>
            <p className="text-sm text-white/70 truncate">{replyingTo.text}</p>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="p-1 hover:bg-white/10 rounded"
          >
            <NeonCyanIcon type="close" size={16} className="text-white/60" />
          </button>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-white/10 bg-white/5">
        <form onSubmit={handleSend} className="flex items-end gap-2">
          {/* File Upload */}
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <NeonCyanIcon type="paper-clip" size={20} className="text-white/60" />
          </button>

          {/* Voice Note */}
          <button
            type="button"
            onClick={() => setShowVoiceRecorder(true)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <NeonCyanIcon type="microphone" size={20} className="text-white/60" />
          </button>

          {/* Text Input */}
          <textarea
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 bg-white/10 text-white placeholder-white/40 rounded-lg px-4 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={1}
            style={{ minHeight: '40px', maxHeight: '120px' }}
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            <NeonCyanIcon type="paper-airplane" size={20} className="text-white" />
          </button>
        </form>
      </div>

      {/* Modals */}
      {showVoiceRecorder && (
        <VoiceRecorder
          onSend={handleVoiceNote}
          onClose={() => setShowVoiceRecorder(false)}
        />
      )}

      {showInviteLink && room && (
        <InviteLinkModal
          roomId={roomId}
          roomName={room.name}
          onClose={() => setShowInviteLink(false)}
        />
      )}

      {showReminder && (
        <ReminderModal
          roomId={roomId}
          members={room?.members || []}
          memberNames={room?.memberNames || {}}
          onClose={() => setShowReminder(false)}
        />
      )}

      {showMilestone && (
        <MilestoneModal
          roomId={roomId}
          members={room?.members || []}
          memberNames={room?.memberNames || {}}
          onClose={() => setShowMilestone(false)}
        />
      )}

      {showGroupAvatar && isOwnerOrAdmin && (
        <GroupAvatarModal
          roomId={roomId}
          currentAvatar={room.groupAvatar}
          userId={userId}
          onClose={() => setShowGroupAvatar(false)}
        />
      )}
    </div>
  );
}

