import * as admin from 'firebase-admin';
import { logger } from './logger.js';
import { DecisionType } from '../schemas.js';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n");

  if (projectId && clientEmail && privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    });
  } else {
    // Try to use default credentials
    admin.initializeApp();
  }
}

const db = admin.firestore();

export async function applyKycDecision(data: {
  userId: string;
  decision: DecisionType;
  vendorRef?: string;
  idempotencyKey?: string;
  requestId?: string;
}) {
  const { userId, decision, vendorRef, idempotencyKey, requestId } = data;
  
  try {
    // Update user document
    await db.doc(`users/${userId}`).set({
      kyc: {
        status: decision.status,
        riskScore: decision.riskScore,
        reasons: decision.reasons,
        vendorRef,
        updatedAt: Date.now()
      },
      updatedAt: Date.now()
    }, { merge: true });

    // Set custom claims
    await admin.auth().setCustomUserClaims(userId, {
      kycStatus: decision.status,
      profileCompleted: decision.status === 'approved'
    });

    // Write audit log
    await writeAudit({
      type: 'kyc_decision',
      userId,
      decision,
      vendorRef,
      idempotencyKey,
      requestId,
      timestamp: Date.now()
    });

    logger.info('KYC decision applied', {
      userId,
      status: decision.status,
      riskScore: decision.riskScore
    });

  } catch (error) {
    logger.error('Failed to apply KYC decision', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

export async function applyKybDecision(data: {
  orgId: string;
  decision: DecisionType;
  vendorRef?: string;
  idempotencyKey?: string;
  requestId?: string;
}) {
  const { orgId, decision, vendorRef, idempotencyKey, requestId } = data;
  
  try {
    // Update organization document
    await db.doc(`organizations/${orgId}`).set({
      kyb: {
        status: decision.status,
        riskScore: decision.riskScore,
        reasons: decision.reasons,
        vendorRef,
        updatedAt: Date.now()
      },
      updatedAt: Date.now()
    }, { merge: true });

    // Update all members' claims
    const orgDoc = await db.doc(`organizations/${orgId}`).get();
    if (orgDoc.exists) {
      const orgData = orgDoc.data();
      const members = orgData?.members || [];
      
      for (const memberId of members) {
        await admin.auth().setCustomUserClaims(memberId, {
          kybStatus: decision.status,
          profileCompleted: decision.status === 'approved'
        });
      }
    }

    // Write audit log
    await writeAudit({
      type: 'kyb_decision',
      orgId,
      decision,
      vendorRef,
      idempotencyKey,
      requestId,
      timestamp: Date.now()
    });

    logger.info('KYB decision applied', {
      orgId,
      status: decision.status,
      riskScore: decision.riskScore
    });

  } catch (error) {
    logger.error('Failed to apply KYB decision', {
      orgId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

export async function updateProjectRaftai(data: {
  projectId: string;
  raftai: any;
  idempotencyKey?: string;
  requestId?: string;
}) {
  const { projectId, raftai, idempotencyKey, requestId } = data;
  
  try {
    await db.doc(`projects/${projectId}`).set({
      raftai,
      updatedAt: Date.now()
    }, { merge: true });

    // Write audit log
    await writeAudit({
      type: 'pitch_analysis',
      projectId,
      raftai,
      idempotencyKey,
      requestId,
      timestamp: Date.now()
    });

    logger.info('Project RaftAI updated', {
      projectId,
      rating: raftai.rating,
      score: raftai.score
    });

  } catch (error) {
    logger.error('Failed to update project RaftAI', {
      projectId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

export async function writeAudit(data: any) {
  try {
    await db.collection('audit').add({
      ...data,
      immutable: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    logger.error('Failed to write audit log', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    // Don't throw - audit failures shouldn't break the main flow
  }
}

export { db };
