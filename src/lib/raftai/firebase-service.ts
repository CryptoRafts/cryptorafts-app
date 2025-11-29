/**
 * RaftAI Firebase Integration Service
 * Handles all Firebase operations for RaftAI
 */

import { db } from '../firebase.client';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit as firestoreLimit,
  serverTimestamp,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { RAFTAI_CONFIG } from './config';
import type {
  KYCRequest,
  KYCResult,
  KYBRequest,
  KYBResult,
  PitchAnalysisRequest,
  PitchAnalysisResult,
  AuditEntry,
  CounterpartyScore,
  ChatContext,
  ChatResponse,
  VideoVerificationResult,
  ComplianceResult,
  AnomalyDetection,
  SystemHealth,
} from './types';

export class RaftAIFirebaseService {
  private static instance: RaftAIFirebaseService;

  private constructor() {}

  static getInstance(): RaftAIFirebaseService {
    if (!RaftAIFirebaseService.instance) {
      RaftAIFirebaseService.instance = new RaftAIFirebaseService();
    }
    return RaftAIFirebaseService.instance;
  }

  // ==================== KYC OPERATIONS ====================

  async saveKYCRequest(request: KYCRequest): Promise<string> {
    if (!db) throw new Error('Firebase not initialized');
    
    const docRef = await addDoc(
      collection(db!, RAFTAI_CONFIG.collections.kycRequests),
      {
        ...request,
        createdAt: serverTimestamp(),
        status: 'pending',
      }
    );
    
    return docRef.id;
  }

  async saveKYCResult(result: KYCResult): Promise<void> {
    if (!db) throw new Error('Firebase not initialized');
    
    await setDoc(
      doc(db!, RAFTAI_CONFIG.collections.kycResults, result.requestId),
      {
        ...result,
        savedAt: serverTimestamp(),
      }
    );

    // Update user document with KYC status
    await this.updateUserKYCStatus(result.userId, result.status, result.riskScore);
  }

  async getKYCResult(requestId: string): Promise<KYCResult | null> {
    if (!db) throw new Error('Firebase not initialized');
    
    const docRef = doc(db!, RAFTAI_CONFIG.collections.kycResults, requestId);
    const docSnap = await getDoc(docRef);
    
    return docSnap.exists() ? (docSnap.data() as KYCResult) : null;
  }

  async getUserKYCHistory(userId: string, limitCount = 10): Promise<KYCResult[]> {
    if (!db) throw new Error('Firebase not initialized');
    
    const q = query(
      collection(db!, RAFTAI_CONFIG.collections.kycResults),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      firestoreLimit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as KYCResult);
  }

  // ==================== KYB OPERATIONS ====================

  async saveKYBRequest(request: KYBRequest): Promise<string> {
    if (!db) throw new Error('Firebase not initialized');
    
    const docRef = await addDoc(
      collection(db!, RAFTAI_CONFIG.collections.kybRequests),
      {
        ...request,
        createdAt: serverTimestamp(),
        status: 'pending',
      }
    );
    
    return docRef.id;
  }

  async saveKYBResult(result: KYBResult): Promise<void> {
    if (!db) throw new Error('Firebase not initialized');
    
    await setDoc(
      doc(db!, RAFTAI_CONFIG.collections.kybResults, result.requestId),
      {
        ...result,
        savedAt: serverTimestamp(),
      }
    );

    // Update organization document with KYB status
    await this.updateOrganizationKYBStatus(
      result.organizationId, 
      result.status, 
      result.riskScore
    );
  }

  async getKYBResult(requestId: string): Promise<KYBResult | null> {
    if (!db) throw new Error('Firebase not initialized');
    
    const docRef = doc(db!, RAFTAI_CONFIG.collections.kybResults, requestId);
    const docSnap = await getDoc(docRef);
    
    return docSnap.exists() ? (docSnap.data() as KYBResult) : null;
  }

  // ==================== PITCH ANALYSIS OPERATIONS ====================

  async savePitchAnalysis(analysis: PitchAnalysisResult): Promise<void> {
    if (!db) throw new Error('Firebase not initialized');
    
    await setDoc(
      doc(db!, RAFTAI_CONFIG.collections.pitchAnalyses, analysis.requestId),
      {
        ...analysis,
        savedAt: serverTimestamp(),
      }
    );

    // Update project with analysis results
    await this.updateProjectAnalysis(analysis.projectId, analysis);
  }

  async getPitchAnalysis(requestId: string): Promise<PitchAnalysisResult | null> {
    if (!db) throw new Error('Firebase not initialized');
    
    const docRef = doc(db!, RAFTAI_CONFIG.collections.pitchAnalyses, requestId);
    const docSnap = await getDoc(docRef);
    
    return docSnap.exists() ? (docSnap.data() as PitchAnalysisResult) : null;
  }

  async getProjectPitchHistory(projectId: string): Promise<PitchAnalysisResult[]> {
    if (!db) throw new Error('Firebase not initialized');
    
    const q = query(
      collection(db!, RAFTAI_CONFIG.collections.pitchAnalyses),
      where('projectId', '==', projectId),
      orderBy('timestamp', 'desc'),
      firestoreLimit(5)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as PitchAnalysisResult);
  }

  // ==================== CHAT OPERATIONS ====================

  async saveChatInteraction(
    context: ChatContext,
    userMessage: string,
    aiResponse: ChatResponse
  ): Promise<void> {
    if (!db) throw new Error('Firebase not initialized');
    
    await addDoc(collection(db!, RAFTAI_CONFIG.collections.chatInteractions), {
      sessionId: context.sessionId,
      chatRoomId: context.chatRoomId,
      userId: context.userId,
      userRole: context.userRole,
      userMessage,
      aiResponse,
      timestamp: serverTimestamp(),
    });
  }

  async saveModerationResult(
    chatRoomId: string,
    userId: string,
    message: string,
    moderationResult: any
  ): Promise<void> {
    if (!db) throw new Error('Firebase not initialized');
    
    await addDoc(collection(db!, RAFTAI_CONFIG.collections.chatModerations), {
      chatRoomId,
      userId,
      message,
      moderationResult,
      timestamp: serverTimestamp(),
    });
  }

  // ==================== VIDEO VERIFICATION OPERATIONS ====================

  async saveVideoVerification(result: VideoVerificationResult): Promise<void> {
    if (!db) throw new Error('Firebase not initialized');
    
    await setDoc(
      doc(db!, RAFTAI_CONFIG.collections.videoVerifications, result.requestId),
      {
        ...result,
        savedAt: serverTimestamp(),
      }
    );
  }

  // ==================== COMPLIANCE OPERATIONS ====================

  async saveComplianceCheck(result: ComplianceResult): Promise<void> {
    if (!db) throw new Error('Firebase not initialized');
    
    await addDoc(collection(db!, RAFTAI_CONFIG.collections.complianceChecks), {
      ...result,
      savedAt: serverTimestamp(),
    });
  }

  // ==================== AUDIT OPERATIONS ====================

  async saveAuditEntry(entry: AuditEntry): Promise<void> {
    if (!db) throw new Error('Firebase not initialized');
    
    await setDoc(
      doc(db!, RAFTAI_CONFIG.collections.auditLogs, entry.auditId),
      {
        ...entry,
        savedAt: serverTimestamp(),
        immutable: true,
      }
    );
  }

  async getAuditTrail(entityId: string, limitCount = 50): Promise<AuditEntry[]> {
    if (!db) throw new Error('Firebase not initialized');
    
    const q = query(
      collection(db!, RAFTAI_CONFIG.collections.auditLogs),
      where('entityId', '==', entityId),
      orderBy('timestamp', 'desc'),
      firestoreLimit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as AuditEntry);
  }

  // ==================== COUNTERPARTY SCORING OPERATIONS ====================

  async saveCounterpartyScore(score: CounterpartyScore): Promise<void> {
    if (!db) throw new Error('Firebase not initialized');
    
    await setDoc(
      doc(db!, RAFTAI_CONFIG.collections.counterpartyScores, score.entityId),
      {
        ...score,
        savedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }

  async getCounterpartyScore(entityId: string): Promise<CounterpartyScore | null> {
    if (!db) throw new Error('Firebase not initialized');
    
    const docRef = doc(db!, RAFTAI_CONFIG.collections.counterpartyScores, entityId);
    const docSnap = await getDoc(docRef);
    
    return docSnap.exists() ? (docSnap.data() as CounterpartyScore) : null;
  }

  // ==================== ANOMALY DETECTION OPERATIONS ====================

  async saveAnomalyDetection(anomaly: AnomalyDetection): Promise<void> {
    if (!db) throw new Error('Firebase not initialized');
    
    await addDoc(collection(db!, RAFTAI_CONFIG.collections.anomalyDetections), {
      ...anomaly,
      savedAt: serverTimestamp(),
    });

    // Lower trust rating for the entity
    await this.adjustEntityTrustRating(anomaly.entityId, -10);
  }

  async getEntityAnomalies(entityId: string): Promise<AnomalyDetection[]> {
    if (!db) throw new Error('Firebase not initialized');
    
    const q = query(
      collection(db!, RAFTAI_CONFIG.collections.anomalyDetections),
      where('entityId', '==', entityId),
      orderBy('timestamp', 'desc'),
      firestoreLimit(20)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as AnomalyDetection);
  }

  // ==================== SYSTEM HEALTH OPERATIONS ====================

  async updateSystemHealth(health: SystemHealth): Promise<void> {
    if (!db) throw new Error('Firebase not initialized');
    
    await setDoc(
      doc(db!, RAFTAI_CONFIG.collections.systemHealth, 'current'),
      {
        ...health,
        lastUpdated: serverTimestamp(),
      }
    );
  }

  async getSystemHealth(): Promise<SystemHealth | null> {
    if (!db) throw new Error('Firebase not initialized');
    
    const docRef = doc(db!, RAFTAI_CONFIG.collections.systemHealth, 'current');
    const docSnap = await getDoc(docRef);
    
    return docSnap.exists() ? (docSnap.data() as SystemHealth) : null;
  }

  // ==================== HELPER METHODS ====================

  private async updateUserKYCStatus(
    userId: string,
    status: string,
    riskScore: number
  ): Promise<void> {
    if (!db) throw new Error('Firebase not initialized');
    
    await updateDoc(doc(db!, 'users', userId), {
      'kyc.status': status,
      'kyc.riskScore': riskScore,
      'kyc.lastUpdated': serverTimestamp(),
      'kyc.verified': status === 'approved',
    });
  }

  private async updateOrganizationKYBStatus(
    organizationId: string,
    status: string,
    riskScore: number
  ): Promise<void> {
    if (!db) throw new Error('Firebase not initialized');
    
    await updateDoc(doc(db!, 'users', organizationId), {
      'kyb.status': status,
      'kyb.riskScore': riskScore,
      'kyb.lastUpdated': serverTimestamp(),
      'kyb.verified': status === 'approved',
    });
  }

  private async updateProjectAnalysis(
    projectId: string,
    analysis: PitchAnalysisResult
  ): Promise<void> {
    if (!db) throw new Error('Firebase not initialized');
    
    try {
      await updateDoc(doc(db!, 'projects', projectId), {
        'raftai.rating': analysis.rating,
        'raftai.score': analysis.score,
        'raftai.summary': analysis.summary,
        'raftai.visibility': analysis.visibility,
        'raftai.lastAnalyzed': serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating project analysis:', error);
    }
  }

  private async adjustEntityTrustRating(
    entityId: string,
    adjustment: number
  ): Promise<void> {
    if (!db) throw new Error('Firebase not initialized');
    
    const scoreDoc = await this.getCounterpartyScore(entityId);
    if (scoreDoc) {
      // Update trust rating (ensure it stays within 0-100)
      const currentScore = scoreDoc.scores.complianceRisk || 50;
      const newScore = Math.max(0, Math.min(100, currentScore + adjustment));
      
      await this.saveCounterpartyScore({
        ...scoreDoc,
        scores: {
          ...scoreDoc.scores,
          complianceRisk: newScore,
        },
        lastUpdated: Date.now(),
      });
    }
  }

  // ==================== REAL-TIME SUBSCRIPTIONS ====================

  subscribeToKYCUpdates(
    userId: string,
    callback: (results: KYCResult[]) => void
  ): () => void {
    if (!db) throw new Error('Firebase not initialized');
    
    const q = query(
      collection(db!, RAFTAI_CONFIG.collections.kycResults),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      firestoreLimit(5)
    );
    
    return onSnapshot(q, (snapshot) => {
      const results = snapshot.docs.map(doc => doc.data() as KYCResult);
      callback(results);
    });
  }

  subscribeToSystemHealth(callback: (health: SystemHealth) => void): () => void {
    if (!db) throw new Error('Firebase not initialized');
    
    const docRef = doc(db!, RAFTAI_CONFIG.collections.systemHealth, 'current');
    
    return onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data() as SystemHealth);
      }
    });
  }
}

// Export singleton instance
export const raftaiFirebase = RaftAIFirebaseService.getInstance();

