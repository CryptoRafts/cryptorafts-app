"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/providers/SimpleAuthProvider";
import { chatService } from "@/lib/chatService";
import { ChatRoom, ChatMessage } from "@/lib/chatTypes";
import { 
  PaperAirplaneIcon, 
  PaperClipIcon, 
  FaceSmileIcon,
  EllipsisVerticalIcon,
  BookmarkIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon
} from "@heroicons/react/24/outline";

interface ChatInterfaceProps {
  roomId: string;
  onClose?: () => void;
}

export default function ChatInterface({ roomId, onClose }: ChatInterfaceProps) {
  const { user } = useAuth();
  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load room data
  useEffect(() => {
    const loadRoom = async () => {
      const roomData = await chatService.getRoom(roomId);
      setRoom(roomData);
    };
    loadRoom();
  }, [roomId]);

  // Subscribe to messages
  useEffect(() => {
    if (!roomId) {
      console.log("No roomId provided to ChatInterface");
      return;
    }

    console.log("ChatInterface: Setting up message subscription for room:", roomId);
    
    const unsubscribe = chatService.subscribeToRoomMessages(roomId, (newMessages) => {
      console.log("ChatInterface: Messages received:", newMessages.length);
      setMessages(newMessages);
      // Auto-scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    });

    return unsubscribe;
  }, [roomId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !room) return;

    const messageText = newMessage.trim();
    setNewMessage("");

    try {
      await chatService.sendMessage(roomId, {
        senderId: user.uid,
        type: "text",
        text: messageText,
        readBy: [user.uid]
      });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!user) return;
    await chatService.addReaction(roomId, messageId, emoji, user.uid);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const messageDate = new Date(date);
    
    if (messageDate.toDateString() === today.toDateString()) {
      return "Today";
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (messageDate.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }
    
    return messageDate.toLocaleDateString();
  };

  if (!room) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white/5 backdrop-blur-lg rounded-lg border border-white/10">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <ChatBubbleLeftRightIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-white font-semibold">{room.name}</h3>
            <p className="text-white/60 text-sm">
              {room.members.length} member{room.members.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
            <BookmarkIcon className="w-5 h-5" />
          </button>
          <button className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
            <EllipsisVerticalIcon className="w-5 h-5" />
          </button>
          {onClose && (
            <button 
              onClick={onClose}
              className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/60">
            <ChatBubbleLeftRightIcon className="w-16 h-16 mb-4 opacity-40" />
            <p className="text-lg mb-2">No messages yet</p>
            <p className="text-sm">Start the conversation by sending a message</p>
          </div>
        ) : (
          messages.map((message, index) => {
          const isOwnMessage = message.senderId === user?.uid;
          const showDate = index === 0 || 
            formatDate(messages[index - 1].createdAt) !== formatDate(message.createdAt);
          
          return (
            <div key={message.id}>
              {showDate && (
                <div className="text-center text-white/40 text-sm py-2">
                  {formatDate(message.createdAt)}
                </div>
              )}
              
              <div className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? "order-2" : "order-1"}`}>
                  {!isOwnMessage && (
                    <div className="text-white/60 text-xs mb-1">
                      {message.senderId} {/* In real app, show display name */}
                    </div>
                  )}
                  
                  <div className={`rounded-lg p-3 ${
                    isOwnMessage 
                      ? "bg-blue-600 text-white" 
                      : "bg-white/10 text-white"
                  }`}>
                    <p className="text-sm">{message.text}</p>
                    
                    {/* Reactions */}
                    {message.reactions && Object.keys(message.reactions).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {Object.entries(message.reactions).map(([emoji, userIds]) => (
                          <button
                            key={emoji}
                            onClick={() => handleReaction(message.id, emoji)}
                            className={`text-xs px-2 py-1 rounded-full border ${
                              userIds.includes(user?.uid || "")
                                ? "bg-blue-500 border-blue-400 text-white"
                                : "bg-white/10 border-white/20 text-white/80 hover:bg-white/20"
                            }`}
                          >
                            {emoji} {userIds.length}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className={`text-white/40 text-xs mt-1 ${isOwnMessage ? "text-right" : "text-left"}`}>
                    {formatTime(message.createdAt)}
                  </div>
                </div>
              </div>
            </div>
          );
        })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-white/10">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <FaceSmileIcon className="w-5 h-5" />
          </button>
          
          <button
            type="button"
            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <PaperClipIcon className="w-5 h-5" />
          </button>
          
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-white/10 disabled:text-white/40 text-white rounded-lg transition-colors"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </form>
        
        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div className="absolute bottom-16 left-4 bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg p-2">
            <div className="grid grid-cols-6 gap-1">
              {["😀", "😂", "😍", "🤔", "👍", "👎", "❤️", "🔥", "💯", "🎉", "🚀", "💡"].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    setNewMessage(prev => prev + emoji);
                    setShowEmojiPicker(false);
                  }}
                  className="p-2 hover:bg-white/20 rounded text-lg"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
