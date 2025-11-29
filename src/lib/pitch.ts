import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  getDocs,
  getDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase.client';
import { logger } from './logger';
import { Role } from './role';

export interface Pitch {
  id: string;
  title: string;
  description: string;
  content: string;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'funded';
  founderId: string;
  founderName: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  submittedAt?: Timestamp;
  reviewedAt?: Timestamp;
  reviewedBy?: string;
  reviewNotes?: string;
  
  // Pitch details
  problem: string;
  solution: string;
  marketSize: string;
  businessModel: string;
  traction: string;
  team: string;
  funding: {
    amount: number;
    currency: string;
    useOfFunds: string;
    timeline: string;
  };
  
  // Tokenomics (for crypto projects)
  tokenomics?: {
    tokenName: string;
    tokenSymbol: string;
    totalSupply: number;
    tokenDistribution: {
      publicSale: number;
      team: number;
      advisors: number;
      reserve: number;
      marketing: number;
    };
    vestingSchedule: string;
  };
  
  // Attachments
  attachments: {
    pitchDeck?: string;
    financialModel?: string;
    demo?: string;
    whitepaper?: string;
  };
  
  // Visibility and permissions
  visibility: {
    isPublic: boolean;
    allowVCs: boolean;
    allowExchanges: boolean;
    allowIDOs: boolean;
  };
  
  // AI analysis results
  aiAnalysis?: {
    rating: number;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    analyzedAt: Timestamp;
  };
  
  // Tags and categories
  tags: string[];
  category: string;
  industry: string;
}

export interface PitchComment {
  id: string;
  pitchId: string;
  authorId: string;
  authorName: string;
  authorRole: Role;
  content: string;
  createdAt: Timestamp;
  isInternal: boolean; // Internal comments only visible to founder and admin
}

export interface PitchInteraction {
  id: string;
  pitchId: string;
  userId: string;
  userRole: Role;
  action: 'view' | 'like' | 'bookmark' | 'contact' | 'invest';
  createdAt: Timestamp;
  metadata?: Record<string, any>;
}

export class PitchService {
  // Create a new pitch
  static async createPitch(
    founderId: string,
    founderName: string,
    pitchData: Omit<Pitch, 'id' | 'founderId' | 'founderName' | 'createdAt' | 'updatedAt' | 'status'>
  ): Promise<string> {
    try {
      const pitch: Omit<Pitch, 'id'> = {
        ...pitchData,
        founderId,
        founderName,
        status: 'draft',
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
        tags: pitchData.tags || [],
        attachments: pitchData.attachments || {},
        visibility: pitchData.visibility || {
          isPublic: false,
          allowVCs: true,
          allowExchanges: false,
          allowIDOs: false
        }
      };

      const docRef = await addDoc(collection(db!, 'pitches'), pitch);
      
      logger.info('Pitch created', {
        pitchId: docRef.id,
        founderId,
        title: pitchData.title
      });

      return docRef.id;
    } catch (error) {
      logger.error('Failed to create pitch', { error: error.message, founderId });
      throw error;
    }
  }

  // Update pitch
  static async updatePitch(
    pitchId: string,
    updates: Partial<Omit<Pitch, 'id' | 'founderId' | 'founderName' | 'createdAt'>>,
    updatedBy: string
  ): Promise<void> {
    try {
      const pitchRef = doc(db!, 'pitches', pitchId);
      await updateDoc(pitchRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });

      logger.info('Pitch updated', { pitchId, updatedBy });
    } catch (error) {
      logger.error('Failed to update pitch', { error: error.message, pitchId });
      throw error;
    }
  }

  // Submit pitch for review
  static async submitPitch(pitchId: string, founderId: string): Promise<void> {
    try {
      const pitchRef = doc(db!, 'pitches', pitchId);
      await updateDoc(pitchRef, {
        status: 'submitted',
        submittedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      logger.info('Pitch submitted for review', { pitchId, founderId });
    } catch (error) {
      logger.error('Failed to submit pitch', { error: error.message, pitchId });
      throw error;
    }
  }

  // Review pitch (admin/VC only)
  static async reviewPitch(
    pitchId: string,
    reviewerId: string,
    status: 'approved' | 'rejected',
    reviewNotes?: string
  ): Promise<void> {
    try {
      const pitchRef = doc(db!, 'pitches', pitchId);
      await updateDoc(pitchRef, {
        status,
        reviewedAt: serverTimestamp(),
        reviewedBy: reviewerId,
        reviewNotes,
        updatedAt: serverTimestamp()
      });

      logger.info('Pitch reviewed', { pitchId, reviewerId, status });
    } catch (error) {
      logger.error('Failed to review pitch', { error: error.message, pitchId });
      throw error;
    }
  }

  // Get pitch by ID
  static async getPitch(pitchId: string): Promise<Pitch | null> {
    try {
      const pitchRef = doc(db!, 'pitches', pitchId);
      const snapshot = await getDoc(pitchRef);
      
      if (!snapshot.exists()) return null;
      
      return {
        id: snapshot.id,
        ...snapshot.data()
      } as Pitch;
    } catch (error) {
      logger.error('Failed to get pitch', { error: error.message, pitchId });
      throw error;
    }
  }

  // Get pitches by founder
  static async getFounderPitches(founderId: string): Promise<Pitch[]> {
    try {
      const q = query(
        collection(db!, 'pitches'),
        where('founderId', '==', founderId),
        orderBy('updatedAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Pitch));
    } catch (error) {
      logger.error('Failed to get founder pitches', { error: error.message, founderId });
      throw error;
    }
  }

  // Get public pitches (for VCs, Exchanges, IDOs)
  static async getPublicPitches(
    userRole: Role,
    filters?: {
      status?: string[];
      category?: string;
      industry?: string;
      tags?: string[];
      limit?: number;
    }
  ): Promise<Pitch[]> {
    try {
      let q = query(
        collection(db!, 'pitches'),
        where('visibility.isPublic', '==', true)
      );

      // Role-based visibility
      if (userRole === 'vc' && !filters?.status?.includes('approved')) {
        q = query(q, where('visibility.allowVCs', '==', true));
      } else if (userRole === 'exchange') {
        q = query(q, where('visibility.allowExchanges', '==', true));
      } else if (userRole === 'ido') {
        q = query(q, where('visibility.allowIDOs', '==', true));
      }

      // Apply filters
      if (filters?.status && filters.status.length > 0) {
        q = query(q, where('status', 'in', filters.status));
      }

      if (filters?.category) {
        q = query(q, where('category', '==', filters.category));
      }

      if (filters?.industry) {
        q = query(q, where('industry', '==', filters.industry));
      }

      q = query(q, orderBy('updatedAt', 'desc'));

      if (filters?.limit) {
        q = query(q, limit(filters.limit));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Pitch));
    } catch (error) {
      logger.error('Failed to get public pitches', { error: error.message, userRole });
      throw error;
    }
  }

  // Add comment to pitch
  static async addComment(
    pitchId: string,
    authorId: string,
    authorName: string,
    authorRole: Role,
    content: string,
    isInternal: boolean = false
  ): Promise<string> {
    try {
      const comment: Omit<PitchComment, 'id'> = {
        pitchId,
        authorId,
        authorName,
        authorRole,
        content,
        createdAt: serverTimestamp() as Timestamp,
        isInternal
      };

      const docRef = await addDoc(collection(db!, 'pitch_comments'), comment);
      
      logger.info('Pitch comment added', {
        commentId: docRef.id,
        pitchId,
        authorId,
        isInternal
      });

      return docRef.id;
    } catch (error) {
      logger.error('Failed to add pitch comment', { error: error.message, pitchId });
      throw error;
    }
  }

  // Get pitch comments
  static async getPitchComments(pitchId: string, userId: string, userRole: Role): Promise<PitchComment[]> {
    try {
      let q = query(
        collection(db!, 'pitch_comments'),
        where('pitchId', '==', pitchId),
        orderBy('createdAt', 'asc')
      );

      const snapshot = await getDocs(q);
      let comments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as PitchComment));

      // Filter internal comments based on user role
      if (userRole !== 'admin') {
        const pitch = await this.getPitch(pitchId);
        const isFounder = pitch?.founderId === userId;
        
        comments = comments.filter(comment => 
          !comment.isInternal || isFounder
        );
      }

      return comments;
    } catch (error) {
      logger.error('Failed to get pitch comments', { error: error.message, pitchId });
      throw error;
    }
  }

  // Record pitch interaction
  static async recordInteraction(
    pitchId: string,
    userId: string,
    userRole: Role,
    action: PitchInteraction['action'],
    metadata?: Record<string, any>
  ): Promise<string> {
    try {
      const interaction: Omit<PitchInteraction, 'id'> = {
        pitchId,
        userId,
        userRole,
        action,
        createdAt: serverTimestamp() as Timestamp,
        metadata
      };

      const docRef = await addDoc(collection(db!, 'pitch_interactions'), interaction);
      
      logger.info('Pitch interaction recorded', {
        interactionId: docRef.id,
        pitchId,
        userId,
        action
      });

      return docRef.id;
    } catch (error) {
      logger.error('Failed to record pitch interaction', { error: error.message, pitchId });
      throw error;
    }
  }

  // Get pitch interactions
  static async getPitchInteractions(pitchId: string): Promise<PitchInteraction[]> {
    try {
      const q = query(
        collection(db!, 'pitch_interactions'),
        where('pitchId', '==', pitchId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as PitchInteraction));
    } catch (error) {
      logger.error('Failed to get pitch interactions', { error: error.message, pitchId });
      throw error;
    }
  }

  // Subscribe to pitch updates
  static subscribeToPitch(
    pitchId: string,
    callback: (pitch: Pitch | null) => void
  ): () => void {
    const pitchRef = doc(db!, 'pitches', pitchId);
    
    return onSnapshot(pitchRef, (snapshot) => {
      if (snapshot.exists()) {
        const pitch = {
          id: snapshot.id,
          ...snapshot.data()
        } as Pitch;
        callback(pitch);
      } else {
        callback(null);
      }
    }, (error) => {
      logger.error('Failed to subscribe to pitch', { error: error.message, pitchId });
    });
  }

  // Subscribe to founder's pitches
  static subscribeToFounderPitches(
    founderId: string,
    callback: (pitches: Pitch[]) => void
  ): () => void {
    const q = query(
      collection(db!, 'pitches'),
      where('founderId', '==', founderId),
      orderBy('updatedAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const pitches = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Pitch));
      
      callback(pitches);
    }, (error) => {
      logger.error('Failed to subscribe to founder pitches', { error: error.message, founderId });
    });
  }

  // Delete pitch (founder or admin only)
  static async deletePitch(pitchId: string, deletedBy: string): Promise<void> {
    try {
      const pitchRef = doc(db!, 'pitches', pitchId);
      await deleteDoc(pitchRef);

      logger.info('Pitch deleted', { pitchId, deletedBy });
    } catch (error) {
      logger.error('Failed to delete pitch', { error: error.message, pitchId });
      throw error;
    }
  }

  // Check if user can access pitch
  static async canAccessPitch(pitchId: string, userId: string, userRole: Role): Promise<boolean> {
    try {
      const pitch = await this.getPitch(pitchId);
      if (!pitch) return false;

      // Founder can always access their own pitch
      if (pitch.founderId === userId) return true;

      // Admin can access all pitches
      if (userRole === 'admin') return true;

      // Check visibility based on role
      if (pitch.visibility.isPublic) {
        if (userRole === 'vc' && pitch.visibility.allowVCs) return true;
        if (userRole === 'exchange' && pitch.visibility.allowExchanges) return true;
        if (userRole === 'ido' && pitch.visibility.allowIDOs) return true;
      }

      return false;
    } catch (error) {
      logger.error('Failed to check pitch access', { error: error.message, pitchId, userId });
      return false;
    }
  }
}
