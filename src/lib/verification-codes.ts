// src/lib/verification-codes.ts
// Google Verification Code System for Department Team Members

import { db } from './firebase.client';
import { collection, addDoc, query, where, getDocs, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import crypto from 'crypto';

export interface VerificationCode {
  id: string;
  email: string;
  code: string; // Hashed
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
  usedAt?: Date;
}

// Generate 6-digit verification code
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Hash code for secure storage
function hashCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

// Create and send verification code
export async function createVerificationCode(email: string): Promise<{ success: boolean; code?: string; error?: string }> {
  try {
    const code = generateVerificationCode();
    const hashedCode = hashCode(code);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    // Delete any existing unused codes for this email
    await deleteExpiredCodes(email);
    
    // Create new code
    const codesRef = collection(db!, 'verification_codes');
    await addDoc(codesRef, {
      email: email.toLowerCase(),
      code: hashedCode,
      expiresAt,
      used: false,
      createdAt: serverTimestamp(),
    });
    
    console.log(`✅ Generated verification code for ${email}`);
    
    // Send email with code via API endpoint (server-side)
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://cryptorafts.com';
      const response = await fetch(`${baseUrl}/api/verification/send-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      
      if (!response.ok) {
        console.error('❌ Failed to send verification code email:', await response.text());
      } else {
        console.log(`✅ Verification code email sent to ${email}`);
      }
    } catch (error) {
      console.error('❌ Error sending verification code email:', error);
      // Don't fail the code generation if email fails - code is still valid
    }
    
    // For development, return the code
    // In production, only send via email
    return {
      success: true,
      code: process.env.NODE_ENV === 'development' ? code : undefined,
    };
  } catch (error) {
    console.error('Error creating verification code:', error);
    return {
      success: false,
      error: (error as Error).message || 'Failed to create verification code',
    };
  }
}

// Verify code
export async function verifyCode(email: string, code: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const hashedCode = hashCode(code);
    
    const codesRef = collection(db!, 'verification_codes');
    const q = query(
      codesRef,
      where('email', '==', email.toLowerCase()),
      where('code', '==', hashedCode),
      where('used', '==', false)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return {
        valid: false,
        error: 'Invalid verification code',
      };
    }
    
    const codeDoc = snapshot.docs[0];
    const data = codeDoc.data();
    
    // Check expiration
    const expiresAt = data.expiresAt?.toDate() || new Date(0);
    if (expiresAt < new Date()) {
      // Delete expired code
      await deleteDoc(doc(db!, 'verification_codes', codeDoc.id));
      return {
        valid: false,
        error: 'Verification code expired',
      };
    }
    
    // Mark code as used
    await deleteDoc(doc(db!, 'verification_codes', codeDoc.id));
    
    console.log(`✅ Verified code for ${email}`);
    
    return { valid: true };
  } catch (error) {
    console.error('Error verifying code:', error);
    return {
      valid: false,
      error: (error as Error).message || 'Failed to verify code',
    };
  }
}

// Delete expired codes for an email
async function deleteExpiredCodes(email: string): Promise<void> {
  try {
    const codesRef = collection(db!, 'verification_codes');
    const q = query(
      codesRef,
      where('email', '==', email.toLowerCase())
    );
    
    const snapshot = await getDocs(q);
    
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    
    if (snapshot.docs.length > 0) {
      console.log(`🗑️ Deleted ${snapshot.docs.length} old codes for ${email}`);
    }
  } catch (error) {
    console.error('Error deleting expired codes:', error);
  }
}

// Check if verification is required for this login
export async function requiresVerification(email: string, context: {
  isNewDevice?: boolean;
  isNewIp?: boolean;
  daysSinceLastLogin?: number;
  isSensitiveAction?: boolean;
}): Promise<boolean> {
  // Always require for new devices
  if (context.isNewDevice) {
    return true;
  }
  
  // Require for new IP addresses
  if (context.isNewIp) {
    return true;
  }
  
  // Require after 30 days of inactivity
  if (context.daysSinceLastLogin && context.daysSinceLastLogin > 30) {
    return true;
  }
  
  // Require for sensitive actions
  if (context.isSensitiveAction) {
    return true;
  }
  
  // First-time login always requires verification
  // This should be checked by caller
  
  return false;
}

// Send verification email (placeholder - implement with your email service)
async function sendVerificationEmail(email: string, code: string): Promise<void> {
  // TODO: Implement with your email service (SendGrid, AWS SES, etc.)
  console.log(`📧 Sending verification code to ${email}: ${code}`);
  
  // Example email content:
  const subject = 'CryptoRafts Verification Code';
  const body = `
    Your verification code is: ${code}
    
    This code will expire in 10 minutes.
    
    If you didn't request this code, please ignore this email.
    
    Best regards,
    CryptoRafts Team
  `;
  
  // await emailService.send({ to: email, subject, body });
}

// Cleanup expired codes (run periodically)
export async function cleanupExpiredCodes(): Promise<number> {
  try {
    const codesRef = collection(db!, 'verification_codes');
    const snapshot = await getDocs(codesRef);
    
    const now = new Date();
    let deletedCount = 0;
    
    const deletePromises = snapshot.docs
      .filter(doc => {
        const expiresAt = doc.data().expiresAt?.toDate();
        return expiresAt && expiresAt < now;
      })
      .map(doc => {
        deletedCount++;
        return deleteDoc(doc.ref);
      });
    
    await Promise.all(deletePromises);
    
    if (deletedCount > 0) {
      console.log(`🗑️ Cleaned up ${deletedCount} expired verification codes`);
    }
    
    return deletedCount;
  } catch (error) {
    console.error('Error cleaning up expired codes:', error);
    return 0;
  }
}

// Export verification functions
export const verification = {
  generate: createVerificationCode,
  verify: verifyCode,
  requiresVerification,
  cleanup: cleanupExpiredCodes,
  generateCode: generateVerificationCode,
};

