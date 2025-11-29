import { Router } from 'express';
import { decideKYC } from '../deciders/kyc.js';
import { applyKycDecision } from '../utils/firestore.js';
import { logger } from '../utils/logger.js';

const router = Router();

// Analyze KYC with cooldown enforcement
router.post('/analyze-kyc', async (req, res) => {
  try {
    const { userId, submissionId, documents, requestId, idempotencyKey } = req.body;

    if (!userId || !submissionId || !documents) {
      return res.status(400).json({ error: 'missing_required_fields' });
    }

    logger.info('Analyzing influencer KYC', { userId, submissionId });

    // Check for cooldown period
    const admin = await import('firebase-admin');
    const db = admin.default.firestore();
    
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    // Check cooldown
    const cooldownUntil = userData?.kyc?.cooldownUntil || 0;
    if (cooldownUntil > Date.now()) {
      const cooldownHours = Math.ceil((cooldownUntil - Date.now()) / (1000 * 60 * 60));
      
      logger.warn('KYC submission in cooldown period', { userId, cooldownHours });
      
      return res.status(429).json({
        error: 'in_cooldown',
        message: `Please wait ${cooldownHours} hours before resubmitting`,
        cooldownUntil
      });
    }

    // Perform KYC analysis
    const kycInput = {
      userId,
      documents: {
        idFront: documents.idFront,
        idBack: documents.idBack,
        proofOfAddress: documents.proofOfAddress,
        selfie: documents.selfie
      },
      vendorRef: submissionId,
      livenessScore: 0.95, // Simulated - would come from liveness check
      faceMatchScore: 0.92  // Simulated - would come from face matching
    };

    const decision = await decideKYC(kycInput);

    // Enforce cooldown if rejected
    if (decision.status === 'rejected') {
      decision.cooldownUntil = Date.now() + (24 * 60 * 60 * 1000); // 24 hours cooldown
    }

    // Apply decision to Firestore
    await applyKycDecision({
      userId,
      decision,
      vendorRef: submissionId,
      idempotencyKey,
      requestId
    });

    logger.info('KYC decision applied', {
      userId,
      status: decision.status,
      riskScore: decision.riskScore
    });

    // Trigger webhook to notify main app
    const webhookUrl = process.env.APP_WEBHOOK_URL || 'http://localhost:3000/api/influencer/kyc-webhook';
    const webhookSecret = process.env.KYC_WEBHOOK_SECRET || 'dev_secret_key';
    
    const crypto = await import('crypto');
    const payload = JSON.stringify({
      userId,
      submissionId,
      decision,
      vendorRef: submissionId,
      idempotencyKey,
      requestId,
      timestamp: Date.now()
    });

    const hmac = crypto.createHmac('sha256', webhookSecret);
    hmac.update(payload);
    const signature = hmac.digest('hex');

    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature
        },
        body: payload
      });
    } catch (webhookError) {
      logger.error('Webhook delivery failed', { error: webhookError });
      // Continue even if webhook fails - decision is already applied
    }

    res.json({ 
      success: true, 
      decision: {
        status: decision.status,
        riskScore: decision.riskScore,
        reasons: decision.reasons,
        cooldownUntil: decision.cooldownUntil || null
      }
    });
  } catch (error: any) {
    logger.error('Error analyzing KYC', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

export default router;

