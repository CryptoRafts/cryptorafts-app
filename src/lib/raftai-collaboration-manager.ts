import { db } from './firebase.client';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';

export interface CollaborationGroup {
  id: string;
  name: string;
  projectId: string;
  projectName: string;
  vcId: string;
  vcName: string;
  founderId: string;
  founderName: string;
  members: CollaborationMember[];
  createdBy: 'raftai';
  createdAt: Date;
  isActive: boolean;
  settings: {
    allowFileUpload: boolean;
    allowVoiceMessages: boolean;
    allowVoiceCalls: boolean;
    allowPinnedMessages: boolean;
    encryptionEnabled: boolean;
  };
  milestones: ProjectMilestone[];
  kybStatus: 'pending' | 'under_review' | 'verified' | 'rejected';
  ddStatus: 'pending' | 'in_progress' | 'verified' | 'rejected';
  raiseStatus: 'locked' | 'eligible' | 'committed' | 'completed';
  raftaiReports: RaftAIReport[];
}

export interface CollaborationMember {
  id: string;
  name: string;
  email: string;
  role: 'vc_admin' | 'vc_member' | 'founder_admin' | 'founder_member' | 'compliance_bot';
  avatar?: string;
  isOnline: boolean;
  lastSeen?: Date;
  addedBy: string;
  addedAt: Date;
  permissions: {
    canChat: boolean;
    canShareFiles: boolean;
    canManageMilestones: boolean;
    canViewReports: boolean;
    canInviteMembers: boolean;
  };
}

export interface ProjectMilestone {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo: string;
  fileLinks: string[];
  progress: number; // 0-100
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  raftaiExtracted: boolean; // Whether this was extracted by RaftAI
}

export interface RaftAIReport {
  id: string;
  type: 'kyb_summary' | 'dd_analysis' | 'milestone_progress' | 'compliance_check' | 'risk_assessment';
  title: string;
  content: string;
  riskScore: number; // 0-100
  recommendations: string[];
  generatedAt: Date;
  status: 'draft' | 'reviewed' | 'approved';
  reviewedBy?: string;
  reviewedAt?: Date;
}

export interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  timestamp: Date;
  type: 'text' | 'file' | 'image' | 'voice' | 'system';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  voiceDuration?: number; // in seconds
  isPinned: boolean;
  replyTo?: string;
  reactions: MessageReaction[];
  mentions: string[];
  isEncrypted: boolean;
}

export interface MessageReaction {
  emoji: string;
  userId: string;
  userName: string;
  timestamp: Date;
}

class RaftAICollaborationManager {
  // Create collaboration group after pitch acceptance
  async createCollaborationGroup(
    projectId: string,
    projectName: string,
    vcId: string,
    vcName: string,
    founderId: string,
    founderName: string
  ): Promise<{ success: boolean; groupId?: string; error?: string }> {
    try {
      const groupName = `${projectName}InvestmentGroup${vcName}`;
      
      // Create collaboration group
      const groupData = {
        name: groupName,
        projectId,
        projectName,
        vcId,
        vcName,
        founderId,
        founderName,
        members: [
          {
            id: vcId,
            name: vcName,
            email: '', // Will be filled from user data
            role: 'vc_admin' as const,
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
          },
          {
            id: founderId,
            name: founderName,
            email: '', // Will be filled from user data
            role: 'founder_admin' as const,
            isOnline: true,
            addedBy: 'raftai',
            addedAt: new Date(),
            permissions: {
              canChat: true,
              canShareFiles: true,
              canManageMilestones: true,
              canViewReports: true,
              canInviteMembers: false
            }
          },
          {
            id: 'raftai-compliance',
            name: 'RaftAI Compliance Assistant',
            email: 'compliance@raftai.com',
            role: 'compliance_bot' as const,
            isOnline: true,
            addedBy: 'raftai',
            addedAt: new Date(),
            permissions: {
              canChat: true,
              canShareFiles: false,
              canManageMilestones: false,
              canViewReports: true,
              canInviteMembers: false
            }
          }
        ],
        createdBy: 'raftai',
        createdAt: serverTimestamp(),
        isActive: true,
        settings: {
          allowFileUpload: true,
          allowVoiceMessages: true,
          allowVoiceCalls: true,
          allowPinnedMessages: true,
          encryptionEnabled: true
        },
        milestones: [],
        kybStatus: 'pending' as const,
        ddStatus: 'pending' as const,
        raiseStatus: 'locked' as const,
        raftaiReports: []
      };

      const docRef = await addDoc(collection(db!, 'collaborationGroups'), groupData);
      
      // Extract milestones from project using RaftAI
      await this.extractMilestonesFromProject(docRef.id, projectId, projectName);
      
      // Start KYB/DD workflow
      await this.startKYBDDWorkflow(docRef.id, projectId);
      
      // Send welcome message
      await this.sendSystemMessage(docRef.id, {
        text: `🚀 RaftAI has created the investment collaboration group "${groupName}". Welcome to your secure investment workspace!`,
        senderId: 'raftai-system',
        senderName: 'RaftAI System',
        senderRole: 'system',
        type: 'system'
      });

      return { success: true, groupId: docRef.id };
    } catch (error) {
      console.error('Error creating collaboration group:', error);
      return { success: false, error: 'Failed to create collaboration group' };
    }
  }

  // Extract milestones from project using RaftAI
  async extractMilestonesFromProject(
    groupId: string,
    projectId: string,
    projectName: string
  ): Promise<void> {
    try {
      // Simulate RaftAI milestone extraction
      const extractedMilestones: Omit<ProjectMilestone, 'id'>[] = [
        {
          title: 'Legal Entity Setup',
          description: 'Complete company registration and legal structure',
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          status: 'pending',
          priority: 'high',
          assignedTo: 'founder',
          fileLinks: [],
          progress: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          raftaiExtracted: true
        },
        {
          title: 'Tokenomics Finalization',
          description: 'Finalize token distribution, vesting schedules, and economic model',
          dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days
          status: 'pending',
          priority: 'critical',
          assignedTo: 'founder',
          fileLinks: [],
          progress: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          raftaiExtracted: true
        },
        {
          title: 'Technical Audit',
          description: 'Complete smart contract and technical infrastructure audit',
          dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
          status: 'pending',
          priority: 'critical',
          assignedTo: 'founder',
          fileLinks: [],
          progress: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          raftaiExtracted: true
        },
        {
          title: 'Regulatory Compliance',
          description: 'Ensure compliance with relevant regulations and obtain necessary licenses',
          dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
          status: 'pending',
          priority: 'high',
          assignedTo: 'founder',
          fileLinks: [],
          progress: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          raftaiExtracted: true
        }
      ];

      const docRef = doc(db!, 'collaborationGroups', groupId);
      await updateDoc(docRef, {
        milestones: extractedMilestones
      });

      // Send milestone extraction message
      await this.sendSystemMessage(groupId, {
        text: `📋 RaftAI has analyzed the project and extracted ${extractedMilestones.length} key milestones. Review and customize them in the Milestones tab.`,
        senderId: 'raftai-system',
        senderName: 'RaftAI System',
        senderRole: 'system',
        type: 'system'
      });
    } catch (error) {
      console.error('Error extracting milestones:', error);
    }
  }

  // Start KYB/DD workflow
  async startKYBDDWorkflow(groupId: string, projectId: string): Promise<void> {
    try {
      // Update group status
      const docRef = doc(db!, 'collaborationGroups', groupId);
      await updateDoc(docRef, {
        kybStatus: 'under_review',
        ddStatus: 'in_progress'
      });

      // Generate initial KYB report
      await this.generateRaftAIReport(groupId, {
        type: 'kyb_summary',
        title: 'Initial KYB Assessment',
        content: 'RaftAI is conducting comprehensive KYB verification including company registration, business registry match, and compliance readiness assessment.',
        riskScore: 50,
        recommendations: [
          'Verify company registration documents',
          'Confirm business registry information',
          'Review compliance documentation',
          'Validate tokenomics structure'
        ]
      });

      // Generate initial DD report
      await this.generateRaftAIReport(groupId, {
        type: 'dd_analysis',
        title: 'Due Diligence Analysis',
        content: 'RaftAI is performing comprehensive due diligence including technical assessment, market analysis, and risk evaluation.',
        riskScore: 45,
        recommendations: [
          'Review technical architecture',
          'Analyze market positioning',
          'Assess competitive landscape',
          'Evaluate team credentials'
        ]
      });

      // Send workflow start message
      await this.sendSystemMessage(groupId, {
        text: `🔍 RaftAI has initiated KYB (Know Your Business) and Due Diligence workflows. You can track progress in the Reports tab.`,
        senderId: 'raftai-system',
        senderName: 'RaftAI System',
        senderRole: 'system',
        type: 'system'
      });
    } catch (error) {
      console.error('Error starting KYB/DD workflow:', error);
    }
  }

  // Generate RaftAI report
  async generateRaftAIReport(
    groupId: string,
    reportData: Omit<RaftAIReport, 'id' | 'generatedAt' | 'status'>
  ): Promise<void> {
    try {
      const report: Omit<RaftAIReport, 'id'> = {
        ...reportData,
        generatedAt: new Date(),
        status: 'draft'
      };

      const docRef = doc(db!, 'collaborationGroups', groupId);
      await updateDoc(docRef, {
        raftaiReports: arrayUnion(report)
      });
    } catch (error) {
      console.error('Error generating RaftAI report:', error);
    }
  }

  // Send system message
  async sendSystemMessage(
    groupId: string,
    messageData: Omit<ChatMessage, 'id' | 'timestamp' | 'isPinned' | 'reactions' | 'mentions' | 'isEncrypted'>
  ): Promise<void> {
    try {
      const message: Omit<ChatMessage, 'id'> = {
        ...messageData,
        timestamp: new Date(),
        isPinned: false,
        reactions: [],
        mentions: [],
        isEncrypted: true
      };

      await addDoc(collection(db!, 'collaborationGroups', groupId, 'messages'), message);
    } catch (error) {
      console.error('Error sending system message:', error);
    }
  }

  // Get collaboration group
  async getCollaborationGroup(groupId: string): Promise<{ success: boolean; group?: CollaborationGroup; error?: string }> {
    try {
      const docRef = doc(db!, 'collaborationGroups', groupId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          success: true,
          group: {
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            members: data.members?.map((member: any) => ({
              ...member,
              addedAt: member.addedAt?.toDate() || new Date(),
              lastSeen: member.lastSeen?.toDate()
            })) || [],
            milestones: data.milestones?.map((milestone: any) => ({
              ...milestone,
              dueDate: milestone.dueDate?.toDate() || new Date(),
              createdAt: milestone.createdAt?.toDate() || new Date(),
              updatedAt: milestone.updatedAt?.toDate() || new Date(),
              completedAt: milestone.completedAt?.toDate()
            })) || [],
            raftaiReports: data.raftaiReports?.map((report: any) => ({
              ...report,
              generatedAt: report.generatedAt?.toDate() || new Date(),
              reviewedAt: report.reviewedAt?.toDate()
            })) || []
          } as CollaborationGroup
        };
      } else {
        return { success: false, error: 'Collaboration group not found' };
      }
    } catch (error) {
      console.error('Error getting collaboration group:', error);
      return { success: false, error: 'Failed to get collaboration group' };
    }
  }

  // Update milestone
  async updateMilestone(
    groupId: string,
    milestoneId: string,
    updates: Partial<ProjectMilestone>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const groupResult = await this.getCollaborationGroup(groupId);
      if (!groupResult.success || !groupResult.group) {
        return { success: false, error: 'Group not found' };
      }

      const updatedMilestones = groupResult.group.milestones.map(milestone =>
        milestone.id === milestoneId ? { ...milestone, ...updates, updatedAt: new Date() } : milestone
      );

      const docRef = doc(db!, 'collaborationGroups', groupId);
      await updateDoc(docRef, {
        milestones: updatedMilestones
      });

      // Generate progress report if milestone completed
      if (updates.status === 'completed') {
        await this.generateRaftAIReport(groupId, {
          type: 'milestone_progress',
          title: `Milestone Completed: ${groupResult.group.milestones.find(m => m.id === milestoneId)?.title}`,
          content: `The milestone "${groupResult.group.milestones.find(m => m.id === milestoneId)?.title}" has been completed successfully.`,
          riskScore: 20,
          recommendations: ['Continue with next milestone', 'Update project timeline if needed']
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating milestone:', error);
      return { success: false, error: 'Failed to update milestone' };
    }
  }

  // Check KYB/DD completion and unlock raise
  async checkKYBDDCompletion(groupId: string): Promise<{ success: boolean; canRaise?: boolean; error?: string }> {
    try {
      const groupResult = await this.getCollaborationGroup(groupId);
      if (!groupResult.success || !groupResult.group) {
        return { success: false, error: 'Group not found' };
      }

      const group = groupResult.group;
      const canRaise = group.kybStatus === 'verified' && group.ddStatus === 'verified';

      if (canRaise && group.raiseStatus === 'locked') {
        // Unlock raise
        const docRef = doc(db!, 'collaborationGroups', groupId);
        await updateDoc(docRef, {
          raiseStatus: 'eligible'
        });

        // Send unlock notification
        await this.sendSystemMessage(groupId, {
          text: `🎉 Congratulations! KYB and Due Diligence verification is complete. The project is now eligible for funding. You can commit investment amounts in the Funding tab.`,
          senderId: 'raftai-system',
          senderName: 'RaftAI System',
          senderRole: 'system',
          type: 'system'
        });
      }

      return { success: true, canRaise };
    } catch (error) {
      console.error('Error checking KYB/DD completion:', error);
      return { success: false, error: 'Failed to check completion' };
    }
  }

  // Commit investment
  async commitInvestment(
    groupId: string,
    amount: number,
    currency: string,
    vestingSchedule?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const groupResult = await this.getCollaborationGroup(groupId);
      if (!groupResult.success || !groupResult.group) {
        return { success: false, error: 'Group not found' };
      }

      if (groupResult.group.raiseStatus !== 'eligible') {
        return { success: false, error: 'Project is not eligible for funding yet' };
      }

      const docRef = doc(db!, 'collaborationGroups', groupId);
      await updateDoc(docRef, {
        raiseStatus: 'committed',
        committedAmount: amount,
        committedCurrency: currency,
        vestingSchedule: vestingSchedule || 'immediate',
        committedAt: serverTimestamp()
      });

      // Send commitment notification
      await this.sendSystemMessage(groupId, {
        text: `💰 Investment commitment recorded: ${amount} ${currency}${vestingSchedule ? ` with ${vestingSchedule} vesting` : ''}. RaftAI is preparing the smart contract for fund release.`,
        senderId: 'raftai-system',
        senderName: 'RaftAI System',
        senderRole: 'system',
        type: 'system'
      });

      return { success: true };
    } catch (error) {
      console.error('Error committing investment:', error);
      return { success: false, error: 'Failed to commit investment' };
    }
  }
}

export const raftaiCollaborationManager = new RaftAICollaborationManager();
