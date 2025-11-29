const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, doc, setDoc, serverTimestamp } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBvOkBwJ1Z4Z4Z4Z4Z4Z4Z4Z4Z4Z4Z4Z4Z4",
  authDomain: "cryptorafts-starter.firebaseapp.com",
  projectId: "cryptorafts-starter",
  storageBucket: "cryptorafts-starter.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456789"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fixAdminData() {
  try {
    console.log('🔧 Fixing admin data structure...');

    // Add sample KYC data with proper structure
    const kycData = {
      userId: 'sample-user-1',
      userEmail: 'user@example.com',
      userName: 'John Doe',
      status: 'pending',
      submittedAt: serverTimestamp(),
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

    await addDoc(collection(db, 'kyc'), kycData);
    console.log('✅ Added sample KYC data');

    // Add sample KYB data with proper structure
    const kybData = {
      userId: 'sample-business-1',
      userEmail: 'business@example.com',
      userName: 'Acme Corp',
      status: 'pending',
      submittedAt: serverTimestamp(),
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

    await addDoc(collection(db, 'kyb'), kybData);
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
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      imageUrl: 'https://via.placeholder.com/600x400/6600cc/ffffff?text=DeFi+Revolution',
      website: 'https://defi-revolution.com',
      whitepaper: 'https://defi-revolution.com/whitepaper.pdf',
      teamSize: 8,
      stage: 'MVP',
      tags: ['DeFi', 'Blockchain', 'Finance']
    };

    await addDoc(collection(db, 'projects'), projectData);
    console.log('✅ Added sample project data');

    // Add sample user data
    const userData = {
      email: 'admin@cryptorafts.com',
      displayName: 'Admin User',
      role: 'admin',
      status: 'active',
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      profileImage: 'https://via.placeholder.com/100x100/0066cc/ffffff?text=Admin',
      kycStatus: 'verified',
      kybStatus: 'verified'
    };

    await addDoc(collection(db, 'users'), userData);
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
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      permissions: ['user_management', 'project_approval', 'analytics_access'],
      members: [
        {
          userId: 'admin-user-1',
          userName: 'Admin User',
          userEmail: 'admin@cryptorafts.com',
          role: 'head',
          joinedAt: serverTimestamp()
        }
      ]
    };

    await addDoc(collection(db, 'departments'), departmentData);
    console.log('✅ Added sample department data');

    // Add sample spotlight data
    const spotlightData = {
      title: 'Featured Project: DeFi Revolution',
      description: 'A revolutionary DeFi platform that will change the way people interact with decentralized finance.',
      imageUrl: 'https://via.placeholder.com/800x600/6600cc/ffffff?text=Featured+Project',
      projectId: 'sample-project-1',
      status: 'active',
      priority: 1,
      startDate: serverTimestamp(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: 'admin-user-1'
    };

    await addDoc(collection(db, 'spotlights'), spotlightData);
    console.log('✅ Added sample spotlight data');

    console.log('🎉 All sample data added successfully!');
    console.log('📝 You can now test the admin system with real data.');

  } catch (error) {
    console.error('❌ Error fixing admin data:', error);
  }
}

// Run the script
fixAdminData().then(() => {
  console.log('✅ Script completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
