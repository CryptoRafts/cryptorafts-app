// Simple script to add sample data for admin testing
// Run this in the browser console on your Firebase project

const sampleData = {
  kyc: {
    userId: 'sample-user-1',
    userEmail: 'user@example.com',
    userName: 'John Doe',
    status: 'pending',
    submittedAt: new Date(),
    documents: {
      idFront: 'https://via.placeholder.com/400x300/0066cc/ffffff?text=ID+Front',
      idBack: 'https://via.placeholder.com/400x300/0066cc/ffffff?text=ID+Back',
      selfie: 'https://via.placeholder.com/400x300/0066cc/ffffff?text=Selfie',
      proofOfAddress: 'https://via.placeholder.com/400x300/0066cc/ffffff?text=Proof+of+Address'
    },
    personalInfo: {
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: '1990-01-01',
      nationality: 'US',
      address: '123 Main St, New York, NY 10001',
      phone: '+1-555-123-4567'
    },
    verificationLevel: 'standard',
    riskScore: 25,
    notes: 'Sample KYC document for testing'
  },
  
  kyb: {
    userId: 'sample-business-1',
    userEmail: 'business@example.com',
    userName: 'Acme Corp',
    status: 'pending',
    submittedAt: new Date(),
    documents: {
      businessLicense: 'https://via.placeholder.com/400x300/cc6600/ffffff?text=Business+License',
      taxCertificate: 'https://via.placeholder.com/400x300/cc6600/ffffff?text=Tax+Certificate',
      bankStatement: 'https://via.placeholder.com/400x300/cc6600/ffffff?text=Bank+Statement',
      incorporationDocs: 'https://via.placeholder.com/400x300/cc6600/ffffff?text=Incorporation+Docs'
    },
    businessInfo: {
      businessName: 'Acme Corporation',
      businessType: 'Technology',
      registrationNumber: 'REG123456789',
      taxId: 'TAX987654321',
      address: '456 Business Ave, San Francisco, CA 94105',
      website: 'https://acme-corp.com',
      phone: '+1-555-987-6543',
      email: 'contact@acme-corp.com',
      foundedYear: '2020',
      employeeCount: '50-100',
      annualRevenue: '$1M-$5M',
      businessDescription: 'A leading technology company specializing in innovative solutions.'
    },
    verificationLevel: 'standard',
    riskScore: 15,
    notes: 'Sample KYB document for testing'
  },
  
  project: {
    title: 'DeFi Revolution',
    description: 'A revolutionary DeFi platform that will change the way people interact with decentralized finance.',
    category: 'defi',
    status: 'pending',
    fundingGoal: 1000000,
    currentFunding: 0,
    founderId: 'sample-founder-1',
    founderName: 'Jane Smith',
    createdAt: new Date(),
    updatedAt: new Date(),
    imageUrl: 'https://via.placeholder.com/600x400/6600cc/ffffff?text=DeFi+Revolution',
    website: 'https://defi-revolution.com',
    whitepaper: 'https://defi-revolution.com/whitepaper.pdf',
    teamSize: 8,
    stage: 'MVP',
    tags: ['DeFi', 'Blockchain', 'Finance']
  },
  
  user: {
    email: 'admin@cryptorafts.com',
    displayName: 'Admin User',
    role: 'admin',
    status: 'active',
    createdAt: new Date(),
    lastLogin: new Date(),
    profileImage: 'https://via.placeholder.com/100x100/0066cc/ffffff?text=Admin',
    kycStatus: 'verified',
    kybStatus: 'verified'
  },
  
  department: {
    name: 'Engineering',
    description: 'Software development and technical operations',
    headId: 'admin-user-1',
    headName: 'Admin User',
    headEmail: 'admin@cryptorafts.com',
    memberCount: 5,
    budget: 500000,
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
    permissions: ['user_management', 'project_approval', 'analytics_access'],
    members: [
      {
        userId: 'admin-user-1',
        userName: 'Admin User',
        userEmail: 'admin@cryptorafts.com',
        role: 'head',
        joinedAt: new Date()
      }
    ]
  },
  
  spotlight: {
    title: 'Featured Project: DeFi Revolution',
    description: 'A revolutionary DeFi platform that will change the way people interact with decentralized finance.',
    imageUrl: 'https://via.placeholder.com/800x600/6600cc/ffffff?text=Featured+Project',
    projectId: 'sample-project-1',
    status: 'active',
    priority: 1,
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'admin-user-1'
  }
};

console.log('Sample data structure created. Use this in your Firebase console:');
console.log('1. Go to Firebase Console > Firestore Database');
console.log('2. Create collections: kyc, kyb, projects, users, departments, spotlights');
console.log('3. Add documents with the sample data above');

// Export for use in browser console
window.sampleAdminData = sampleData;
