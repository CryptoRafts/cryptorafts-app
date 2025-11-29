"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BlockchainCard from './ui/BlockchainCard';
import AnimatedButton from './ui/AnimatedButton';
import {
  XMarkIcon,
  PaperClipIcon,
  PhoneIcon,
  VideoCameraIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UserPlusIcon,
  DocumentTextIcon,
  MapIcon,
  ChatBubbleLeftRightIcon,
  StarIcon,
  EllipsisVerticalIcon,
  PlayIcon,
  StopIcon,
  MicrophoneIcon,
  VideoCameraSlashIcon,
  CalendarIcon,
  ShareIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  PlusIcon,
  TagIcon,
  UserIcon,
  CalendarDaysIcon,
  FlagIcon,
  ArrowLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon
} from '@heroicons/react/24/outline';
import { dealRoomManager, DealRoom, DealRoomMessage, DealRoomMember, NotePoint, CallSession } from '@/lib/deal-room-manager';
import { raftaiBotService } from '@/lib/raftai-bot-service';
import DealRoomHeader from './DealRoomHeader';

interface DealRoomInterfaceProps {
  roomId: string;
  currentUserId: string;
  onClose: () => void;
}

const DealRoomInterface: React.FC<DealRoomInterfaceProps> = ({
  roomId,
  currentUserId,
  onClose
}) => {
  // Error boundary for component rendering
  if (!roomId || !currentUserId) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <BlockchainCard variant="default" className="p-8 text-center">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Invalid Room</h2>
          <p className="text-white/60 mb-4">Room ID or user ID is missing.</p>
          <AnimatedButton
            variant="primary"
            onClick={onClose}
            icon={<XMarkIcon className="w-4 h-4" />}
          >
            Close
          </AnimatedButton>
        </BlockchainCard>
      </div>
    );
  }

  const [dealRoom, setDealRoom] = useState<DealRoom | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'notes' | 'members' | 'milestones'>('chat');
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showMemberInvite, setShowMemberInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [activeCall, setActiveCall] = useState<CallSession | null>(null);
  const [callTimeRemaining, setCallTimeRemaining] = useState(1800); // 30 minutes
  const [showBackButton, setShowBackButton] = useState(false);
  const [chatRoomSize, setChatRoomSize] = useState<'normal' | 'expanded'>('normal');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load deal room data
  useEffect(() => {
    const loadDealRoom = async () => {
      try {
        setIsLoading(true);
        const result = await dealRoomManager.getDealRoom(roomId);
        if (result.success && result.dealRoom) {
          setDealRoom(result.dealRoom);
        }
      } catch (error) {
        console.error('Error loading deal room:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDealRoom();
  }, [roomId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [dealRoom?.messages]);

  // Call timer countdown
  useEffect(() => {
    if (activeCall && callTimeRemaining > 0) {
      const timer = setTimeout(() => {
        setCallTimeRemaining(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (activeCall && callTimeRemaining === 0) {
      endCall();
    }
  }, [activeCall, callTimeRemaining]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !dealRoom) return;

    try {
      const messageData: Omit<DealRoomMessage, 'id' | 'timestamp' | 'reactions' | 'pinned'> = {
        senderId: currentUserId,
        senderName: 'You',
        content: newMessage.trim(),
        type: 'text' as const
      };

      await dealRoomManager.addMessage(roomId, messageData);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const startCall = async (type: 'voice' | 'video') => {
    // Feature coming soon - show notification
    console.log(`${type} call feature coming soon`);
    
    // Add a system message about feature coming soon
    if (dealRoom) {
      const messageData: Omit<DealRoomMessage, 'id' | 'timestamp' | 'reactions' | 'pinned'> = {
        senderId: 'system',
        senderName: 'System',
        content: `${type === 'voice' ? 'Voice' : 'Video'} call feature is coming soon!`,
        type: 'text' as const
      };

      await dealRoomManager.addMessage(roomId, messageData);
    }
  };

  const endCall = async () => {
    // Feature coming soon - no active calls to end
    console.log('Call feature coming soon');
  };

  const addNotePoint = async () => {
    if (!dealRoom) return;

    try {
      const noteData: Omit<NotePoint, 'id' | 'createdAt' | 'updatedAt'> = {
        content: 'New note point added',
        type: 'action',
        status: 'open',
        assignedTo: currentUserId,
        createdBy: currentUserId,
        tags: [],
        followers: []
      };

      await dealRoomManager.addNotePoint(roomId, noteData);
    } catch (error) {
      console.error('Error adding note point:', error);
    }
  };

  const inviteMember = async () => {
    if (!inviteEmail.trim() || !dealRoom) return;

    try {
      const newMember: Omit<DealRoomMember, 'joinedAt' | 'permissions' | 'notificationSettings'> = {
        id: `member-${Date.now()}`,
        name: inviteEmail.split('@')[0],
        email: inviteEmail,
        role: 'member',
        avatar: undefined
      };

      await dealRoomManager.addMember(roomId, newMember);

      // Add system message
      const messageData: Omit<DealRoomMessage, 'id' | 'timestamp' | 'reactions' | 'pinned'> = {
        senderId: 'system',
        senderName: 'System',
        content: `${newMember.name} has been invited to the deal room`,
        type: 'text' as const
      };
      await dealRoomManager.addMessage(roomId, messageData);

      setInviteEmail('');
      setShowMemberInvite(false);
    } catch (error) {
      console.error('Error inviting member:', error);
    }
  };

  if (!dealRoom) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <BlockchainCard variant="default" className="p-8">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white">Loading deal room...</p>
          </div>
        </BlockchainCard>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-black/95">
      {/* Professional Deal Room Header */}
      <DealRoomHeader
        groupName={`${dealRoom.founderName} / ${dealRoom.vcName}`}
        memberCount={dealRoom.members.length}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onBack={onClose}
        onVoiceCall={() => startCall('voice')}
        onVideoCall={() => startCall('video')}
        callStatus={activeCall ? {
          type: activeCall.type,
          timeRemaining: callTimeRemaining
        } : undefined}
      />

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'chat' && (
          <div className="h-full flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-gradient-to-b from-transparent via-black/5 to-transparent">
              {dealRoom.messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <ChatBubbleLeftRightIcon className="w-8 h-8 text-white/20 mx-auto mb-2" />
                    <h3 className="text-sm font-semibold text-white mb-1">Welcome to the Deal Room</h3>
                    <p className="text-white/60 text-xs">Start the conversation with your team</p>
                  </div>
                </div>
              ) : (
                dealRoom.messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex ${message.senderId === currentUserId ? 'justify-end' : 'justify-start'} mb-2`}
                  >
                    <div className={`max-w-[320px] px-3 py-2 rounded-lg shadow-md ${
                      message.senderId === currentUserId
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                        : 'bg-white/10 backdrop-blur-sm text-white border border-white/20'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold">{message.senderName?.charAt(0) || 'U'}</span>
                          </div>
                          <div className="text-xs font-semibold opacity-90">
                            {message.senderName}
                          </div>
                        </div>
                        {message.senderId === currentUserId && (
                          <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-pulse"></div>
                        )}
                      </div>
                      <div className="text-xs leading-relaxed mb-2">
                        {message.content}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs opacity-70">
                          {message.timestamp && !isNaN(new Date(message.timestamp).getTime()) 
                            ? new Date(message.timestamp).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true
                              })
                            : 'Just now'
                          }
                        </span>
                        {message.senderId === currentUserId && (
                          <CheckCircleIcon className="w-3 h-3 opacity-70" />
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-3 bg-white/5 backdrop-blur-lg border-t border-white/10">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-cyan-500/50 text-xs"
                />
                <AnimatedButton
                  variant="primary"
                  size="sm"
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  icon={<PaperClipIcon className="w-4 h-4" />}
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white border-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send
                </AnimatedButton>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Note Points</h3>
              <AnimatedButton
                variant="primary"
                size="sm"
                onClick={addNotePoint}
                icon={<PlusIcon className="w-4 h-4" />}
              >
                Add Note
              </AnimatedButton>
            </div>
            <div className="space-y-2">
              <div className="p-3 bg-white/10 rounded-lg">
                <p className="text-white text-sm">Meeting scheduled for tomorrow at 2 PM</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-white/60">Action Item</span>
                  <span className="text-xs text-white/60">2 hours ago</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'members' && (
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Members</h3>
              <AnimatedButton
                variant="primary"
                size="sm"
                onClick={() => setShowMemberInvite(true)}
                icon={<UserPlusIcon className="w-4 h-4" />}
              >
                Invite
              </AnimatedButton>
            </div>
            <div className="space-y-2">
              {dealRoom.members.map((member) => (
                <div key={member.id} className="flex items-center space-x-3 p-3 bg-white/10 rounded-lg">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{member.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{member.name}</p>
                    <p className="text-white/60 text-xs">{member.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'milestones' && (
          <div className="p-4">
            <h3 className="text-white font-semibold mb-4">Milestones</h3>
            <div className="space-y-3">
              <div className="p-3 bg-white/10 rounded-lg">
                <div className="flex items-center justify-between">
                  <h4 className="text-white font-medium">Initial Meeting</h4>
                  <span className="text-green-400 text-xs">Completed</span>
                </div>
                <p className="text-white/60 text-xs mt-1">Due: Yesterday</p>
              </div>
              <div className="p-3 bg-white/10 rounded-lg">
                <div className="flex items-center justify-between">
                  <h4 className="text-white font-medium">Due Diligence</h4>
                  <span className="text-yellow-400 text-xs">In Progress</span>
                </div>
                <p className="text-white/60 text-xs mt-1">Due: Next Week</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Member Invite Modal */}
      <AnimatePresence>
        {showMemberInvite && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-black/95 backdrop-blur-xl border border-white/20 rounded-xl p-6 w-full max-w-md"
            >
              <BlockchainCard variant="default" className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold">Invite Member</h3>
                  <button
                    onClick={() => setShowMemberInvite(false)}
                    className="w-6 h-6 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
                  >
                    <XMarkIcon className="w-4 h-4 text-white" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="Enter email address"
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>
                  <div className="flex space-x-4">
                    <AnimatedButton
                      variant="primary"
                      onClick={inviteMember}
                      disabled={!inviteEmail.trim()}
                      className="flex-1"
                    >
                      Send Invite
                    </AnimatedButton>
                    <AnimatedButton
                      variant="secondary"
                      onClick={() => setShowMemberInvite(false)}
                      className="flex-1"
                    >
                      Cancel
                    </AnimatedButton>
                  </div>
                </div>
              </BlockchainCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DealRoomInterface;
