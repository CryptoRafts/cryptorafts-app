// Admin Data Initialization Script
// This script adds sample data to Firebase for testing admin functionality

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    // Add your Firebase project configuration here
  });
}

const db = admin.firestore();

async function initializeAdminData() {
  try {
    console.log('🚀 Initializing admin data...');

    // Add sample KYC data
    const kycData = {
      userId: 'sample-user-1',
      userEmail: 'user@example.com',
      userName: 'John Doe',
      status: 'pending',
      submittedAt: admin.firestore.FieldValue.serverTimestamp(),
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
    };

    await db.collection('kyc').add(kycData);
    console.log('✅ Added sample KYC data');

    // Add sample KYB data
    const kybData = {
      userId: 'sample-business-1',
      userEmail: 'business@example.com',
      userName: 'Acme Corp',
      status: 'pending',
      submittedAt: admin.firestore.FieldValue.serverTimestamp(),
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
    };

    await db.collection('kyb').add(kybData);
    console.log('✅ Added sample KYB data');

    // Add sample project data
    const projectData = {
      title: 'DeFi Revolution',
      description: 'A revolutionary DeFi platform that will change the way people interact with decentralized finance.',
      category: 'defi',
      status: 'pending',
      fundingGoal: 1000000,
      currentFunding: 0,
      founderId: 'sample-founder-1',
      founderName: 'Jane Smith',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      imageUrl: 'https://via.placeholder.com/600x400/6600cc/ffffff?text=DeFi+Revolution',
      website: 'https://defi-revolution.com',
      whitepaper: 'https://defi-revolution.com/whitepaper.pdf',
      teamSize: 8,
      stage: 'MVP',
      tags: ['DeFi', 'Blockchain', 'Finance']
    };

    await db.collection('projects').add(projectData);
    console.log('✅ Added sample project data');

    // Add sample user data
    const userData = {
      email: 'admin@cryptorafts.com',
      displayName: 'Admin User',
      role: 'admin',
      status: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLogin: admin.firestore.FieldValue.serverTimestamp(),
      profileImage: 'https://via.placeholder.com/100x100/0066cc/ffffff?text=Admin',
      kycStatus: 'verified',
      kybStatus: 'verified'
    };

    await db.collection('users').add(userData);
    console.log('✅ Added sample user data');

    // Add sample department data
    const departmentData = {
      name: 'Engineering',
      description: 'Software development and technical operations',
      headId: 'admin-user-1',
      headName: 'Admin User',
      headEmail: 'admin@cryptorafts.com',
      memberCount: 5,
      budget: 500000,
      status: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      permissions: ['user_management', 'project_approval', 'analytics_access'],
      members: [
        {
          userId: 'admin-user-1',
          userName: 'Admin User',
          userEmail: 'admin@cryptorafts.com',
          role: 'head',
          joinedAt: admin.firestore.FieldValue.serverTimestamp()
        }
      ]
    };

    await db.collection('departments').add(departmentData);
    console.log('✅ Added sample department data');

    // Add sample spotlight data
    const spotlightData = {
      title: 'Featured Project: DeFi Revolution',
      description: 'A revolutionary DeFi platform that will change the way people interact with decentralized finance.',
      imageUrl: 'https://via.placeholder.com/800x600/6600cc/ffffff?text=Featured+Project',
      projectId: 'sample-project-1',
      status: 'active',
      priority: 1,
      startDate: admin.firestore.FieldValue.serverTimestamp(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: 'admin-user-1'
    };

    await db.collection('spotlights').add(spotlightData);
    console.log('✅ Added sample spotlight data');

    console.log('🎉 All admin data initialized successfully!');
    console.log('📝 You can now test the admin system with real data.');

  } catch (error) {
    console.error('❌ Error initializing admin data:', error);
  }
}

// Run the initialization
initializeAdminData().then(() => {
  console.log('✅ Initialization completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Initialization failed:', error);
  process.exit(1);
});
