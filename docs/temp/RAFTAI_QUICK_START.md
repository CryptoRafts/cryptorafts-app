# 🚀 RaftAI Quick Start Guide

## ⚡ Get Started in 3 Minutes

### 1️⃣ Import RaftAI

```typescript
import { raftAI } from '@/lib/raftai';
```

That's it! RaftAI auto-initializes in the browser.

---

## 🔥 Common Use Cases

### ✅ Verify a User (KYC)

```typescript
const result = await raftAI.processKYC({
  userId: 'user_123',
  personalInfo: {
    fullName: 'John Doe',
    dateOfBirth: '1990-01-01',
    nationality: 'US',
    address: '123 Main Street, New York, NY 10001',
    phone: '+1234567890',
    email: 'john.doe@example.com',
  },
  documents: {
    idDocument: {
      type: 'passport',
      number: 'ABC123456',
      issueDate: '2020-01-01',
      expiryDate: '2030-01-01',
      issuingCountry: 'US',
      documentUrl: 'https://...',
    },
    selfieUrl: 'https://...',
  },
});

// Check result
if (result.status === 'approved') {
  console.log('✅ User verified!');
  console.log('Risk Score:', result.riskScore);
} else {
  console.log('❌ Verification failed:', result.reasons);
}
```

---

### 🏢 Verify a Company (KYB)

```typescript
const result = await raftAI.processKYB({
  organizationId: 'org_456',
  companyInfo: {
    legalName: 'Acme Corporation',
    registrationNumber: 'REG123456',
    taxId: 'TAX789',
    jurisdiction: 'US',
    incorporationDate: '2020-01-01',
    businessType: 'LLC',
    industry: 'Technology',
    address: '456 Business Ave, San Francisco, CA',
    website: 'https://acme.com',
    phone: '+1987654321',
    email: 'info@acme.com',
  },
  ownership: {
    beneficialOwners: [
      {
        name: 'Jane Smith',
        ownershipPercentage: 60,
        nationality: 'US',
        dateOfBirth: '1985-05-15',
        address: '789 Owner St',
      },
    ],
    directors: [
      {
        name: 'John Director',
        title: 'CEO',
        nationality: 'US',
        appointmentDate: '2020-01-01',
      },
    ],
  },
  documents: {},
});

console.log('KYB Status:', result.status);
console.log('Risk Score:', result.riskScore);
```

---

### 📊 Analyze a Pitch

```typescript
const analysis = await raftAI.analyzePitch({
  projectId: 'proj_789',
  founderId: 'founder_123',
  pitch: {
    title: 'DeFi Revolution',
    description: 'Revolutionary DeFi protocol...',
    problem: 'Current DeFi platforms are too complex...',
    solution: 'Our solution simplifies...',
    targetMarket: 'DeFi users worldwide...',
    businessModel: 'Transaction fees + governance...',
    tokenomics: {
      totalSupply: 1000000000,
      allocation: {
        team: 20,
        investors: 15,
        community: 40,
        treasury: 25,
      },
      utility: 'Governance and fee discounts',
    },
    team: [
      {
        name: 'Founder Name',
        role: 'CEO',
        experience: '10 years in blockchain',
        linkedIn: 'https://linkedin.com/in/...',
      },
    ],
    roadmap: [
      { milestone: 'MVP Launch', date: '2024-Q1', status: 'completed' },
      { milestone: 'Mainnet', date: '2024-Q2', status: 'in-progress' },
    ],
    financials: {
      fundingTarget: 5000000,
      currentFunding: 1000000,
    },
  },
  documents: {
    whitepaper: 'https://...',
    pitchDeck: 'https://...',
  },
});

console.log('Rating:', analysis.rating); // 'high' | 'normal' | 'low'
console.log('Score:', analysis.score); // 0-100
console.log('Summary:', analysis.summary);
console.log('Strengths:', analysis.strengths);
console.log('Risks:', analysis.risks);
```

---

### 💬 Chat with RaftAI

```typescript
const response = await raftAI.chat(
  {
    sessionId: 'session_abc',
    chatRoomId: 'room_xyz',
    userId: 'user_123',
    userRole: 'founder',
    participants: ['user_123', 'vc_456'],
    projectId: 'proj_789',
  },
  'What are the main risks with this project?'
);

console.log(response.content);

// Or use commands:
const briefResponse = await raftAI.chat(context, '/raftai brief');
const risksResponse = await raftAI.chat(context, '/raftai risks');
```

---

### 🎥 Verify Video (Liveness)

```typescript
const result = await raftAI.verifyVideo({
  userId: 'user_123',
  sessionId: 'session_abc',
  videoStream: 'https://stream-url...',
  referenceBiometric: 'stored-face-hash',
});

console.log('Status:', result.status); // 'verified_real' | 'suspicious' | 'fake'
console.log('Confidence:', result.confidence);
```

---

### 📈 Get Counterparty Score

```typescript
const score = await raftAI.getCounterpartyScore(
  'entity_123',
  'founder' // or 'exchange', 'influencer', 'investor', 'market_maker'
);

console.log('Score:', score.scores);
console.log('Risk Level:', score.indicators.riskLevel);
console.log('Badges:', score.badges);
console.log('Recommendations:', score.recommendations);
```

---

## 🌐 Use via API Routes

### KYC Verification
```bash
curl -X POST http://localhost:3000/api/raftai/kyc \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_123",
    "personalInfo": {...},
    "documents": {...}
  }'
```

### Pitch Analysis
```bash
curl -X POST http://localhost:3000/api/raftai/pitch \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "proj_789",
    "founderId": "founder_123",
    "pitch": {...}
  }'
```

### Get Score
```bash
curl http://localhost:3000/api/raftai/score?entityId=entity_123&entityType=founder
```

### System Health
```bash
curl http://localhost:3000/api/raftai/health
```

---

## 🎨 Display in UI

### Show Status Badge
```tsx
import { RaftAIBadge } from '@/components/raftai/RaftAIBadge';

<RaftAIBadge 
  type="kyc" 
  status="approved" 
  score={95} 
  showScore 
/>
```

### Show Admin Dashboard
```tsx
import { RaftAIDashboard } from '@/components/raftai/RaftAIDashboard';

<RaftAIDashboard />
```

---

## 🔔 Real-Time Updates

### Subscribe to KYC Updates
```typescript
const unsubscribe = raftAI.subscribeToKYCUpdates('user_123', (results) => {
  console.log('KYC updated:', results);
  // Update UI automatically
});

// Later, unsubscribe
unsubscribe();
```

### Subscribe to System Health
```typescript
raftAI.subscribeToSystemHealth((health) => {
  console.log('System status:', health.status);
  console.log('Uptime:', health.uptime);
});
```

---

## 🧪 Test in Browser Console

Open browser console and try:

```javascript
// Check system status
window.raftAI.status()

// Test KYC flow
window.raftAI.testKYC('user_123')

// View configuration
window.raftAI.config()

// Access RaftAI directly
window.raftAI.core
```

---

## 📊 Check Results

All results are automatically saved to Firebase:

```typescript
// Get KYC history
const history = await raftAI.getKYCHistory('user_123');

// Get pitch analysis history
const pitchHistory = await raftAI.getPitchHistory('proj_789');

// Get audit trail
const audit = await raftAI.getAuditTrail('entity_123');
```

---

## ⚙️ Configuration

Set environment variables in `.env.local`:

```env
# Required for AI features (optional for now)
OPENAI_API_KEY=sk-...

# Required for production KYC/KYB (optional for now)
ONFIDO_API_KEY=...
SUMSUB_API_KEY=...

# Webhook security
RAFTAI_WEBHOOK_SECRET=your-secret-key

# Firebase Admin (already configured)
FIREBASE_ADMIN_PROJECT_ID=...
FIREBASE_ADMIN_CLIENT_EMAIL=...
FIREBASE_ADMIN_PRIVATE_KEY=...
```

---

## ✅ Status Meanings

### KYC/KYB Status
- **approved** ✅ - Verification passed, low risk
- **pending** ⏳ - Requires manual review
- **rejected** ❌ - Failed verification, cooldown active

### Pitch Rating
- **high** 🌟 - Excellent opportunity, high potential
- **normal** 📊 - Good opportunity, moderate potential
- **low** ⚠️ - Needs improvement before consideration

### Risk Level
- **low** ✅ - Minimal risk, proceed with confidence
- **medium** ⚠️ - Moderate risk, due diligence recommended
- **high** 🚨 - Significant risk, caution advised
- **critical** ❌ - Severe risk, avoid or escalate

---

## 🎯 Common Patterns

### Verify User Before Allowing Actions
```typescript
async function checkUserVerification(userId: string) {
  const history = await raftAI.getKYCHistory(userId);
  const latest = history[0];
  
  if (!latest || latest.status !== 'approved') {
    throw new Error('User must complete KYC verification');
  }
  
  if (latest.riskScore > 70) {
    throw new Error('User risk score too high');
  }
  
  return true;
}
```

### Show Pitch Analysis to Investors
```typescript
async function displayPitchToInvestor(projectId: string) {
  const history = await raftAI.getPitchHistory(projectId);
  const analysis = history[0];
  
  return {
    rating: analysis.rating,
    score: analysis.score,
    summary: analysis.summary,
    shouldHighlight: analysis.visibility.shouldHighlight,
  };
}
```

### Moderate Chat Message Before Sending
```typescript
async function sendMessage(context: ChatContext, message: string) {
  const moderation = await raftAI.moderateMessage(message, context);
  
  if (!moderation.allowed) {
    // Show warning to user
    return {
      error: 'Message flagged',
      flags: moderation.flags,
      suggestedEdit: moderation.suggestedEdits,
    };
  }
  
  // Send message
  await saveMessageToChat(message);
}
```

---

## 📚 Learn More

- **Complete Documentation:** `src/lib/raftai/README.md`
- **System Overview:** `RAFTAI_COMPLETE_SYSTEM.md`
- **API Reference:** Check each route file in `src/app/api/raftai/`
- **Type Definitions:** `src/lib/raftai/types.ts`

---

## 🆘 Troubleshooting

**Issue:** "RaftAI not initialized"  
**Solution:** Call `await raftAI.initialize()` or wait for auto-init in browser

**Issue:** "Firebase not initialized"  
**Solution:** Ensure Firebase config is set in environment variables

**Issue:** "API endpoint not found"  
**Solution:** Check that API routes are in `src/app/api/raftai/` directory

**Issue:** "Webhook signature invalid"  
**Solution:** Set `RAFTAI_WEBHOOK_SECRET` in environment

---

## 🎉 You're Ready!

RaftAI is fully integrated and ready to use. Start with a simple KYC verification and explore from there!

```typescript
import { raftAI } from '@/lib/raftai';

// Your first RaftAI call
const result = await raftAI.processKYC({...});
console.log('Result:', result);
```

**Happy building! 🚀**
