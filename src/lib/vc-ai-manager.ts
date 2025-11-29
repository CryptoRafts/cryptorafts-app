import { 
  collection, 
  doc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  getDoc,
  setDoc, 
  updateDoc,
  onSnapshot,
  serverTimestamp,
  Unsubscribe
} from 'firebase/firestore';
import { db, auth } from './firebase.client';
import { 
  VCAISession,
  Project,
  VCOrganization,
  VCPipelineItem
} from './vc-data-models';

export class VCAIManager {
  private static instance: VCAIManager;
  private listeners = new Map<string, Unsubscribe>();

  static getInstance(): VCAIManager {
    if (!VCAIManager.instance) {
      VCAIManager.instance = new VCAIManager();
    }
    return VCAIManager.instance;
  }

  /**
   * Execute AI command
   */
  async executeCommand(
    command: string,
    input: string,
    context: {
      roomId?: string;
      projectId?: string;
      userId: string;
      orgId: string;
    }
  ): Promise<string> {
    // Create AI session
    const sessionRef = doc(collection(db!, 'vcAISessions'));
    const sessionId = sessionRef.id;
    
    const session: VCAISession = {
      id: sessionId,
      roomId: context.roomId || '',
      command,
      context,
      input,
      status: 'pending',
      createdAt: serverTimestamp()
    };

    await setDoc(sessionRef, session);

    try {
      // Call AI service
      const response = await fetch('/api/ai/vc-command', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`
        },
        body: JSON.stringify({
          sessionId,
          command,
          input,
          context
        })
      });

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }

      // Update session with result
      await updateDoc(sessionRef, {
        output: result.output,
        status: 'completed',
        processingTime: result.processingTime,
        completedAt: serverTimestamp()
      });

      return result.output;
    } catch (error) {
      // Update session with error
      await updateDoc(sessionRef, {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        completedAt: serverTimestamp()
      });

      throw error;
    }
  }

  /**
   * Generate project brief
   */
  async generateProjectBrief(projectId: string, orgId: string): Promise<string> {
    const project = await this.getProject(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const context = {
      projectId,
      userId: auth.currentUser?.uid || '',
      orgId
    };

    const input = JSON.stringify({
      project: {
        title: project.title,
        description: project.description,
        sector: project.sector,
        chain: project.chain,
        stage: project.stage,
        valueProp: project.valuePropOneLine,
        team: project.team,
        traction: project.traction,
        tokenomics: project.tokenomics,
        raftai: project.raftai
      }
    });

    return this.executeCommand('brief', input, context);
  }

  /**
   * Analyze project risks
   */
  async analyzeProjectRisks(projectId: string, orgId: string): Promise<string> {
    const project = await this.getProject(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const context = {
      projectId,
      userId: auth.currentUser?.uid || '',
      orgId
    };

    const input = JSON.stringify({
      project: {
        title: project.title,
        description: project.description,
        sector: project.sector,
        chain: project.chain,
        stage: project.stage,
        team: project.team,
        traction: project.traction,
        tokenomics: project.tokenomics,
        raftai: project.raftai
      }
    });

    return this.executeCommand('risks', input, context);
  }

  /**
   * Draft term sheet
   */
  async draftTermSheet(
    projectId: string,
    orgId: string,
    dealTerms: {
      amount: number;
      valuation: number;
      equity: number;
      vesting?: string;
      rights?: string[];
    }
  ): Promise<string> {
    const project = await this.getProject(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const context = {
      projectId,
      userId: auth.currentUser?.uid || '',
      orgId
    };

    const input = JSON.stringify({
      project: {
        title: project.title,
        description: project.description,
        sector: project.sector,
        chain: project.chain,
        stage: project.stage,
        team: project.team,
        traction: project.traction,
        tokenomics: project.tokenomics
      },
      dealTerms
    });

    return this.executeCommand('draft', input, context);
  }

  /**
   * Extract action items from conversation
   */
  async extractActionItems(roomId: string, orgId: string): Promise<string> {
    const messages = await this.getRoomMessages(roomId);
    
    const context = {
      roomId,
      userId: auth.currentUser?.uid || '',
      orgId
    };

    const input = JSON.stringify({
      messages: messages.map(m => ({
        content: m.content,
        authorId: m.authorId,
        type: m.type,
        createdAt: m.createdAt
      }))
    });

    return this.executeCommand('action-items', input, context);
  }

  /**
   * Summarize decisions
   */
  async summarizeDecisions(roomId: string, orgId: string): Promise<string> {
    const messages = await this.getRoomMessages(roomId);
    
    const context = {
      roomId,
      userId: auth.currentUser?.uid || '',
      orgId
    };

    const input = JSON.stringify({
      messages: messages.map(m => ({
        content: m.content,
        authorId: m.authorId,
        type: m.type,
        createdAt: m.createdAt
      }))
    });

    return this.executeCommand('decisions', input, context);
  }

  /**
   * Translate message
   */
  async translateMessage(
    message: string,
    targetLanguage: string,
    orgId: string
  ): Promise<string> {
    const context = {
      userId: auth.currentUser?.uid || '',
      orgId
    };

    const input = JSON.stringify({
      message,
      targetLanguage
    });

    return this.executeCommand('translate', input, context);
  }

  /**
   * Check compliance
   */
  async checkCompliance(projectId: string, orgId: string): Promise<string> {
    const project = await this.getProject(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const context = {
      projectId,
      userId: auth.currentUser?.uid || '',
      orgId
    };

    const input = JSON.stringify({
      project: {
        title: project.title,
        description: project.description,
        sector: project.sector,
        chain: project.chain,
        stage: project.stage,
        country: project.country,
        team: project.team,
        tokenomics: project.tokenomics
      }
    });

    return this.executeCommand('compliance', input, context);
  }

  /**
   * Redact sensitive information
   */
  async redactSensitiveInfo(content: string, orgId: string): Promise<string> {
    const context = {
      userId: auth.currentUser?.uid || '',
      orgId
    };

    const input = JSON.stringify({
      content
    });

    return this.executeCommand('redact', input, context);
  }

  /**
   * Rank projects by thesis fit
   */
  async rankProjectsByThesis(
    projectIds: string[],
    orgId: string
  ): Promise<Array<{ projectId: string; score: number; reasoning: string }>> {
    const organization = await this.getOrganization(orgId);
    if (!organization) {
      throw new Error('Organization not found');
    }

    const projects = await Promise.all(
      projectIds.map(id => this.getProject(id))
    );

    const validProjects = projects.filter(p => p !== null) as Project[];

    const context = {
      userId: auth.currentUser?.uid || '',
      orgId
    };

    const input = JSON.stringify({
      organization: {
        thesis: organization.thesis,
        aum: organization.aum,
        country: organization.country
      },
      projects: validProjects.map(p => ({
        id: p.id,
        title: p.title,
        description: p.description,
        sector: p.sector,
        chain: p.chain,
        stage: p.stage,
        valueProp: p.valuePropOneLine,
        team: p.team,
        traction: p.traction,
        tokenomics: p.tokenomics,
        raftai: p.raftai
      }))
    });

    const result = await this.executeCommand('rank', input, context);
    return JSON.parse(result);
  }

  /**
   * Generate meeting agenda
   */
  async generateMeetingAgenda(
    projectId: string,
    meetingType: 'initial' | 'due_diligence' | 'negotiation' | 'closing',
    orgId: string
  ): Promise<string> {
    const project = await this.getProject(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const context = {
      projectId,
      userId: auth.currentUser?.uid || '',
      orgId
    };

    const input = JSON.stringify({
      project: {
        title: project.title,
        description: project.description,
        sector: project.sector,
        chain: project.chain,
        stage: project.stage,
        team: project.team,
        traction: project.traction,
        tokenomics: project.tokenomics,
        raftai: project.raftai
      },
      meetingType
    });

    return this.executeCommand('agenda', input, context);
  }

  /**
   * Generate due diligence checklist
   */
  async generateDueDiligenceChecklist(projectId: string, orgId: string): Promise<string> {
    const project = await this.getProject(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const context = {
      projectId,
      userId: auth.currentUser?.uid || '',
      orgId
    };

    const input = JSON.stringify({
      project: {
        title: project.title,
        description: project.description,
        sector: project.sector,
        chain: project.chain,
        stage: project.stage,
        team: project.team,
        traction: project.traction,
        tokenomics: project.tokenomics,
        raftai: project.raftai
      }
    });

    return this.executeCommand('checklist', input, context);
  }

  /**
   * Analyze market trends
   */
  async analyzeMarketTrends(
    sector: string,
    chain: string,
    orgId: string
  ): Promise<string> {
    const context = {
      userId: auth.currentUser?.uid || '',
      orgId
    };

    const input = JSON.stringify({
      sector,
      chain
    });

    return this.executeCommand('trends', input, context);
  }

  /**
   * Get AI session history
   */
  async getAISessionHistory(
    orgId: string,
    limit: number = 50
  ): Promise<VCAISession[]> {
    const q = query(
      collection(db!, 'vcAISessions'),
      where('context.orgId', '==', orgId),
      orderBy('createdAt', 'desc'),
      limit(limit)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as VCAISession[];
  }

  /**
   * Subscribe to AI session updates
   */
  subscribeToAISession(
    sessionId: string,
    callback: (session: VCAISession | null) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    const listenerKey = `ai_session_${sessionId}`;
    
    // Clean up existing listener
    this.cleanupListener(listenerKey);

    const sessionRef = doc(db!, 'vcAISessions', sessionId);

    const unsubscribe = onSnapshot(
      sessionRef,
      (snapshot) => {
        try {
          if (!snapshot.exists()) {
            callback(null);
            return;
          }
          
          const session = {
            id: sessionId,
            ...snapshot.data()
          } as VCAISession;
          
          callback(session);
        } catch (error) {
          console.error('Error processing AI session:', error);
          if (onError) onError(error as Error);
        }
      },
      (error) => {
        console.error('AI session listener error:', error);
        if (onError) onError(error);
      }
    );

    this.listeners.set(listenerKey, unsubscribe);
    return unsubscribe;
  }

  /**
   * Get project data
   */
  private async getProject(projectId: string): Promise<Project | null> {
    const projectDoc = await getDoc(doc(db!, 'projects', projectId));
    if (!projectDoc.exists()) return null;
    
    return {
      id: projectId,
      ...projectDoc.data()
    } as Project;
  }

  /**
   * Get organization data
   */
  private async getOrganization(orgId: string): Promise<VCOrganization | null> {
    const orgDoc = await getDoc(doc(db!, 'organizations', orgId));
    if (!orgDoc.exists()) return null;
    
    return {
      id: orgId,
      ...orgDoc.data()
    } as VCOrganization;
  }

  /**
   * Get room messages
   */
  private async getRoomMessages(roomId: string): Promise<Array<{
    content?: string;
    authorId: string;
    type: string;
    createdAt: any;
  }>> {
    const q = query(
      collection(db!, 'groupChats', roomId, 'messages'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data());
  }

  /**
   * Clean up listener
   */
  private cleanupListener(key: string): void {
    const unsubscribe = this.listeners.get(key);
    if (unsubscribe) {
      unsubscribe();
      this.listeners.delete(key);
    }
  }

  /**
   * Clean up all listeners
   */
  cleanupAll(): void {
    this.listeners.forEach((unsubscribe) => {
      unsubscribe();
    });
    this.listeners.clear();
  }
}

export const vcAIManager = VCAIManager.getInstance();
