"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  PaperClipIcon,
  PhotoIcon,
  MicrophoneIcon,
  PhoneIcon,
  MapPinIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  XMarkIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import BlockchainCard from './ui/BlockchainCard';
import AnimatedButton from './ui/AnimatedButton';
import { raftaiCollaborationManager, CollaborationGroup, ProjectMilestone, RaftAIReport } from '@/lib/raftai-collaboration-manager';

interface RaftAICollaborationDashboardProps {
  group: CollaborationGroup;
  currentUser: {
    id: string;
    name: string;
    role: string;
  };
  onClose: () => void;
}

export default function RaftAICollaborationDashboard({
  group,
  currentUser,
  onClose
}: RaftAICollaborationDashboardProps) {
  const [activeTab, setActiveTab] = useState<'chat' | 'milestones' | 'reports' | 'funding'>('chat');
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMemberManagement, setShowMemberManagement] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load messages
  useEffect(() => {
    loadMessages();
  }, [group.id]);

  const loadMessages = async () => {
    // Simulate loading messages
    const mockMessages = [
      {
        id: '1',
        text: `🚀 Welcome to the ${group.name}! RaftAI has created this secure collaboration space for your investment journey.`,
        senderId: 'raftai-system',
        senderName: 'RaftAI System',
        senderRole: 'system',
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
        type: 'system',
        isPinned: true
      },
      {
        id: '2',
        text: 'Great to have everyone here! Let\'s discuss the project details and next steps.',
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

    const message = {
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

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'text-green-400';
      case 'under_review': return 'text-yellow-400';
      case 'in_progress': return 'text-blue-400';
      case 'pending': return 'text-gray-400';
      case 'rejected': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircleIcon className="w-5 h-5 text-green-400" />;
      case 'under_review': return <ClockIcon className="w-5 h-5 text-yellow-400" />;
      case 'in_progress': return <ChartBarIcon className="w-5 h-5 text-blue-400" />;
      case 'pending': return <ClockIcon className="w-5 h-5 text-gray-400" />;
      case 'rejected': return <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />;
      default: return <ClockIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  const renderChatTab = () => (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <ChatBubbleLeftRightIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Secure Chat</h3>
            <p className="text-white/60 text-sm">End-to-end encrypted • {group.members.length} members</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <AnimatedButton
            variant="primary"
            size="sm"
            onClick={() => setShowMemberManagement(true)}
            icon={<UserGroupIcon className="w-4 h-4" />}
          >
            Members
          </AnimatedButton>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                  {message.isPinned && <MapPinIcon className="w-3 h-3 text-yellow-400" />}
                </div>
              )}
              
              <BlockchainCard 
                variant="default" 
                size="sm"
                className={`${
                  message.senderId === currentUser.id 
                    ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-400/30' 
                    : message.type === 'system'
                    ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-400/30'
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
                
                {message.type === 'system' && (
                  <div className="flex items-start space-x-2">
                    <ShieldCheckIcon className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                    <p className="text-white text-sm">{message.text}</p>
                  </div>
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

      {/* Message Input */}
      <div className="p-4 border-t border-white/10">
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
                onClick={() => fileInputRef.current?.click()}
                icon={<PhotoIcon className="w-4 h-4" />}
              >
                Image
              </AnimatedButton>
              <AnimatedButton
                variant="primary"
                size="sm"
                icon={<MicrophoneIcon className="w-4 h-4" />}
              >
                Voice
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
            icon={<ChatBubbleLeftRightIcon className="w-5 h-5" />}
          >
            Send
          </AnimatedButton>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileUpload}
        className="hidden"
        accept="*/*"
      />
    </div>
  );

  const renderMilestonesTab = () => (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white">Project Milestones</h3>
          <p className="text-white/60 text-sm">Track progress and manage project deliverables</p>
        </div>
        <AnimatedButton
          variant="primary"
          size="sm"
          icon={<PlusIcon className="w-4 h-4" />}
        >
          Add Milestone
        </AnimatedButton>
      </div>

      <div className="grid gap-4">
        {group.milestones.map((milestone) => (
          <BlockchainCard key={milestone.id} variant="default" size="md">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h4 className="text-lg font-semibold text-white">{milestone.title}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    milestone.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                    milestone.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                    milestone.status === 'overdue' ? 'bg-red-500/20 text-red-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {milestone.status.replace('_', ' ')}
                  </span>
                  {milestone.raftaiExtracted && (
                    <span className="px-2 py-1 rounded-full text-xs bg-purple-500/20 text-purple-400">
                      RaftAI
                    </span>
                  )}
                </div>
                <p className="text-white/60 text-sm mb-3">{milestone.description}</p>
                <div className="flex items-center space-x-4 text-sm text-white/60">
                  <span>Due: {milestone.dueDate.toLocaleDateString()}</span>
                  <span>Priority: {milestone.priority}</span>
                  <span>Progress: {milestone.progress}%</span>
                </div>
                <div className="mt-3">
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${milestone.progress}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2 ml-4">
                <AnimatedButton
                  variant="primary"
                  size="sm"
                  icon={<EyeIcon className="w-4 h-4" />}
                >
                  View
                </AnimatedButton>
                <AnimatedButton
                  variant="primary"
                  size="sm"
                  icon={<PencilIcon className="w-4 h-4" />}
                >
                  Edit
                </AnimatedButton>
              </div>
            </div>
          </BlockchainCard>
        ))}
      </div>
    </div>
  );

  const renderReportsTab = () => (
    <div className="p-6 space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-white">RaftAI Reports</h3>
        <p className="text-white/60 text-sm">AI-generated insights and compliance reports</p>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <BlockchainCard variant="default" size="md">
          <div className="flex items-center space-x-3">
            {getStatusIcon(group.kybStatus)}
            <div>
              <h4 className="text-white font-semibold">KYB Status</h4>
              <p className={`text-sm ${getStatusColor(group.kybStatus)}`}>
                {group.kybStatus.replace('_', ' ')}
              </p>
            </div>
          </div>
        </BlockchainCard>

        <BlockchainCard variant="default" size="md">
          <div className="flex items-center space-x-3">
            {getStatusIcon(group.ddStatus)}
            <div>
              <h4 className="text-white font-semibold">Due Diligence</h4>
              <p className={`text-sm ${getStatusColor(group.ddStatus)}`}>
                {group.ddStatus.replace('_', ' ')}
              </p>
            </div>
          </div>
        </BlockchainCard>

        <BlockchainCard variant="default" size="md">
          <div className="flex items-center space-x-3">
            {getStatusIcon(group.raiseStatus)}
            <div>
              <h4 className="text-white font-semibold">Funding Status</h4>
              <p className={`text-sm ${getStatusColor(group.raiseStatus)}`}>
                {group.raiseStatus.replace('_', ' ')}
              </p>
            </div>
          </div>
        </BlockchainCard>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {group.raftaiReports.map((report) => (
          <BlockchainCard key={report.id} variant="default" size="md">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h4 className="text-lg font-semibold text-white">{report.title}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    report.riskScore < 30 ? 'bg-green-500/20 text-green-400' :
                    report.riskScore < 70 ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    Risk: {report.riskScore}%
                  </span>
                </div>
                <p className="text-white/60 text-sm mb-3">{report.content}</p>
                <div className="text-xs text-white/50">
                  Generated: {report.generatedAt.toLocaleDateString()}
                </div>
              </div>
              <AnimatedButton
                variant="primary"
                size="sm"
                icon={<EyeIcon className="w-4 h-4" />}
              >
                View Report
              </AnimatedButton>
            </div>
          </BlockchainCard>
        ))}
      </div>
    </div>
  );

  const renderFundingTab = () => (
    <div className="p-6 space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-white">Investment & Funding</h3>
        <p className="text-white/60 text-sm">Manage investment commitments and funding releases</p>
      </div>

      {group.raiseStatus === 'locked' && (
        <BlockchainCard variant="default" size="lg">
          <div className="text-center py-8">
            <ExclamationTriangleIcon className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h4 className="text-xl font-semibold text-white mb-2">Funding Locked</h4>
            <p className="text-white/60 mb-4">
              Complete KYB and Due Diligence verification to unlock funding options.
            </p>
            <div className="flex items-center justify-center space-x-4 text-sm">
              <span className={`${getStatusColor(group.kybStatus)}`}>
                KYB: {group.kybStatus.replace('_', ' ')}
              </span>
              <span className={`${getStatusColor(group.ddStatus)}`}>
                DD: {group.ddStatus.replace('_', ' ')}
              </span>
            </div>
          </div>
        </BlockchainCard>
      )}

      {group.raiseStatus === 'eligible' && (
        <div className="space-y-4">
          <BlockchainCard variant="default" size="lg">
            <div className="text-center py-8">
              <CheckCircleIcon className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h4 className="text-xl font-semibold text-white mb-2">Ready for Investment</h4>
              <p className="text-white/60 mb-6">
                KYB and Due Diligence verification complete. You can now commit investment amounts.
              </p>
              <AnimatedButton
                variant="primary"
                size="lg"
                icon={<CurrencyDollarIcon className="w-5 h-5" />}
              >
                Commit Investment
              </AnimatedButton>
            </div>
          </BlockchainCard>
        </div>
      )}

      {group.raiseStatus === 'committed' && (
        <BlockchainCard variant="default" size="lg">
          <div className="text-center py-8">
            <CurrencyDollarIcon className="w-16 h-16 text-blue-400 mx-auto mb-4" />
            <h4 className="text-xl font-semibold text-white mb-2">Investment Committed</h4>
            <p className="text-white/60 mb-4">
              Your investment commitment has been recorded. RaftAI is preparing the smart contract.
            </p>
            <div className="text-sm text-white/60">
              Status: Processing smart contract deployment
            </div>
          </div>
        </BlockchainCard>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <BlockchainCard className="w-full max-w-7xl h-[95vh] flex flex-col" variant="glass" size="xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                {group.projectName.charAt(0)}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">{group.name}</h2>
              <p className="text-white/60 text-sm">
                {group.members.length} members • RaftAI Powered
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
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

        {/* Tab Navigation */}
        <div className="flex space-x-1 p-4 border-b border-white/10">
          {[
            { id: 'chat', label: 'Chat', icon: ChatBubbleLeftRightIcon },
            { id: 'milestones', label: 'Milestones', icon: ChartBarIcon },
            { id: 'reports', label: 'Reports', icon: DocumentTextIcon },
            { id: 'funding', label: 'Funding', icon: CurrencyDollarIcon }
          ].map(tab => (
            <AnimatedButton
              key={tab.id}
              variant="primary"
              size="sm"
              onClick={() => setActiveTab(tab.id as any)}
              icon={<tab.icon className="w-4 h-4" />}
              className={activeTab === tab.id ? 'opacity-100' : 'opacity-70'}
            >
              {tab.label}
            </AnimatedButton>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'chat' && renderChatTab()}
          {activeTab === 'milestones' && renderMilestonesTab()}
          {activeTab === 'reports' && renderReportsTab()}
          {activeTab === 'funding' && renderFundingTab()}
        </div>
      </BlockchainCard>
    </div>
  );
}
