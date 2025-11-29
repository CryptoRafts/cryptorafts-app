/**
 * RaftAI Configuration - Secure API Integration
 * NEVER log or expose the API key
 */

// Get API key from environment - NEVER hardcode
const RAFT_AI_API_KEY = process.env.RAFT_AI_API_KEY || process.env.NEXT_PUBLIC_RAFT_AI_API_KEY;

if (!RAFT_AI_API_KEY) {
  console.warn('⚠️ RAFT_AI_API_KEY not configured');
}

export const raftAIConfig = {
  apiKey: RAFT_AI_API_KEY,
  baseURL: 'https://api.raftai.com/v1', // Adjust based on actual RaftAI endpoint
  timeout: 30000,
  maxRetries: 3
};

// Redact API key from logs
export const redactedConfig = {
  ...raftAIConfig,
  apiKey: raftAIConfig.apiKey ? `sk-...${raftAIConfig.apiKey.slice(-4)}` : 'NOT_SET'
};

// Security check
export const isRaftAIConfigured = (): boolean => {
  return Boolean(RAFT_AI_API_KEY && RAFT_AI_API_KEY.length > 20);
};

// Log configuration status (redacted)
console.log('🤖 RaftAI Config:', {
  configured: isRaftAIConfigured(),
  apiKey: redactedConfig.apiKey,
  baseURL: raftAIConfig.baseURL
});

