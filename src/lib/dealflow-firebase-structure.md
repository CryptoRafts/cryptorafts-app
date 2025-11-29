# Dealflow Firebase Data Structure

## Project Document Structure

When creating or updating projects in Firebase, include the following fields for the Dealflow page:

```typescript
{
  // Basic Project Info
  title: string; // or name
  sector: string; // Category: DeFi, GameFi, NFT, Infrastructure, Metaverse
  chain: string; // Blockchain: Ethereum, BSC, Polygon, etc.
  description: string; // Full description
  valueProposition: string; // or valuePropOneLine
  logo: string; // URL to project logo
  
  // Visibility (Required for Dealflow)
  visibility: {
    discoverable: true, // Must be true to appear in dealflow
    publicFields: ['title', 'sector', 'chain', 'description', 'funding', 'ido', 'badges']
  },
  
  // Funding Information
  funding: {
    target: number; // Target funding amount in USD
    raised: number; // Current raised amount in USD
    currency: string; // Default: 'USD'
    investorCount: number; // Total number of investors
  },
  
  // IDO Information
  ido: {
    status: 'upcoming' | 'live' | 'completed';
    startDate: Timestamp; // Firestore Timestamp
    endDate: Timestamp; // Firestore Timestamp
    exchange: string; // e.g., 'Binance Launchpad', 'Seedify'
    platform: string; // e.g., 'Cryptorafts Launch'
  },
  
  // Compliance & Verification
  compliance: {
    status: 'compliant' | 'under_review' | 'pending';
    certikLink: string; // Optional: URL to Certik audit
    kycStatus: 'verified' | 'pending' | 'not_submitted';
    kybStatus: 'verified' | 'pending' | 'not_submitted';
  },
  
  // Badges (Alternative to compliance)
  badges: {
    kyc: boolean;
    kyb: boolean;
    audit: boolean; // Has audit report
    doxxed: boolean; // Team is doxxed
  },
  
  // Social Links
  social: {
    website: string;
    twitter: string;
    telegram: string;
    discord: string;
  },
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## Example Project Document

```javascript
{
  title: "MyAwesomeProject",
  sector: "DeFi",
  chain: "Ethereum",
  description: "A revolutionary DeFi protocol...",
  valueProposition: "Building the future of decentralized finance",
  logo: "https://example.com/logo.png",
  
  visibility: {
    discoverable: true,
    publicFields: ['title', 'sector', 'chain', 'description', 'funding', 'ido', 'badges']
  },
  
  funding: {
    target: 500000,
    raised: 250000,
    currency: "USD",
    investorCount: 150
  },
  
  ido: {
    status: "live",
    startDate: Timestamp.fromDate(new Date('2025-01-01')),
    endDate: Timestamp.fromDate(new Date('2025-01-31')),
    exchange: "Binance Launchpad",
    platform: "Cryptorafts Launch"
  },
  
  compliance: {
    status: "compliant",
    certikLink: "https://certik.com/projects/myawesomeproject",
    kycStatus: "verified",
    kybStatus: "verified"
  },
  
  badges: {
    kyc: true,
    kyb: true,
    audit: true,
    doxxed: true
  },
  
  social: {
    website: "https://myawesomeproject.com",
    twitter: "https://twitter.com/myawesomeproject",
    telegram: "https://t.me/myawesomeproject",
    discord: "https://discord.gg/myawesomeproject"
  },
  
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now()
}
```

## Updating Funding Data

To update funding data in real-time, use the following structure:

```javascript
// Update funding raised amount
await updateDoc(doc(db, 'projects', projectId), {
  'funding.raised': newRaisedAmount,
  'funding.investorCount': newInvestorCount,
  updatedAt: serverTimestamp()
});
```

## Firestore Security Rules

Ensure your Firestore rules allow reading projects with `discoverable: true`:

```javascript
match /projects/{projectId} {
  allow read: if resource.data.visibility.discoverable == true;
  allow write: if request.auth != null && 
    (request.auth.uid == resource.data.founderId || 
     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
}
```

