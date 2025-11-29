'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/providers/SimpleAuthProvider';
import RoleGate from "@/components/RoleGate";
import BlockchainCard from "@/components/ui/BlockchainCard";
import AnimatedButton from "@/components/ui/AnimatedButton";
import StandardLoading from "@/components/ui/StandardLoading";
import { 
  UserGroupIcon,
  PlusIcon,
  PaperClipIcon,
  PhotoIcon,
  DocumentIcon,
  XMarkIcon,
  CheckIcon,
  UserPlusIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { db } from '@/lib/firebase.client';
import { collection, query, where, onSnapshot, doc, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  avatar?: string;
  joinedAt: Date;
  isOnline: boolean;
  lastSeen?: Date;
}

interface TeamMessage {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  timestamp: Date;
  type: 'text' | 'file' | 'image' | 'system';
  fileInfo?: {
    name: string;
    size: number;
    type: string;
    url?: string;
  };
  reactions?: Array<{
    emoji: string;
    userId: string;
    userName: string;
  }>;
  replies?: Array<{
    id: string;
    content: string;
    senderId: string;
    senderName: string;
    timestamp: Date;
  }>;
}

interface TeamChat {
  id: string;
  name: string;
  description: string;
  members: TeamMember[];
  messages: TeamMessage[];
  createdAt: Date;
  isPrivate: boolean;
  ownerId: string;
}

export default function VCTeamChat() {
  const { user, isLoading } = useAuth();
  const [teamChat, setTeamChat] = useState<TeamChat | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'admin' | 'member'>('member');
  const [showSettings, setShowSettings] = useState(false);
  const [replyingTo, setReplyingTo] = useState<TeamMessage | null>(null);
  const [replyContent, setReplyContent] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;

    // Demo team chat data
    const demoTeamChat: TeamChat = {
      id: 'vc-team-chat-123',
      name: 'VC Team Chat',
      description: 'Private team communication for VC operations',
      ownerId: user.uid,
      isPrivate: true,
      createdAt: new Date('2024-01-01'),
      members: [
        {
          id: user.uid,
          name: user.displayName || 'Anas (You)',
          email: user.email || 'anas@vc.com',
          role: 'owner',
          joinedAt: new Date('2024-01-01'),
          isOnline: true
        },
        {
          id: 'member-1',
          name: 'Sarah Johnson',
          email: 'sarah@vc.com',
          role: 'admin',
          joinedAt: new Date('2024-01-15'),
          isOnline: true,
          lastSeen: new Date()
        },
        {
          id: 'member-2',
          name: 'Mike Chen',
          email: 'mike@vc.com',
          role: 'member',
          joinedAt: new Date('2024-02-01'),
          isOnline: false,
          lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
        },
        {
          id: 'member-3',
          name: 'Alex Rodriguez',
          email: 'alex@vc.com',
          role: 'member',
          joinedAt: new Date('2024-02-15'),
          isOnline: true,
          lastSeen: new Date()
        }
      ],
      messages: [
        {
          id: 'msg-1',
          content: 'Welcome to the VC team chat! This is our private space for team discussions.',
          senderId: user.uid,
          senderName: user.displayName || 'Anas',
          timestamp: new Date('2024-01-01T10:00:00'),
          type: 'system'
        },
        {
          id: 'msg-2',
          content: 'Great to be part of the team! Looking forward to working together.',
          senderId: 'member-1',
          senderName: 'Sarah Johnson',
          timestamp: new Date('2024-01-15T14:30:00'),
          type: 'text'
        },
        {
          id: 'msg-3',
          content: 'I have some updates on the DeFi Protocol investment. The team is making excellent progress.',
          senderId: user.uid,
          senderName: user.displayName || 'Anas',
          timestamp: new Date('2024-02-01T09:15:00'),
          type: 'text',
          reactions: [
            { emoji: '👍', userId: 'member-1', userName: 'Sarah Johnson' },
            { emoji: '🚀', userId: 'member-2', userName: 'Mike Chen' }
          ]
        },
        {
          id: 'msg-4',
          content: 'Here are the latest financial reports for Q1 2024.',
          senderId: 'member-1',
          senderName: 'Sarah Johnson',
          timestamp: new Date('2024-02-15T16:45:00'),
          type: 'file',
          fileInfo: {
            name: 'Q1_2024_Financial_Report.pdf',
            size: 2048576, // 2MB
            type: 'application/pdf',
            url: '#'
          }
        },
        {
          id: 'msg-5',
          content: 'Thanks Sarah! I\'ll review these and get back to you with feedback.',
          senderId: user.uid,
          senderName: user.displayName || 'Anas',
          timestamp: new Date('2024-02-15T17:00:00'),
          type: 'text',
          replies: [
            {
              id: 'reply-1',
              content: 'Here are the latest financial reports for Q1 2024.',
              senderId: 'member-1',
              senderName: 'Sarah Johnson',
              timestamp: new Date('2024-02-15T16:45:00')
            }
          ]
        }
      ]
    };

    // Simulate loading delay
    setTimeout(() => {
      setTeamChat(demoTeamChat);
      setDataLoading(false);
    }, 1000);
  }, [user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [teamChat?.messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || !teamChat || !user) return;

    const newMessage: TeamMessage = {
      id: `msg-${Date.now()}`,
      content: content.trim(),
      senderId: user.uid,
      senderName: user.displayName || 'You',
      timestamp: new Date(),
      type: 'text'
    };

    setTeamChat(prev => prev ? {
      ...prev,
      messages: [...prev.messages, newMessage]
    } : null);

    setNewMessage('');
    console.log('Team message sent:', content);
    
    // Add notification for new team message
    if (typeof window !== 'undefined' && (window as any).notificationManager) {
      (window as any).notificationManager.addNotification({
        title: 'New Team Message',
        message: `New message in VC Team Chat from ${user.displayName || 'You'}`,
        type: 'info',
        isRead: false,
        source: 'team'
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !teamChat || !user) return;

    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      alert('File size too large. Maximum size is 50MB.');
      return;
    }

    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
      'application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ];

    if (!allowedTypes.includes(file.type)) {
      alert('File type not supported. Please upload images, PDFs, or documents.');
      return;
    }

    const messageData: TeamMessage = {
      id: `msg-${Date.now()}`,
      content: `📎 ${file.name}`,
      type: file.type.startsWith('image/') ? 'image' : 'file',
      senderId: user.uid,
      senderName: user.displayName || 'You',
      timestamp: new Date(),
      fileInfo: {
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file) // For demo purposes
      }
    };

    setTeamChat(prev => prev ? {
      ...prev,
      messages: [...prev.messages, messageData]
    } : null);

    if (event.target) {
      event.target.value = '';
    }

    console.log('File uploaded:', file.name, 'Size:', file.size, 'Type:', file.type);
  };

  const addTeamMember = () => {
    if (!newMemberEmail.trim() || !teamChat) return;

    const newMember: TeamMember = {
      id: `member-${Date.now()}`,
      name: newMemberEmail.split('@')[0],
      email: newMemberEmail.trim(),
      role: newMemberRole,
      joinedAt: new Date(),
      isOnline: false
    };

    setTeamChat(prev => prev ? {
      ...prev,
      members: [...prev.members, newMember]
    } : null);

    // Add system message
    const systemMessage: TeamMessage = {
      id: `msg-${Date.now()}`,
      content: `${newMember.name} has been added to the team`,
      senderId: 'system',
      senderName: 'System',
      timestamp: new Date(),
      type: 'system'
    };

    setTeamChat(prev => prev ? {
      ...prev,
      messages: [...prev.messages, systemMessage]
    } : null);

    setNewMemberEmail('');
    setNewMemberRole('member');
    setShowAddMember(false);

    console.log('Team member added:', newMember.email);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-yellow-500/20 text-yellow-400';
      case 'admin': return 'bg-orange-500/20 text-orange-400';
      case 'member': return 'bg-blue-500/20 text-blue-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading || dataLoading) {
    return <StandardLoading title="Loading Team Chat" message="Loading your team chat..." />;
  }

  if (!teamChat) {
    return (
      <RoleGate requiredRole="vc">
        <div className="min-h-screen relative neo-blue-background">
          <div className="container-perfect relative z-10">
            <div className="text-center py-12">
              <p className="text-white/70 text-lg">No team chat found</p>
            </div>
          </div>
        </div>
      </RoleGate>
    );
  }

  return (
    <RoleGate requiredRole="vc">
      <div className="min-h-screen relative neo-blue-background">
        <div className="container-perfect relative z-10">
          {/* Header */}
          <div className="neo-glass-card rounded-2xl p-6 md:p-8 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                  <UserGroupIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">{teamChat.name}</h1>
                  <p className="text-white/60">{teamChat.members.length} team members • Private VC team chat</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <AnimatedButton
                  variant="primary"
                  size="sm"
                  icon={<UserPlusIcon className="w-4 h-4" />}
                  onClick={() => setShowAddMember(true)}
                >
                  Add Member
                </AnimatedButton>
                <AnimatedButton
                  variant="primary"
                  size="sm"
                  icon={<Cog6ToothIcon className="w-4 h-4" />}
                  onClick={() => setShowSettings(true)}
                >
                  Settings
                </AnimatedButton>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Chat Messages */}
            <div className="lg:col-span-3">
              <BlockchainCard variant="default" size="lg" className="h-[600px] flex flex-col">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                  {teamChat.messages.map((message) => (
                    <div key={message.id} className={`flex ${message.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] ${message.senderId === user?.uid ? 'order-2' : 'order-1'}`}>
                        {message.type === 'system' ? (
                          <div className="text-center">
                            <div className="inline-block bg-white/10 text-white/60 text-sm px-3 py-1 rounded-full">
                              {message.content}
                            </div>
                          </div>
                        ) : (
                          <div className={`p-3 rounded-lg ${message.senderId === user?.uid ? 'bg-blue-500/20' : 'bg-white/10'}`}>
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-white font-medium text-sm">{message.senderName}</span>
                              <span className="text-white/40 text-xs">
                                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            
                            {message.type === 'file' && message.fileInfo ? (
                              <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                  {message.fileInfo.type.startsWith('image/') ? (
                                    <PhotoIcon className="w-4 h-4 text-blue-400" />
                                  ) : message.fileInfo.type === 'application/pdf' ? (
                                    <DocumentIcon className="w-4 h-4 text-red-400" />
                                  ) : (
                                    <PaperClipIcon className="w-4 h-4 text-gray-400" />
                                  )}
                                  <p className="text-sm font-medium text-white">{message.fileInfo.name}</p>
                                </div>
                                <p className="text-xs text-white/60">
                                  {formatFileSize(message.fileInfo.size)}
                                </p>
                                {message.fileInfo.type.startsWith('image/') && message.fileInfo.url && (
                                  <img 
                                    src={message.fileInfo.url} 
                                    alt={message.fileInfo.name}
                                    className="max-w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => message.fileInfo && window.open(message.fileInfo.url, '_blank')}
                                  />
                                )}
                              </div>
                            ) : (
                              <p className="text-white text-sm">{message.content}</p>
                            )}

                            {/* Reactions */}
                            {message.reactions && message.reactions.length > 0 && (
                              <div className="flex items-center space-x-1 mt-2">
                                {message.reactions.map((reaction, index) => (
                                  <span key={index} className="text-xs bg-white/10 px-2 py-1 rounded-full">
                                    {reaction.emoji} {reaction.userName}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Replies */}
                            {message.replies && message.replies.length > 0 && (
                              <div className="mt-2 pl-4 border-l-2 border-white/20">
                                {message.replies.map((reply) => (
                                  <div key={reply.id} className="text-xs text-white/60">
                                    <span className="font-medium">{reply.senderName}:</span> {reply.content}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-white/10">
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      className="hidden"
                      accept="image/*,application/pdf,.doc,.docx"
                    />
                    
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
                    >
                      <PaperClipIcon className="w-4 h-4 text-white" />
                    </button>
                    
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage(newMessage);
                          }
                        }}
                        placeholder="Type a message..."
                        className="w-full px-4 py-2 bg-black/20 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    
                    <button
                      onClick={() => sendMessage(newMessage)}
                      disabled={!newMessage.trim()}
                      className="w-8 h-8 bg-blue-500 hover:bg-blue-600 disabled:bg-white/10 disabled:cursor-not-allowed rounded-full flex items-center justify-center transition-colors"
                    >
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </button>
                  </div>
                </div>
              </BlockchainCard>
            </div>

            {/* Team Members Sidebar */}
            <div className="lg:col-span-1">
              <BlockchainCard variant="default" size="lg">
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-white mb-2">Team Members</h3>
                  <p className="text-white/60 text-sm">{teamChat.members.length} members</p>
                </div>
                
                <div className="space-y-3">
                  {teamChat.members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-white">
                              {member.name.charAt(0)}
                            </span>
                          </div>
                          {member.isOnline && (
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-black"></div>
                          )}
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm">{member.name}</p>
                          <p className="text-white/60 text-xs">{member.email}</p>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${getRoleColor(member.role)}`}>
                        {member.role}
                      </span>
                    </div>
                  ))}
                </div>
              </BlockchainCard>
            </div>
          </div>

          {/* Add Member Modal */}
          {showAddMember && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-black/80 backdrop-blur-lg border border-white/20 rounded-xl p-6 max-w-md w-full">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">Add Team Member</h3>
                  <button
                    onClick={() => setShowAddMember(false)}
                    className="text-white/60 hover:text-white"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
                      placeholder="Enter team member email"
                    />
                  </div>

                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">
                      Role
                    </label>
                    <select
                      value={newMemberRole}
                      onChange={(e) => setNewMemberRole(e.target.value as 'admin' | 'member')}
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>

                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={() => setShowAddMember(false)}
                    className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addTeamMember}
                    disabled={!newMemberEmail.trim()}
                    className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-white/10 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    Add Member
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </RoleGate>
  );
}
