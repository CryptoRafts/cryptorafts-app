"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';
import BlockchainCard from './ui/BlockchainCard';
import AnimatedButton from './ui/AnimatedButton';
import RaftAICollaborationDashboard from './RaftAICollaborationDashboard';
import { raftaiCollaborationManager, CollaborationGroup } from '@/lib/raftai-collaboration-manager';

interface VCEnhancedDashboardProps {
  user: any;
  orgId: string;
}

export default function VCEnhancedDashboard({ user, orgId }: VCEnhancedDashboardProps) {
  const [collaborationGroups, setCollaborationGroups] = useState<CollaborationGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<CollaborationGroup | null>(null);
  const [showCollaboration, setShowCollaboration] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCollaborationGroups();
  }, [user?.uid]);

  const loadCollaborationGroups = async () => {
    try {
      setLoading(true);
      // Simulate loading collaboration groups
      const mockGroups: CollaborationGroup[] = [
        {
          id: 'group-1',
          name: 'DeFiProtocol InvestmentGroup VCAlpha',
          projectId: 'project-1',
          projectName: 'DeFi Protocol',
          vcId: user?.uid || '',
          vcName: user?.displayName || 'VC User',
          founderId: 'founder-1',
          founderName: 'John Doe',
          members: [
            {
              id: user?.uid || '',
              name: user?.displayName || 'VC User',
              email: user?.email || '',
              role: 'vc_admin',
              isOnline: true,
              addedBy: 'raftai',
              addedAt: new Date(),
              permissions: {
                canChat: true,
                canShareFiles: true,
                canManageMilestones: true,
                canViewReports: true,
                canInviteMembers: true
              }
            }
          ],
          createdBy: 'raftai',
          createdAt: new Date(),
          isActive: true,
          settings: {
            allowFileUpload: true,
            allowVoiceMessages: true,
            allowVoiceCalls: true,
            allowPinnedMessages: true,
            encryptionEnabled: true
          },
          milestones: [
            {
              id: 'milestone-1',
              title: 'Legal Entity Setup',
              description: 'Complete company registration and legal structure',
              dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              status: 'in_progress',
              priority: 'high',
              assignedTo: 'founder',
              fileLinks: [],
              progress: 60,
              createdAt: new Date(),
              updatedAt: new Date(),
              raftaiExtracted: true
            }
          ],
          kybStatus: 'under_review',
          ddStatus: 'in_progress',
          raiseStatus: 'locked',
          raftaiReports: []
        }
      ];
      setCollaborationGroups(mockGroups);
    } catch (error) {
      console.error('Error loading collaboration groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'text-green-400';
      case 'under_review': return 'text-yellow-400';
      case 'in_progress': return 'text-blue-400';
      case 'pending': return 'text-gray-400';
      case 'rejected': return 'text-red-400';
      case 'eligible': return 'text-green-400';
      case 'locked': return 'text-red-400';
      case 'committed': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <NeonCyanIcon type="check" size={20} className="text-green-400" />;
      case 'under_review': return <NeonCyanIcon type="clock" size={20} className="text-yellow-400" />;
      case 'in_progress': return <NeonCyanIcon type="analytics" size={20} className="text-blue-400" />;
      case 'pending': return <NeonCyanIcon type="clock" size={20} className="text-gray-400" />;
      case 'rejected': return <NeonCyanIcon type="exclamation" size={20} className="text-red-400" />;
      case 'eligible': return <NeonCyanIcon type="check" size={20} className="text-green-400" />;
      case 'locked': return <NeonCyanIcon type="exclamation" size={20} className="text-red-400" />;
      case 'committed': return <NeonCyanIcon type="dollar" size={20} className="text-blue-400" />;
      default: return <NeonCyanIcon type="clock" size={20} className="text-gray-400" />;
    }
  };

  const renderCollaborationGroups = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white">Active Collaborations</h3>
        <div className="text-white/60 text-sm">
          {collaborationGroups.length} active groups
        </div>
      </div>

      {collaborationGroups.map((group) => (
        <BlockchainCard key={group.id} variant="default" size="lg" clickable={true}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {group.projectName.charAt(0)}
                </span>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-white">{group.name}</h4>
                <p className="text-white/60 text-sm">
                  {group.projectName} • {group.members.length} members
                </p>
                <div className="flex items-center space-x-4 mt-1">
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(group.kybStatus)}
                    <span className={`text-xs ${getStatusColor(group.kybStatus)}`}>
                      KYB: {group.kybStatus.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(group.ddStatus)}
                    <span className={`text-xs ${getStatusColor(group.ddStatus)}`}>
                      DD: {group.ddStatus.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(group.raiseStatus)}
                    <span className={`text-xs ${getStatusColor(group.raiseStatus)}`}>
                      Funding: {group.raiseStatus}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="text-right">
                <div className="text-white/60 text-xs">Milestones</div>
                <div className="text-white font-semibold">
                  {group.milestones.filter(m => m.status === 'completed').length}/{group.milestones.length}
                </div>
              </div>
              <AnimatedButton
                variant="primary"
                size="sm"
                onClick={() => {
                  setSelectedGroup(group);
                  setShowCollaboration(true);
                }}
              >
                Open
              </AnimatedButton>
            </div>
          </div>
        </BlockchainCard>
      ))}
    </div>
  );

  const renderKPICards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <BlockchainCard variant="default" size="md" hoverable={true}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/60 text-sm mb-1">Active Projects</p>
            <p className="text-2xl font-bold text-white">{collaborationGroups.length}</p>
          </div>
          <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <NeonCyanIcon type="building" size={24} className="text-blue-400" />
          </div>
        </div>
      </BlockchainCard>

      <BlockchainCard variant="default" size="md" hoverable={true}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/60 text-sm mb-1">KYB Verified</p>
            <p className="text-2xl font-bold text-white">
              {collaborationGroups.filter(g => g.kybStatus === 'verified').length}
            </p>
          </div>
          <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
            <NeonCyanIcon type="shield" size={24} className="text-green-400" />
          </div>
        </div>
      </BlockchainCard>

      <BlockchainCard variant="default" size="md" hoverable={true}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/60 text-sm mb-1">DD Complete</p>
            <p className="text-2xl font-bold text-white">
              {collaborationGroups.filter(g => g.ddStatus === 'verified').length}
            </p>
          </div>
          <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
            <NeonCyanIcon type="document" size={24} className="text-purple-400" />
          </div>
        </div>
      </BlockchainCard>

      <BlockchainCard variant="default" size="md" hoverable={true}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/60 text-sm mb-1">Funding Ready</p>
            <p className="text-2xl font-bold text-white">
              {collaborationGroups.filter(g => g.raiseStatus === 'eligible').length}
            </p>
          </div>
          <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
            <NeonCyanIcon type="dollar" size={24} className="text-yellow-400" />
          </div>
        </div>
      </BlockchainCard>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white/60">Loading collaboration groups...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">VC Investment Dashboard</h1>
          <p className="text-white/60 mt-2">RaftAI-powered collaboration and investment management</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
          <span className="text-white/60 text-sm">RaftAI Active</span>
        </div>
      </div>

      {/* KPI Cards */}
      {renderKPICards()}

      {/* Collaboration Groups */}
      {renderCollaborationGroups()}

      {/* RaftAI Collaboration Dashboard */}
      {showCollaboration && selectedGroup && (
        <RaftAICollaborationDashboard
          group={selectedGroup}
          currentUser={{
            id: user?.uid || '',
            name: user?.displayName || 'VC User',
            role: user?.role || 'vc'
          }}
          onClose={() => {
            setShowCollaboration(false);
            setSelectedGroup(null);
          }}
        />
      )}
    </div>
  );
}
