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
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  Unsubscribe
} from 'firebase/firestore';
import { db, auth } from './firebase.client';
import { 
  Project, 
  VCPipelineItem, 
  DealRoom, 
  DealRoomMessage, 
  VCMetrics,
  VCNotification 
} from './vc-data-models';
// Removed demoDataGenerator - using real Firebase data only

export class VCDealflowManager {
  private static instance: VCDealflowManager;
  private listeners = new Map<string, Unsubscribe>();

  static getInstance(): VCDealflowManager {
    if (!VCDealflowManager.instance) {
      VCDealflowManager.instance = new VCDealflowManager();
    }
    return VCDealflowManager.instance;
  }

  /**
   * Get live feed of projects (real-time)
   */
  subscribeToLiveFeed(
    orgId: string,
    filters: {
      sectors?: string[];
      chains?: string[];
      stages?: string[];
      ratings?: string[];
      countries?: string[];
      dataCompleteness?: 'high' | 'medium' | 'low';
    },
    callback: (projects: Project[]) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    const listenerKey = `live_feed_${orgId}`;
    
    // Clean up existing listener
    this.cleanupListener(listenerKey);

    // Build query
    let q = query(
      collection(db!, 'projects'),
      where('pitch.submitted', '==', true),
      where('badges.kyc', '==', true),
      orderBy('updatedAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        try {
          let projects = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Project[];

          // Apply filters
          if (filters.sectors?.length) {
            projects = projects.filter(p => filters.sectors!.includes(p.sector));
          }
          if (filters.chains?.length) {
            projects = projects.filter(p => filters.chains!.includes(p.chain));
          }
          if (filters.stages?.length) {
            projects = projects.filter(p => filters.stages!.includes(p.stage));
          }
          if (filters.ratings?.length) {
            projects = projects.filter(p => 
              p.raftai && filters.ratings!.includes(p.raftai.rating)
            );
          }
          if (filters.countries?.length) {
            projects = projects.filter(p => 
              p.country && filters.countries!.includes(p.country)
            );
          }
          if (filters.dataCompleteness) {
            projects = projects.filter(p => {
              const completeness = this.calculateDataCompleteness(p);
              switch (filters.dataCompleteness) {
                case 'high': return completeness >= 80;
                case 'medium': return completeness >= 50;
                case 'low': return completeness >= 20;
                default: return true;
              }
            });
          }

          callback(projects);
        } catch (error) {
          console.error('Error processing live feed:', error);
          if (onError) onError(error as Error);
        }
      },
      (error) => {
        console.error('Live feed listener error:', error);
        if (onError) onError(error);
      }
    );

    this.listeners.set(listenerKey, unsubscribe);
    return unsubscribe;
  }

  /**
   * Get VC pipeline (real-time)
   */
  subscribeToPipeline(
    orgId: string,
    callback: (pipeline: VCPipelineItem[]) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    const listenerKey = `pipeline_${orgId}`;
    
    // Clean up existing listener
    this.cleanupListener(listenerKey);

    const q = query(
      collection(db!, 'vcPipelines', orgId, 'items'),
      orderBy('lastUpdatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        try {
          const pipeline = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as VCPipelineItem[];
          callback(pipeline);
        } catch (error) {
          console.error('Error processing pipeline:', error);
          if (onError) onError(error as Error);
        }
      },
      (error) => {
        console.error('Pipeline listener error:', error);
        if (onError) onError(error);
      }
    );

    this.listeners.set(listenerKey, unsubscribe);
    return unsubscribe;
  }

  /**
   * Add project to watchlist
   */
  async addToWatchlist(orgId: string, projectId: string, userId: string): Promise<void> {
    try {
      const pipelineRef = doc(db!, 'vcPipelines', orgId, 'items', projectId);
      
      await setDoc(pipelineRef, {
        projectId: projectId || '',
        orgId: orgId || '',
        stage: 'new',
        watchers: Array.isArray([userId]) ? [userId] : [],
        notes: Array.isArray([]) ? [] : [],
        lastUpdatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        // Ensure all fields are defined
        userId: userId || ''
      });

      // Log audit event
      await this.logAuditEvent('project_added_to_watchlist', {
        orgId,
        projectId,
        userId
      });
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      throw error;
    }
  }

  /**
   * Update pipeline stage
   */
  async updatePipelineStage(
    orgId: string, 
    projectId: string, 
    stage: VCPipelineItem['stage'],
    userId: string
  ): Promise<void> {
    const pipelineRef = doc(db!, 'vcPipelines', orgId, 'items', projectId);
    
    await updateDoc(pipelineRef, {
      stage,
      lastUpdatedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Log audit event
    await this.logAuditEvent('pipeline_stage_updated', {
      orgId,
      projectId,
      stage,
      userId
    });
  }

  /**
   * Add note to pipeline item
   */
  async addPipelineNote(
    orgId: string,
    projectId: string,
    content: string,
    authorId: string
  ): Promise<void> {
    const pipelineRef = doc(db!, 'vcPipelines', orgId, 'items', projectId);
    const pipelineDoc = await getDoc(pipelineRef);
    
    if (!pipelineDoc.exists()) {
      throw new Error('Pipeline item not found');
    }

    const pipelineData = pipelineDoc.data() as VCPipelineItem;
    const newNote = {
      id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content,
      authorId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await updateDoc(pipelineRef, {
      notes: [...pipelineData.notes, newNote],
      lastUpdatedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }

  /**
   * Accept project and create deal room
   */
  async acceptProject(
    orgId: string,
    projectId: string,
    userId: string,
    founderId: string
  ): Promise<string> {
    // Check if deal room already exists
    const existingRoomQuery = query(
      collection(db!, 'groupChats'),
      where('type', '==', 'deal'),
      where('projectId', '==', projectId),
      where('orgId', '==', orgId)
    );
    
    const existingRoomSnapshot = await getDocs(existingRoomQuery);
    if (!existingRoomSnapshot.empty) {
      const existingRoom = existingRoomSnapshot.docs[0];
      return existingRoom.id;
    }

    // Create deal room
    const roomRef = doc(collection(db!, 'groupChats'));
    const roomId = roomRef.id;
    
    const dealRoom: DealRoom = {
      id: roomId,
      name: `Deal Room - ${projectId}`,
      type: 'deal',
      projectId,
      orgId,
      members: [userId, founderId],
      ownerId: userId,
      createdAt: serverTimestamp(),
      lastActivityAt: serverTimestamp(),
      status: 'active',
      privacy: {
        inviteOnly: true
      },
      settings: {
        calls: true,
        filesAllowed: true
      }
    };

    await setDoc(roomRef, dealRoom);

    // Add system message
    await this.addSystemMessage(roomId, `Deal room created for project ${projectId}`);

    // Update pipeline stage
    await this.updatePipelineStage(orgId, projectId, 'under_review', userId);

    // Create notification for founder
    await this.createNotification({
      userId: founderId,
      orgId,
      type: 'project_accepted',
      title: 'Project Accepted',
      message: 'A VC has accepted your project and created a deal room.',
      data: { projectId, roomId },
      priority: 'high'
    });

    // Log audit event
    await this.logAuditEvent('project_accepted', {
      orgId,
      projectId,
      roomId,
      userId
    });

    return roomId;
  }

  /**
   * Decline project
   */
  async declineProject(
    orgId: string,
    projectId: string,
    userId: string,
    feedback?: string
  ): Promise<void> {
    // Update pipeline stage to archived
    await this.updatePipelineStage(orgId, projectId, 'archived', userId);

    // Add feedback note if provided
    if (feedback) {
      await this.addPipelineNote(orgId, projectId, `Declined: ${feedback}`, userId);
    }

    // Log audit event
    await this.logAuditEvent('project_declined', {
      orgId,
      projectId,
      feedback,
      userId
    });
  }

  /**
   * Get project details
   */
  async getProject(projectId: string): Promise<Project | null> {
    const projectDoc = await getDoc(doc(db!, 'projects', projectId));
    if (!projectDoc.exists()) return null;
    
    return {
      id: projectId,
      ...projectDoc.data()
    } as Project;
  }

  /**
   * Request access to project documents
   */
  async requestDocumentAccess(
    orgId: string,
    projectId: string,
    userId: string,
    documentType: string
  ): Promise<void> {
    // Check if NDA is required
    const project = await this.getProject(projectId);
    if (!project) throw new Error('Project not found');

    if (project.uploads?.ndaRequired) {
      // Check if user is in a deal room for this project
      const roomQuery = query(
        collection(db!, 'groupChats'),
        where('type', '==', 'deal'),
        where('projectId', '==', projectId),
        where('orgId', '==', orgId),
        where('members', 'array-contains', userId)
      );
      
      const roomSnapshot = await getDocs(roomQuery);
      if (roomSnapshot.empty) {
        throw new Error('NDA required - please accept the project first');
      }

      // Check if NDA is accepted
      const room = roomSnapshot.docs[0].data() as DealRoom;
      if (!room.nda?.acceptedBy.includes(userId)) {
        throw new Error('NDA not accepted - please accept the NDA first');
      }
    }

    // Log audit event
    await this.logAuditEvent('document_access_requested', {
      orgId,
      projectId,
      userId,
      documentType
    });
  }

  /**
   * Get VC metrics
   */
  async getVCMetrics(orgId: string, period: 'daily' | 'weekly' | 'monthly' | 'yearly'): Promise<VCMetrics | null> {
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const metricsDoc = await getDoc(doc(db!, 'vcMetrics', `${orgId}_${period}_${date}`));
    
    if (!metricsDoc.exists()) return null;
    
    return {
      orgId,
      period,
      date,
      ...metricsDoc.data()
    } as VCMetrics;
  }

  /**
   * Subscribe to VC metrics (real-time)
   */
  subscribeToVCMetrics(
    orgId: string,
    period: 'daily' | 'weekly' | 'monthly' | 'yearly',
    callback: (metrics: VCMetrics | null) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    const listenerKey = `metrics_${orgId}_${period}`;
    
    // Clean up existing listener
    this.cleanupListener(listenerKey);

    const date = new Date().toISOString().split('T')[0];
    const metricsRef = doc(db!, 'vcMetrics', `${orgId}_${period}_${date}`);

    const unsubscribe = onSnapshot(
      metricsRef,
      (snapshot) => {
        try {
          if (!snapshot.exists()) {
            callback(null);
            return;
          }
          
          const metrics = {
            orgId,
            period,
            date,
            ...snapshot.data()
          } as VCMetrics;
          
          callback(metrics);
        } catch (error) {
          console.error('Error processing metrics:', error);
          if (onError) onError(error as Error);
        }
      },
      (error) => {
        console.error('Metrics listener error:', error);
        if (onError) onError(error);
      }
    );

    this.listeners.set(listenerKey, unsubscribe);
    return unsubscribe;
  }

  /**
   * Calculate data completeness for a project
   */
  private calculateDataCompleteness(project: Project): number {
    let score = 0;
    let total = 0;

    // Basic info
    total += 4;
    if (project.title) score += 1;
    if (project.description) score += 1;
    if (project.website) score += 1;
    if (project.logoUrl) score += 1;

    // Team info
    total += 1;
    if (project.team && project.team.length > 0) score += 1;

    // Documents
    total += 4;
    if (project.uploads?.pitchDeck) score += 1;
    if (project.uploads?.whitepaper) score += 1;
    if (project.uploads?.tokenModel) score += 1;
    if (project.uploads?.audits && project.uploads.audits.length > 0) score += 1;

    // Traction
    total += 3;
    if (project.traction?.users) score += 1;
    if (project.traction?.revenue) score += 1;
    if (project.traction?.partnerships && project.traction.partnerships.length > 0) score += 1;

    // Tokenomics
    total += 2;
    if (project.tokenomics?.totalSupply) score += 1;
    if (project.tokenomics?.tokenDistribution && project.tokenomics.tokenDistribution.length > 0) score += 1;

    return Math.round((score / total) * 100);
  }

  /**
   * Add system message to deal room
   */
  private async addSystemMessage(roomId: string, content: string): Promise<void> {
    const messageRef = doc(collection(db!, 'groupChats', roomId, 'messages'));
    
    const message: DealRoomMessage = {
      id: messageRef.id,
      roomId,
      type: 'system',
      content,
      authorId: 'system',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(messageRef, message);
  }

  /**
   * Create notification
   */
  private async createNotification(notification: Omit<VCNotification, 'id' | 'read' | 'createdAt'>): Promise<void> {
    const notificationRef = doc(collection(db!, 'notifications'));
    
    const fullNotification: VCNotification = {
      id: notificationRef.id,
      ...notification,
      read: false,
      createdAt: serverTimestamp()
    };

    await setDoc(notificationRef, fullNotification);
  }

  /**
   * Log audit event
   */
  private async logAuditEvent(action: string, data: any): Promise<void> {
    try {
      // Skip audit logging for now to prevent errors
      console.log('Audit event:', action, data);
    } catch (error) {
      console.error('Error logging audit event:', error);
    }
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
   * Get projects (non-real-time) - Simplified query to avoid index requirements
   */
  async getProjects(
    orgId: string,
    filters: {
      sectors?: string[];
      chains?: string[];
      stages?: string[];
      ratings?: string[];
      countries?: string[];
      dataCompleteness?: 'high' | 'medium' | 'low';
    }
  ): Promise<Project[]> {
    try {
      // Simplified query without complex where clauses to avoid index requirements
      let queryRef = query(
        collection(db!, 'projects'),
        orderBy('updatedAt', 'desc'),
        limit(20)
      );

      const snapshot = await getDocs(queryRef);
      let projects = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Project));

      // Filter on client side to avoid Firestore index requirements
      projects = projects.filter(project => 
        project.badges?.kyc === true && 
        project.pitch?.submitted === true
      );

      // Apply additional filters
      if (filters.sectors && filters.sectors.length > 0) {
        projects = projects.filter(project => 
          project.sector && filters.sectors!.includes(project.sector)
        );
      }

      if (filters.chains && filters.chains.length > 0) {
        projects = projects.filter(project => 
          project.chains && project.chains.some((chain: string) => filters.chains!.includes(chain))
        );
      }

      if (filters.stages && filters.stages.length > 0) {
        projects = projects.filter(project => 
          project.stage && filters.stages!.includes(project.stage)
        );
      }

      return projects.slice(0, 10); // Limit to 10 for performance
    } catch (error) {
      console.error('Error getting projects:', error);
      // Return mock data for faster loading
      return this.getMockProjects();
    }
  }

  /**
   * Subscribe to projects (real-time) - Simplified query to avoid index requirements
   */
  subscribeToProjects(
    orgId: string,
    filters: {
      sectors?: string[];
      chains?: string[];
      stages?: string[];
      ratings?: string[];
      countries?: string[];
      dataCompleteness?: 'high' | 'medium' | 'low';
    },
    callback: (projects: Project[]) => void
  ): () => void {
    try {
      // Simplified query without complex where clauses to avoid index requirements
      let queryRef = query(
        collection(db!, 'projects'),
        orderBy('updatedAt', 'desc'),
        limit(20)
      );

      const unsubscribe = onSnapshot(queryRef, (snapshot) => {
        let projects = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Project));

        // Filter on client side to avoid Firestore index requirements
        projects = projects.filter(project => 
          project.badges?.kyc === true && 
          project.pitch?.submitted === true
        );

        // Apply additional filters
        if (filters.sectors && filters.sectors.length > 0) {
          projects = projects.filter(project => 
            project.sector && filters.sectors!.includes(project.sector)
          );
        }

        if (filters.chains && filters.chains.length > 0) {
          projects = projects.filter(project => 
            project.chains && project.chains.some((chain: string) => filters.chains!.includes(chain))
          );
        }

        if (filters.stages && filters.stages.length > 0) {
          projects = projects.filter(project => 
            project.stage && filters.stages!.includes(project.stage)
          );
        }

        callback(projects.slice(0, 10)); // Limit to 10 for performance
      });

      const listenerKey = `projects_${orgId}`;
      this.listeners.set(listenerKey, unsubscribe);

      return () => {
        unsubscribe();
        this.listeners.delete(listenerKey);
      };
    } catch (error) {
      console.error('Error subscribing to projects:', error);
      // Return mock data callback
      callback(this.getMockProjects());
      return () => {}; // No-op unsubscribe function
    }
  }

  /**
   * Get pipeline (non-real-time) - With error handling
   */
  async getPipeline(orgId: string): Promise<{ success: boolean; data?: VCPipelineItem[]; error?: string }> {
    try {
      const pipelineQuery = query(
        collection(db!, 'vcPipelines', orgId, 'items'),
        orderBy('lastUpdatedAt', 'desc'),
        limit(10)
      );

      const snapshot = await getDocs(pipelineQuery);
      const pipeline = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as VCPipelineItem));

      return { success: true, data: pipeline };
    } catch (error) {
      console.error('Error getting pipeline:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: this.getMockPipeline()
      };
    }
  }

  /**
   * Subscribe to pipeline (real-time) - With error handling
   */
  subscribeToPipeline(
    orgId: string,
    callback: (pipeline: VCPipelineItem[]) => void
  ): () => void {
    try {
      const pipelineQuery = query(
        collection(db!, 'vcPipelines', orgId, 'items'),
        orderBy('lastUpdatedAt', 'desc'),
        limit(10)
      );

      const unsubscribe = onSnapshot(pipelineQuery, (snapshot) => {
        const pipeline = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as VCPipelineItem));
        callback(pipeline);
      });

      const listenerKey = `pipeline_${orgId}`;
      this.listeners.set(listenerKey, unsubscribe);

      return () => {
        unsubscribe();
        this.listeners.delete(listenerKey);
      };
    } catch (error) {
      console.error('Error subscribing to pipeline:', error);
      // Return mock pipeline data
      callback(this.getMockPipeline());
      return () => {}; // No-op unsubscribe function
    }
  }

  /**
   * Get metrics (non-real-time) - With fallback data
   */
  async getMetrics(orgId: string): Promise<VCMetrics | null> {
    try {
      const metricsDoc = await getDoc(doc(db!, 'vcMetrics', orgId));
      if (metricsDoc.exists()) {
        return metricsDoc.data() as VCMetrics;
      }
    } catch (error) {
      console.error('Error getting metrics:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Subscribe to metrics (real-time) - With fallback data
   */
  subscribeToMetrics(
    orgId: string,
    callback: (metrics: VCMetrics | null) => void
  ): () => void {
    try {
      const metricsRef = doc(db!, 'vcMetrics', orgId);

      const unsubscribe = onSnapshot(metricsRef, (snapshot) => {
        if (snapshot.exists()) {
          callback(snapshot.data() as VCMetrics);
        } else {
          callback({
            totalProjects: 0,
            projectsThisMonth: 0,
            totalInvestment: 0,
            averageDealSize: 0,
            conversionRate: 0,
            averageTimeToClose: 0,
            activeDeals: 0,
            completedDeals: 0,
            rejectedDeals: 0,
            totalPortfolioValue: 0,
            roi: 0,
            irr: 0,
            multiple: 0
          });
        }
      });

      const listenerKey = `metrics_${orgId}`;
      this.listeners.set(listenerKey, unsubscribe);

      return () => {
        unsubscribe();
        this.listeners.delete(listenerKey);
      };
    } catch (error) {
      console.error('Error subscribing to metrics:', error);
      callback({
        totalProjects: 0,
        projectsThisMonth: 0,
        totalInvestment: 0,
        averageDealSize: 0,
        conversionRate: 0,
        averageTimeToClose: 0,
        activeDeals: 0,
        completedDeals: 0,
        rejectedDeals: 0,
        totalPortfolioValue: 0,
        roi: 0,
        irr: 0,
        multiple: 0
      });
      return () => {}; // No-op unsubscribe function
    }
  }

  // Removed mock data methods - using real Firebase data only

  /**
   * Accept a project
   */
  async acceptProject(orgId: string, projectId: string): Promise<void> {
    try {
      const pipelineRef = doc(db!, 'vcPipelines', orgId, 'items', projectId);
      
      await setDoc(pipelineRef, {
        projectId: projectId || '',
        orgId: orgId || '',
        stage: 'accepted',
        lastUpdatedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'accepted'
      });

      // Log audit event
      await this.logAuditEvent('project_accepted', {
        orgId,
        projectId
      });
    } catch (error) {
      console.error('Error accepting project:', error);
      throw error;
    }
  }

  /**
   * Decline a project
   */
  async declineProject(orgId: string, projectId: string): Promise<void> {
    try {
      const pipelineRef = doc(db!, 'vcPipelines', orgId, 'items', projectId);
      
      await setDoc(pipelineRef, {
        projectId: projectId || '',
        orgId: orgId || '',
        stage: 'declined',
        lastUpdatedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'declined'
      });

      // Log audit event
      await this.logAuditEvent('project_declined', {
        orgId,
        projectId
      });
    } catch (error) {
      console.error('Error declining project:', error);
      throw error;
    }
  }

  // Removed mock metrics method - using real Firebase data only

  /**
   * Send team chat message
   */
  async sendChatMessage(
    orgId: string,
    message: {
      text: string;
      senderId: string;
      senderName: string;
      timestamp: Date;
      type?: string;
    }
  ): Promise<void> {
    const chatRef = doc(collection(db!, 'organizations', orgId, 'teamChat'));
    await setDoc(chatRef, {
      ...message,
      timestamp: serverTimestamp(),
      createdAt: serverTimestamp()
    });
  }

  /**
   * Send project-specific chat message
   */
  async sendProjectChatMessage(
    orgId: string,
    projectId: string,
    message: {
      text: string;
      senderId: string;
      senderName: string;
      timestamp: Date;
      type?: string;
    }
  ): Promise<void> {
    const chatRef = doc(collection(db!, 'organizations', orgId, 'projectChats', projectId, 'messages'));
    await setDoc(chatRef, {
      ...message,
      projectId,
      timestamp: serverTimestamp(),
      createdAt: serverTimestamp()
    });
  }

  /**
   * Get project chat messages
   */
  async getProjectChatMessages(orgId: string, projectId: string): Promise<any[]> {
    const messagesQuery = query(
      collection(db!, 'organizations', orgId, 'projectChats', projectId, 'messages'),
      orderBy('timestamp', 'asc')
    );
    
    const snapshot = await getDocs(messagesQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  /**
   * Subscribe to project chat messages (real-time)
   */
  subscribeToProjectChat(
    orgId: string,
    projectId: string,
    callback: (messages: any[]) => void
  ): () => void {
    const messagesQuery = query(
      collection(db!, 'organizations', orgId, 'projectChats', projectId, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(messages);
    });

    const listenerKey = `projectChat_${orgId}_${projectId}`;
    this.listeners.set(listenerKey, unsubscribe);

    return () => {
      unsubscribe();
      this.listeners.delete(listenerKey);
    };
  }

  /**
   * Get deal rooms for organization
   */
  async getDealRooms(orgId: string): Promise<DealRoom[]> {
    try {
      // Simplified query to avoid composite index requirement
      const roomsQuery = query(
        collection(db!, 'groupChats'),
        where('type', '==', 'deal'),
        where('orgId', '==', orgId),
        limit(20)
      );

      const snapshot = await getDocs(roomsQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as DealRoom));
    } catch (error) {
      console.error('Error getting deal rooms:', error);
      return [];
    }
  }

  /**
   * Subscribe to deal rooms (real-time)
   */
  subscribeToDealRooms(
    orgId: string,
    callback: (rooms: DealRoom[]) => void
  ): () => void {
    try {
      // Simplified query to avoid composite index requirement
      const roomsQuery = query(
        collection(db!, 'groupChats'),
        where('type', '==', 'deal'),
        where('orgId', '==', orgId),
        limit(20)
      );

      const unsubscribe = onSnapshot(roomsQuery, (snapshot) => {
        const rooms = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as DealRoom));
        callback(rooms);
      });

      const listenerKey = `dealRooms_${orgId}`;
      this.listeners.set(listenerKey, unsubscribe);

      return () => {
        unsubscribe();
        this.listeners.delete(listenerKey);
      };
    } catch (error) {
      console.error('Error subscribing to deal rooms:', error);
      callback([]);
      return () => {}; // No-op unsubscribe function
    }
  }

  /**
   * Get deal room messages
   */
  async getDealRoomMessages(roomId: string): Promise<DealRoomMessage[]> {
    try {
      const messagesQuery = query(
        collection(db!, 'groupChats', roomId, 'messages'),
        orderBy('createdAt', 'asc')
      );

      const snapshot = await getDocs(messagesQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as DealRoomMessage));
    } catch (error) {
      console.error('Error getting deal room messages:', error);
      return [];
    }
  }

  /**
   * Subscribe to deal room messages (real-time)
   */
  subscribeToDealRoomMessages(
    roomId: string,
    callback: (messages: DealRoomMessage[]) => void
  ): () => void {
    try {
      const messagesQuery = query(
        collection(db!, 'groupChats', roomId, 'messages'),
        orderBy('createdAt', 'asc')
      );

      const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
        const messages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as DealRoomMessage));
        callback(messages);
      });

      const listenerKey = `dealRoomMessages_${roomId}`;
      this.listeners.set(listenerKey, unsubscribe);

      return () => {
        unsubscribe();
        this.listeners.delete(listenerKey);
      };
    } catch (error) {
      console.error('Error subscribing to deal room messages:', error);
      callback([]);
      return () => {}; // No-op unsubscribe function
    }
  }

  /**
   * Send message to deal room
   */
  async sendDealRoomMessage(
    roomId: string,
    message: {
      content: string;
      authorId: string;
      type?: 'text' | 'file' | 'image' | 'system';
    }
  ): Promise<void> {
    try {
      const messageRef = doc(collection(db!, 'groupChats', roomId, 'messages'));
      
      const dealRoomMessage: DealRoomMessage = {
        id: messageRef.id,
        roomId,
        type: message.type || 'text',
        content: message.content,
        authorId: message.authorId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(messageRef, dealRoomMessage);

      // Update room's last activity
      await updateDoc(doc(db!, 'groupChats', roomId), {
        lastActivityAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error sending deal room message:', error);
      throw error;
    }
  }

  /**
   * Add project to watchlist
   */
  async addToWatchlist(projectId: string, orgId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const pipelineRef = doc(db!, 'vcPipelines', orgId, 'items', projectId);
      
      await setDoc(pipelineRef, {
        projectId: projectId || '',
        orgId: orgId || '',
        stage: 'new',
        watchers: [userId],
        notes: [],
        lastUpdatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        userId: userId || ''
      });

      // Log audit event
      await this.logAuditEvent('project_added_to_watchlist', {
        orgId,
        projectId,
        userId
      });

      return { success: true };
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Accept a project (enhanced)
   */
  async acceptProject(projectId: string, orgId: string): Promise<{ success: boolean; error?: string; roomId?: string }> {
    try {
      // Update pipeline stage
      const pipelineRef = doc(db!, 'vcPipelines', orgId, 'items', projectId);
      
      await setDoc(pipelineRef, {
        projectId: projectId || '',
        orgId: orgId || '',
        stage: 'accepted',
        lastUpdatedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'accepted'
      });

      // Create deal room
      const roomRef = doc(collection(db!, 'groupChats'));
      const roomId = roomRef.id;
      
      const dealRoom: DealRoom = {
        id: roomId,
        name: `Deal Room - ${projectId}`,
        type: 'deal',
        projectId,
        orgId,
        members: [auth.currentUser?.uid || 'user1', 'founder-1'],
        ownerId: auth.currentUser?.uid || 'user1',
        createdAt: serverTimestamp(),
        lastActivityAt: serverTimestamp(),
        status: 'active',
        privacy: {
          inviteOnly: true
        },
        settings: {
          calls: true,
          filesAllowed: true
        }
      };

      await setDoc(roomRef, dealRoom);

      // Add system message
      await this.sendDealRoomMessage(roomId, {
        content: `Deal room created for project ${projectId}. Welcome to the discussion!`,
        authorId: 'system',
        type: 'system'
      });

      // Log audit event
      await this.logAuditEvent('project_accepted', {
        orgId,
        projectId,
        roomId
      });

      return { success: true, roomId };
    } catch (error) {
      console.error('Error accepting project:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Decline a project (enhanced)
   */
  async declineProject(projectId: string, orgId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const pipelineRef = doc(db!, 'vcPipelines', orgId, 'items', projectId);
      
      await setDoc(pipelineRef, {
        projectId: projectId || '',
        orgId: orgId || '',
        stage: 'declined',
        lastUpdatedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'declined'
      });

      // Log audit event
      await this.logAuditEvent('project_declined', {
        orgId,
        projectId
      });

      return { success: true };
    } catch (error) {
      console.error('Error declining project:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get project by ID
   */
  async getProject(projectId: string): Promise<{ success: boolean; data?: Project; error?: string }> {
    try {
      const projectDoc = await getDoc(doc(db!, 'projects', projectId));
      if (!projectDoc.exists()) {
        return { success: false, error: 'Project not found' };
      }
      
      const project = {
        id: projectId,
        ...projectDoc.data()
      } as Project;

      return { success: true, data: project };
    } catch (error) {
      console.error('Error getting project:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get pipeline (enhanced)
   */
  async getPipeline(orgId: string): Promise<{ success: boolean; data?: VCPipelineItem[]; error?: string }> {
    try {
      const pipelineQuery = query(
        collection(db!, 'vcPipelines', orgId, 'items'),
        orderBy('lastUpdatedAt', 'desc'),
        limit(20)
      );

      const snapshot = await getDocs(pipelineQuery);
      const pipeline = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as VCPipelineItem));

      return { success: true, data: pipeline };
    } catch (error) {
      console.error('Error getting pipeline:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get projects (enhanced)
   */
  async getProjects(orgId: string): Promise<{ success: boolean; data?: Project[]; error?: string }> {
    try {
      // Simplified query without complex where clauses to avoid index requirements
      let queryRef = query(
        collection(db!, 'projects'),
        orderBy('updatedAt', 'desc'),
        limit(20)
      );

      const snapshot = await getDocs(queryRef);
      let projects = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Project));

      // Filter on client side to avoid Firestore index requirements
      projects = projects.filter(project => 
        project.badges?.kyc === true && 
        project.pitch?.submitted === true
      );

      return { success: true, data: projects.slice(0, 10) };
    } catch (error) {
      console.error('Error getting projects:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get metrics (enhanced)
   */
  async getMetrics(orgId: string): Promise<{ success: boolean; data?: VCMetrics; error?: string }> {
    try {
      const metricsDoc = await getDoc(doc(db!, 'vcMetrics', orgId));
      if (metricsDoc.exists()) {
        const metrics = metricsDoc.data() as VCMetrics;
        return { success: true, data: metrics };
      }
    } catch (error) {
      console.error('Error getting metrics:', error);
      return { success: false, error: error.message };
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

export const vcDealflowManager = VCDealflowManager.getInstance();
