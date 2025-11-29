/**
 * RaftAI Utility Functions
 * Helper functions for hashing, audit trails, and common operations
 */

import type { AuditEntry } from './types';

/**
 * Generate SHA-256 hash of content
 */
export function generateHash(content: string): string {
  // In production, use crypto.subtle.digest for proper SHA-256
  // For now, use a simple hash function
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(16, '0');
}

/**
 * Generate correlation ID for request tracking
 */
export function generateCorrelationId(): string {
  return `corr_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Generate audit ID
 */
export function generateAuditId(): string {
  return `audit_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Create audit entry for immutable logging
 */
export async function createAuditEntry(params: {
  requestType: string;
  entityId: string;
  userId?: string;
  action: string;
  input: any;
  output: any;
  decision: string;
  reasoning: string;
}): Promise<AuditEntry> {
  const auditId = generateAuditId();
  const correlationId = generateCorrelationId();
  
  const inputHash = generateHash(JSON.stringify(params.input));
  const outputHash = generateHash(JSON.stringify(params.output));
  
  // In production, use proper cryptographic signing
  const signatureContent = `${auditId}:${params.entityId}:${params.decision}:${Date.now()}`;
  const cryptographicSignature = generateHash(signatureContent);

  const entry: AuditEntry = {
    auditId,
    timestamp: Date.now(),
    requestType: params.requestType,
    entityId: params.entityId,
    userId: params.userId,
    action: params.action,
    inputHash,
    outputHash,
    decision: params.decision,
    reasoningSnapshot: params.reasoning,
    evidenceReferences: [],
    cryptographicSignature,
    correlationId,
  };

  return entry;
}

/**
 * Calculate risk score from multiple factors
 */
export function calculateRiskScore(factors: {
  name: string;
  value: number;
  weight: number;
}[]): number {
  const weightedSum = factors.reduce((sum, factor) => {
    return sum + (factor.value * factor.weight);
  }, 0);

  const totalWeight = factors.reduce((sum, factor) => sum + factor.weight, 0);
  
  return Math.round(weightedSum / totalWeight);
}

/**
 * Redact PII from text
 */
export function redactPII(text: string): string {
  // Email
  text = text.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[REDACTED_EMAIL]');
  
  // Phone numbers (various formats)
  text = text.replace(/\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, '[REDACTED_PHONE]');
  text = text.replace(/\b\+\d{1,3}[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}\b/g, '[REDACTED_PHONE]');
  
  // SSN
  text = text.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[REDACTED_SSN]');
  
  // Credit card (basic pattern)
  text = text.replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, '[REDACTED_CARD]');
  
  // IP addresses
  text = text.replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[REDACTED_IP]');
  
  return text;
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toISOString();
}

/**
 * Calculate confidence from multiple checks
 */
export function calculateAverageConfidence(confidences: number[]): number {
  if (confidences.length === 0) return 0;
  const sum = confidences.reduce((acc, val) => acc + val, 0);
  return Math.round(sum / confidences.length);
}

/**
 * Validate HMAC signature for webhooks
 */
export function validateHMACSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  // In production, use proper HMAC validation with crypto
  const expectedSignature = generateHash(payload + secret);
  return expectedSignature === signature;
}

/**
 * Generate idempotency key
 */
export function generateIdempotencyKey(
  type: string,
  userId: string,
  data: any
): string {
  const content = `${type}_${userId}_${JSON.stringify(data)}_${Date.now()}`;
  return generateHash(content);
}

/**
 * Check if timestamp is within cooldown period
 */
export function isInCooldown(cooldownUntil?: number): boolean {
  if (!cooldownUntil) return false;
  return cooldownUntil > Date.now();
}

/**
 * Calculate remaining cooldown time in milliseconds
 */
export function getRemainingCooldown(cooldownUntil?: number): number {
  if (!cooldownUntil) return 0;
  const remaining = cooldownUntil - Date.now();
  return Math.max(0, remaining);
}

/**
 * Format cooldown time for human reading
 */
export function formatCooldownTime(milliseconds: number): string {
  const days = Math.floor(milliseconds / (24 * 60 * 60 * 1000));
  const hours = Math.floor((milliseconds % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((milliseconds % (60 * 60 * 1000)) / (60 * 1000));

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/**
 * Sanitize user input
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Validate URL format
 */
export function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Deep clone object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError!;
}

/**
 * Rate limit check
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private limit: number;
  private windowMs: number;

  constructor(limit: number, windowMs: number) {
    this.limit = limit;
    this.windowMs = windowMs;
  }

  check(key: string): boolean {
    const now = Date.now();
    const userRequests = this.requests.get(key) || [];
    
    // Filter out old requests outside the window
    const recentRequests = userRequests.filter(time => now - time < this.windowMs);
    
    if (recentRequests.length >= this.limit) {
      return false;
    }
    
    recentRequests.push(now);
    this.requests.set(key, recentRequests);
    return true;
  }

  reset(key: string): void {
    this.requests.delete(key);
  }
}

/**
 * Truncate text to max length
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Check if processing time exceeds threshold
 */
export function isProcessingSlow(processingTime: number, threshold: number = 5000): boolean {
  return processingTime > threshold;
}

/**
 * Generate random string
 */
export function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Mask sensitive data
 */
export function maskSensitiveData(data: string, visibleChars: number = 4): string {
  if (data.length <= visibleChars) return '*'.repeat(data.length);
  return data.substring(0, visibleChars) + '*'.repeat(data.length - visibleChars);
}

