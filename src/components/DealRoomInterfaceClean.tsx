'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PaperAirplaneIcon, 
  PaperClipIcon, 
  PhotoIcon, 
  DocumentIcon,
  VideoCameraIcon,
  UserPlusIcon,
  ChatBubbleLeftRightIcon,
  StarIcon,
  DocumentTextIcon,
  CalendarIcon,
  ArrowLeftIcon,
  HomeIcon,
  EllipsisVerticalIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { dealRoomManager, DealRoom } from '@/lib/deal-room-manager';
import { chatRoomManager } from '@/lib/chat-room-manager';
import { auditLogger } from '@/lib/audit-logger';

interface DealRoomInterfaceProps {
  roomId: string;
}

const DealRoomInterface: React.FC<DealRoomInterfaceProps> = ({ roomId }) => {
  const { user } = useAuth();
  const [dealRoom, setDealRoom] = useState<DealRoom | null>(null);
  const [loading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [selectedTab, setSelectedTab] = useState<'chat' | 'notePoints' | 'members' | 'milestones'>('chat');
  const [showMemberInvite, setShowMemberInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [activeCall, setActiveCall] = useState<'voice' | 'video' | null>(null);
  const [callTimeRemaining, setCallTimeRemaining] = useState(0);
  const [showNotePoints, setShowNotePoints] = useState(false);
  const [showMemberList, setShowMemberList] = useState(false);
  const [showMilestones, setShowMilestones] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentUserId = user?.uid || 'demo-user';

  // Load deal room data
  useEffect(() => {
    const loadDealRoom = async () => {
      try {
        setIsLoading(true);
        setError('');
        
        console.log('Loading deal room:', roomId);
        
        // Check if user can access this room
        const accessCheck = await dealRoomManager.canUserAccessDealRoom(roomId, currentUserId);
        
        if (!accessCheck.success) {
          console.error('Access denied:', accessCheck.error);
          setError(accessCheck.error || 'Access denied');
          return;
        }

        const result = await dealRoomManager.getDealRoom(roomId);
        
        if (result.success && result.dealRoom) {
          setDealRoom(result.dealRoom);
        } else {
          console.error('Deal room not found:', roomId);
          setError('Deal room not found. Please check the URL or contact support.');
        }
      } catch (error) {
        console.error('Error loading deal room:', error);
        setError('Failed to load deal room');
      } finally {
        setIsLoading(false);
      }
    };

    loadDealRoom();
  }, [roomId, currentUserId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [dealRoom?.messages]);

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !dealRoom || !user) return;

    try {
      const messageData = {
        content: newMessage.trim(),
        type: 'text' as const,
        senderId: user.uid,
        senderName: user.displayName || 'User',
        senderAvatar: user.photoURL || '/cryptorafts.logo.png',
        timestamp: new Date()
      };

      // Send message to backend
      const result = await dealRoomManager.addMessage(roomId, messageData);
      
      if (result.success) {
        setNewMessage('');
        // Message will be updated via real-time listener
      } else {
        console.error('Failed to send message:', result.error);
      }

      // Log audit event
      auditLogger.logMessageSent(user.uid, user.displayName || 'User', roomId, dealRoom.name, messageData.type, messageData.content.length);
      
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !dealRoom || !user) return;

    try {
      const fileData = {
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file) // Temporary URL for demo
      };

      const messageData = {
        content: `Shared file: ${file.name}`,
        type: 'file' as const,
        senderId: user.uid,
        senderName: user.displayName || 'User',
        senderAvatar: user.photoURL || '/cryptorafts.logo.png',
        timestamp: new Date(),
        fileInfo: fileData
      };

      const result = await dealRoomManager.addMessage(roomId, messageData);
      
      if (result.success) {
        // File upload successful
        auditLogger.logFileUploaded(user.uid, user.displayName || 'User', roomId, dealRoom.name, file.name, file.size, file.type);
      }

    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  // Handle key press for sending messages
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Add member to room
  const handleAddMember = async () => {
    if (!inviteEmail.trim() || !dealRoom || !user) return;

    try {
      const memberData = {
        id: `member-${Date.now()}`,
        name: inviteEmail.trim().split('@')[0],
        email: inviteEmail.trim(),
        role: 'member' as const,
        avatar: undefined
      };

      const result = await dealRoomManager.addMember(roomId, memberData);
      
      if (result.success) {
        setInviteEmail('');
        setShowMemberInvite(false);
        
        // Generate invite code for new member
        const code = Math.random().toString(36).substring(2, 15);
        setInviteCode(code);
        setShowInviteModal(true);
        
        auditLogger.logMemberAdded(user.uid, user.displayName || 'User', roomId, dealRoom.name, memberData.id, memberData.name, memberData.role);
      } else {
        console.error('Failed to add member:', result.error);
      }

    } catch (error) {
      console.error('Error adding member:', error);
    }
  };

  // Rename room
  const handleRenameRoom = async () => {
    if (!newRoomName.trim() || !dealRoom || !user) return;

    try {
      const result = await dealRoomManager.renameRoom(roomId, newRoomName.trim());
      
      if (result.success) {
        setNewRoomName('');
        setShowRenameModal(false);
        // Room name will be updated via real-time listener
      } else {
        console.error('Failed to rename room:', result.error);
      }

    } catch (error) {
      console.error('Error renaming room:', error);
    }
  };

  // End call
  const endCall = async () => {
    if (!activeCall) return;

    try {
      console.log('Call ended');
      setActiveCall(null);
      setCallTimeRemaining(0);

      // Add system message
      if (dealRoom && user) {
        const messageData = {
          content: `${activeCall === 'voice' ? 'Voice' : 'Video'} call ended.`,
          type: 'call_end' as const,
          senderId: 'system',
          senderName: 'System',
          timestamp: new Date()
        };

        await dealRoomManager.addMessage(roomId, messageData);
      }
    } catch (error) {
      console.error('Error ending call:', error);
    }
  };

  // Format time
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white">Loading deal room...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-400">{error}</div>
      </div>
    );
  }

  if (!dealRoom) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white">Deal room not found</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-black/20 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => window.history.back()}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 text-white" />
          </button>
          
          <button
            onClick={() => window.location.href = '/vc/dashboard'}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <HomeIcon className="w-5 h-5 text-white" />
          </button>
          
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {dealRoom.name.split(' / ')[0]?.charAt(0) || 'D'}
              </span>
            </div>
            <div>
              <h2 className="text-white font-medium">{dealRoom.name}</h2>
              <p className="text-white/60 text-sm">{dealRoom.members.length} members</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSelectedTab('chat')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              selectedTab === 'chat' ? 'bg-blue-500 text-white' : 'text-white/60 hover:text-white'
            }`}
          >
            Chat
          </button>
          <button
            onClick={() => setSelectedTab('notePoints')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              selectedTab === 'notePoints' ? 'bg-blue-500 text-white' : 'text-white/60 hover:text-white'
            }`}
          >
            Note Points
          </button>
          <button
            onClick={() => setSelectedTab('members')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              selectedTab === 'members' ? 'bg-blue-500 text-white' : 'text-white/60 hover:text-white'
            }`}
          >
            Members
          </button>
          <button
            onClick={() => setSelectedTab('milestones')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              selectedTab === 'milestones' ? 'bg-blue-500 text-white' : 'text-white/60 hover:text-white'
            }`}
          >
            Milestones
          </button>

          <div className="flex items-center space-x-1 ml-4">
            <button
              onClick={() => setActiveCall('video')}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Video Call (Coming Soon)"
            >
              <VideoCameraIcon className="w-5 h-5 text-white/60" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedTab === 'chat' && (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {dealRoom.messages?.map((message: any) => (
                <div key={message.id} className={`flex items-end space-x-2 ${message.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}>
                  {message.type !== 'system' && message.senderId !== currentUserId && (
                    <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0">
                      {message.senderAvatar ? (
                        <img 
                          src={message.senderAvatar} 
                          alt={message.senderName} 
                          className="w-8 h-8 rounded-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = '/cryptorafts.logo.png';
                          }}
                        />
                      ) : (
                        <span className="text-white text-sm font-medium">
                          {message.senderName?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      )}
                    </div>
                  )}
                  
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.type === 'system' 
                      ? 'bg-yellow-500/20 text-yellow-400 text-center mx-auto'
                      : message.senderId === currentUserId
                      ? 'bg-blue-500 text-white'
                      : 'bg-white/10 text-white'
                  }`}>
                    {message.type !== 'system' && (
                      <p className="text-xs opacity-75 mb-1">{message.senderName}</p>
                    )}
                    {message.type === 'file' && message.fileInfo ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {message.fileInfo.type.startsWith('image/') ? (
                              <PhotoIcon className="w-4 h-4 text-blue-400" />
                            ) : message.fileInfo.type === 'application/pdf' ? (
                              <DocumentIcon className="w-4 h-4 text-red-400" />
                            ) : (
                              <DocumentIcon className="w-4 h-4 text-gray-400" />
                            )}
                            <span className="text-sm">{message.fileInfo.name}</span>
                          </div>
                        </div>
                        {message.fileInfo.type.startsWith('image/') && (
                          <img 
                            src={message.fileInfo.url} 
                            alt={message.fileInfo.name}
                            className="max-w-full h-auto rounded"
                          />
                        )}
                      </div>
                    ) : (
                      <p className="text-sm">{message.content}</p>
                    )}
                    <p className="text-xs opacity-75 mt-1">{formatTime(message.timestamp)}</p>
                  </div>
                  
                  {message.type !== 'system' && message.senderId === currentUserId && (
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 ml-2">
                      <span className="text-white text-sm font-medium">U</span>
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-white/10">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <PaperClipIcon className="w-5 h-5 text-white/60" />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                />
                
                <div className="flex-1">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500 resize-none"
                    rows={1}
                  />
                </div>
                
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="p-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  <PaperAirplaneIcon className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
          </>
        )}

        {selectedTab === 'notePoints' && (
          <div className="flex-1 overflow-y-auto p-4">
            <div className="text-white">
              <h3 className="text-lg font-medium mb-4">Note Points</h3>
              {dealRoom.notePoints?.length > 0 ? (
                <div className="space-y-3">
                  {dealRoom.notePoints.map((note: any) => (
                    <div key={note.id} className="bg-white/5 p-3 rounded-lg">
                      <p className="text-white">{note.content}</p>
                      <p className="text-white/60 text-sm mt-1">
                        {note.assignee} • {note.status} • {formatTime(note.dueDate)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-white/60">No note points yet</p>
              )}
            </div>
          </div>
        )}

        {selectedTab === 'members' && (
          <div className="flex-1 overflow-y-auto p-4">
            <div className="text-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Members</h3>
                <button
                  onClick={() => setShowMemberInvite(true)}
                  className="px-3 py-1 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm transition-colors"
                >
                  Add Member
                </button>
              </div>
              
              {dealRoom.members?.length > 0 ? (
                <div className="space-y-3">
                  {dealRoom.members.map((member: any) => (
                    <div key={member.id} className="flex items-center justify-between bg-white/5 p-3 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            {member.name?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div>
                          <p className="text-white">{member.name}</p>
                          <p className="text-white/60 text-sm">{member.email}</p>
                        </div>
                      </div>
                      <span className="text-white/60 text-sm capitalize">{member.role}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-white/60">No members yet</p>
              )}
            </div>
          </div>
        )}

        {selectedTab === 'milestones' && (
          <div className="flex-1 overflow-y-auto p-4">
            <div className="text-white">
              <h3 className="text-lg font-medium mb-4">Milestones</h3>
              {dealRoom.milestones && dealRoom.milestones.length > 0 ? (
                <div className="space-y-3">
                  {dealRoom.milestones.map((milestone: any) => (
                    <div key={milestone.id} className="bg-white/5 p-3 rounded-lg">
                      <h4 className="text-white font-medium">{milestone.title}</h4>
                      <p className="text-white/60 text-sm mt-1">{milestone.description}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          milestone.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                          milestone.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {milestone.status}
                        </span>
                        <span className="text-white/60 text-xs">
                          Due: {formatTime(milestone.dueDate)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-white/60">No milestones yet</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showMemberInvite && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-white text-lg font-medium mb-4">Add Member</h3>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="Enter email address"
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500 mb-4"
            />
            <div className="flex space-x-2">
              <button
                onClick={handleAddMember}
                className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                Add Member
              </button>
              <button
                onClick={() => setShowMemberInvite(false)}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-white text-lg font-medium mb-4">Invite Code Generated</h3>
            <p className="text-white/60 mb-4">Share this code with the new member:</p>
            <div className="bg-white/5 p-3 rounded-lg mb-4">
              <code className="text-blue-400 text-lg font-mono">{inviteCode}</code>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(inviteCode);
                setShowInviteModal(false);
              }}
              className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              Copy Code
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DealRoomInterface;
