"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PaperAirplaneIcon, 
  PaperClipIcon, 
  PhotoIcon,
  UserPlusIcon,
  UserMinusIcon,
  ShieldCheckIcon,
  EllipsisVerticalIcon,
  XMarkIcon,
  CheckIcon,
  XCircleIcon,
  VideoCameraIcon,
  PhoneIcon
} from '@heroicons/react/24/outline';
import BlockchainCard from './ui/BlockchainCard';
import AnimatedButton from './ui/AnimatedButton';
import MemberInviteModal from './MemberInviteModal';

interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  timestamp: Date;
  type: 'text' | 'file' | 'image';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  isEdited?: boolean;
  replyTo?: string;
}

interface ChatMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member' | 'viewer';
  avatar?: string;
  isOnline: boolean;
  lastSeen?: Date;
}

interface DealRoom {
  id: string;
  name: string;
  projectId: string;
  projectName: string;
  members: ChatMember[];
  createdBy: string;
  createdAt: Date;
  isActive: boolean;
}

interface EnhancedDealRoomChatProps {
  dealRoom: DealRoom;
  currentUser: {
    id: string;
    name: string;
    role: string;
  };
  onClose: () => void;
  onAddMember?: (memberId: string) => void;
  onRemoveMember?: (memberId: string) => void;
  onUpdateMemberRole?: (memberId: string, role: string) => void;
}

export default function EnhancedDealRoomChat({
  dealRoom,
  currentUser,
  onClose,
  onAddMember,
  onRemoveMember,
  onUpdateMemberRole
}: EnhancedDealRoomChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showMemberManagement, setShowMemberManagement] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [isVideoCallActive, setIsVideoCallActive] = useState(false);
  const [isVoiceCallActive, setIsVoiceCallActive] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load initial messages
  useEffect(() => {
    loadMessages();
  }, [dealRoom.id]);

  const loadMessages = async () => {
    // Simulate loading messages
    const mockMessages: ChatMessage[] = [
      {
        id: '1',
        text: `Welcome to the deal room for ${dealRoom.projectName}! 🚀`,
        senderId: 'system',
        senderName: 'System',
        senderRole: 'system',
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
        type: 'text'
      },
      {
        id: '2',
        text: 'Great to have everyone here! Let\'s discuss the project details.',
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderRole: currentUser.role,
        timestamp: new Date(Date.now() - 1000 * 60 * 25),
        type: 'text'
      }
    ];
    setMessages(mockMessages);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() && !selectedFile) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      text: newMessage,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      timestamp: new Date(),
      type: selectedFile ? (selectedFile.type.startsWith('image/') ? 'image' : 'file') : 'text',
      fileUrl: selectedFile ? URL.createObjectURL(selectedFile) : undefined,
      fileName: selectedFile?.name,
      fileSize: selectedFile?.size,
      replyTo: replyingTo?.id
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
    setSelectedFile(null);
    setReplyingTo(null);
    setShowFileUpload(false);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setShowFileUpload(true);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setShowFileUpload(true);
    }
  };

  const handleStartVideoCall = () => {
    setIsVideoCallActive(true);
    // In a real app, this would integrate with WebRTC or a video calling service
    console.log('Starting video call...');
  };

  const handleStartVoiceCall = () => {
    setIsVoiceCallActive(true);
    // In a real app, this would integrate with WebRTC or a voice calling service
    console.log('Starting voice call...');
  };

  const handleEndCall = () => {
    setIsVideoCallActive(false);
    setIsVoiceCallActive(false);
    console.log('Call ended');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isAdmin = currentUser.role === 'admin' || dealRoom.members.find(m => m.id === currentUser.id)?.role === 'admin';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <BlockchainCard className="w-full max-w-6xl h-[90vh] flex flex-col" variant="glass" size="xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                {dealRoom.projectName.charAt(0)}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">{dealRoom.name}</h2>
              <p className="text-white/60 text-sm">
                {dealRoom.members.length} members • {dealRoom.projectName}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <AnimatedButton
              variant="primary"
              size="sm"
              onClick={() => setShowMemberManagement(true)}
              icon={<UserPlusIcon className="w-4 h-4" />}
            >
              Members
            </AnimatedButton>
            <AnimatedButton
              variant="primary"
              size="sm"
              onClick={onClose}
              icon={<XMarkIcon className="w-4 h-4" />}
            >
              Close
            </AnimatedButton>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-xs lg:max-w-md ${message.senderId === currentUser.id ? 'order-2' : 'order-1'}`}>
                {message.senderId !== currentUser.id && (
                  <div className="flex items-center space-x-2 mb-1">
                    <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {message.senderName.charAt(0)}
                      </span>
                    </div>
                    <span className="text-white/60 text-xs">{message.senderName}</span>
                    <span className="text-white/40 text-xs">•</span>
                    <span className="text-white/40 text-xs">{formatTime(message.timestamp)}</span>
                  </div>
                )}
                
                <BlockchainCard 
                  variant="default" 
                  size="sm"
                  className={`${
                    message.senderId === currentUser.id 
                      ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-400/30' 
                      : 'bg-gray-800/50 border-gray-600/30'
                  }`}
                >
                  {message.replyTo && (
                    <div className="border-l-2 border-blue-400 pl-2 mb-2 text-xs text-white/60">
                      Replying to message...
                    </div>
                  )}
                  
                  {message.type === 'text' && (
                    <p className="text-white text-sm">{message.text}</p>
                  )}
                  
                  {message.type === 'image' && (
                    <div>
                      <img 
                        src={message.fileUrl} 
                        alt={message.fileName}
                        className="max-w-full h-auto rounded-lg mb-2"
                        width={200}
                        height={150}
                      />
                      {message.text && <p className="text-white text-sm">{message.text}</p>}
                    </div>
                  )}
                  
                  {message.type === 'file' && (
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <PaperClipIcon className="w-5 h-5 text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium">{message.fileName}</p>
                        <p className="text-white/60 text-xs">{formatFileSize(message.fileSize || 0)}</p>
                        {message.text && <p className="text-white text-sm mt-1">{message.text}</p>}
                      </div>
                      <AnimatedButton
                        variant="primary"
                        size="xs"
                        onClick={() => window.open(message.fileUrl, '_blank')}
                      >
                        Download
                      </AnimatedButton>
                    </div>
                  )}
                </BlockchainCard>
                
                {message.senderId === currentUser.id && (
                  <div className="flex justify-end mt-1">
                    <span className="text-white/40 text-xs">{formatTime(message.timestamp)}</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* File Upload Preview */}
        <AnimatePresence>
          {showFileUpload && selectedFile && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4 border-t border-white/10"
            >
              <BlockchainCard variant="default" size="sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {selectedFile.type.startsWith('image/') ? (
                      <img 
                        src={URL.createObjectURL(selectedFile)} 
                        alt="Preview"
                        className="w-12 h-12 rounded-lg object-cover"
                        width={48}
                        height={48}
                      />
                    ) : (
                      <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <PaperClipIcon className="w-6 h-6 text-blue-400" />
                      </div>
                    )}
                    <div>
                      <p className="text-white text-sm font-medium">{selectedFile.name}</p>
                      <p className="text-white/60 text-xs">{formatFileSize(selectedFile.size)}</p>
                    </div>
                  </div>
                  <AnimatedButton
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setSelectedFile(null);
                      setShowFileUpload(false);
                    }}
                    icon={<XMarkIcon className="w-4 h-4" />}
                  >
                    Remove
                  </AnimatedButton>
                </div>
              </BlockchainCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Message Input */}
        <div className="p-6 border-t border-white/10">
          <div className="flex items-end space-x-3">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <AnimatedButton
                  variant="primary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  icon={<PaperClipIcon className="w-4 h-4" />}
                >
                  File
                </AnimatedButton>
                <AnimatedButton
                  variant="primary"
                  size="sm"
                  onClick={() => imageInputRef.current?.click()}
                  icon={<PhotoIcon className="w-4 h-4" />}
                >
                  Image
                </AnimatedButton>
                <AnimatedButton
                  variant="primary"
                  size="sm"
                  onClick={handleStartVoiceCall}
                  icon={<PhoneIcon className="w-4 h-4" />}
                  disabled={isVoiceCallActive || isVideoCallActive}
                >
                  Voice
                </AnimatedButton>
                <AnimatedButton
                  variant="primary"
                  size="sm"
                  onClick={handleStartVideoCall}
                  icon={<VideoCameraIcon className="w-4 h-4" />}
                  disabled={isVoiceCallActive || isVideoCallActive}
                >
                  Video
                </AnimatedButton>
              </div>
              
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="w-full p-3 bg-gray-800/50 border border-gray-600/30 rounded-lg text-white placeholder-white/50 resize-none focus:outline-none focus:border-blue-400/50"
                rows={2}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />
            </div>
            
            <AnimatedButton
              variant="primary"
              size="lg"
              onClick={sendMessage}
              disabled={!newMessage.trim() && !selectedFile}
              icon={<PaperAirplaneIcon className="w-5 h-5" />}
            >
              Send
            </AnimatedButton>
          </div>
        </div>

        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileUpload}
          className="hidden"
          accept="*/*"
        />
        <input
          ref={imageInputRef}
          type="file"
          onChange={handleImageUpload}
          className="hidden"
          accept="image/*"
        />
      </BlockchainCard>

      {/* Call Status */}
      {(isVideoCallActive || isVoiceCallActive) && (
        <div className="fixed bottom-4 right-4 z-40">
          <BlockchainCard variant="default" className="p-4">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${isVideoCallActive ? 'bg-red-500' : 'bg-green-500'} animate-pulse`} />
              <span className="text-white font-medium">
                {isVideoCallActive ? 'Video Call Active' : 'Voice Call Active'}
              </span>
              <AnimatedButton
                variant="primary"
                size="sm"
                onClick={handleEndCall}
                icon={<XCircleIcon className="w-4 h-4" />}
              >
                End Call
              </AnimatedButton>
            </div>
          </BlockchainCard>
        </div>
      )}

      {/* Member Management Modal */}
      <AnimatePresence>
        {showMemberManagement && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-60 flex items-center justify-center p-4">
            <BlockchainCard className="w-full max-w-2xl max-h-[80vh] overflow-y-auto" variant="glass" size="xl">
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h3 className="text-xl font-semibold text-white">Manage Members</h3>
                <AnimatedButton
                  variant="primary"
                  size="sm"
                  onClick={() => setShowMemberManagement(false)}
                  icon={<XMarkIcon className="w-4 h-4" />}
                >
                  Close
                </AnimatedButton>
              </div>
              
              <div className="p-6 space-y-4">
                {dealRoom.members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {member.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-medium">{member.name}</p>
                        <p className="text-white/60 text-sm">{member.email}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            member.role === 'admin' ? 'bg-red-500/20 text-red-400' :
                            member.role === 'member' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {member.role}
                          </span>
                          <span className={`w-2 h-2 rounded-full ${
                            member.isOnline ? 'bg-green-400' : 'bg-gray-400'
                          }`} />
                        </div>
                      </div>
                    </div>
                    
                    {isAdmin && member.id !== currentUser.id && (
                      <div className="flex items-center space-x-2">
                        <select
                          value={member.role}
                          onChange={(e) => onUpdateMemberRole?.(member.id, e.target.value)}
                          className="px-3 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-400"
                        >
                          <option value="viewer">Viewer</option>
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                        </select>
                        <AnimatedButton
                          variant="primary"
                          size="sm"
                          onClick={() => onRemoveMember?.(member.id)}
                          icon={<UserMinusIcon className="w-4 h-4" />}
                        >
                          Remove
                        </AnimatedButton>
                      </div>
                    )}
                  </div>
                ))}
                
                {isAdmin && (
                  <div className="pt-4 border-t border-white/10">
                    <AnimatedButton
                      variant="primary"
                      size="lg"
                      onClick={() => setShowInviteModal(true)}
                      icon={<UserPlusIcon className="w-5 h-5" />}
                    >
                      Invite Member
                    </AnimatedButton>
                  </div>
                )}
              </div>
            </BlockchainCard>
          </div>
        )}
      </AnimatePresence>

      {/* Member Invite Modal */}
      <MemberInviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onInvite={async (email: string, role: 'admin' | 'member' | 'viewer') => {
          await onAddMember?.(email);
        }}
        dealRoomName={dealRoom.name}
      />
    </div>
  );
}
