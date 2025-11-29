/**
 * Add Mock Data to Spotlight Department
 * Run: node scripts/add-spotlight-mock-data.js
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require('../secrets/service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id
  });
}

const db = admin.firestore();

const MOCK_SPOTLIGHT_TEAM = [
  {
    email: 'spotlight-lead@cryptoraft.com',
    role: 'Dept Admin',
    status: 'active',
    department: 'Spotlight',
    departmentId: 'Spotlight',
    addedBy: 'admin@cryptoraft.com',
    addedAt: new Date('2024-01-15T10:00:00').toISOString(),
    searchCount: 1247,
    lastActive: new Date('2024-10-16T08:30:00').toISOString()
  },
  {
    email: 'search-specialist@cryptoraft.com',
    role: 'Staff',
    status: 'active',
    department: 'Spotlight',
    departmentId: 'Spotlight',
    addedBy: 'spotlight-lead@cryptoraft.com',
    addedAt: new Date('2024-01-20T14:30:00').toISOString(),
    searchCount: 892,
    lastActive: new Date('2024-10-16T07:15:00').toISOString()
  },
  {
    email: 'data-analyst@cryptoraft.com',
    role: 'Staff',
    status: 'active',
    department: 'Spotlight',
    departmentId: 'Spotlight',
    addedBy: 'spotlight-lead@cryptoraft.com',
    addedAt: new Date('2024-02-01T09:00:00').toISOString(),
    searchCount: 654,
    lastActive: new Date('2024-10-15T16:45:00').toISOString()
  },
  {
    email: 'search-intern@cryptoraft.com',
    role: 'Read-only',
    status: 'active',
    department: 'Spotlight',
    departmentId: 'Spotlight',
    addedBy: 'spotlight-lead@cryptoraft.com',
    addedAt: new Date('2024-02-15T11:00:00').toISOString(),
    searchCount: 234,
    lastActive: new Date('2024-10-16T06:00:00').toISOString()
  },
  {
    email: 'former-member@cryptoraft.com',
    role: 'Staff',
    status: 'suspended',
    department: 'Spotlight',
    departmentId: 'Spotlight',
    addedBy: 'spotlight-lead@cryptoraft.com',
    addedAt: new Date('2024-01-25T13:00:00').toISOString(),
    searchCount: 445,
    lastActive: new Date('2024-09-30T12:00:00').toISOString()
  }
];

async function addMockData() {
  console.log('🚀 Adding mock data to Spotlight department...\n');

  try {
    let addedCount = 0;

    for (const member of MOCK_SPOTLIGHT_TEAM) {
      console.log(`➕ Adding ${member.email} as ${member.role}...`);
      
      // Add to department_members collection
      await db.collection('department_members').add(member);
      
      addedCount++;
      console.log(`   ✅ Added successfully`);
    }

    console.log(`\n🎉 SUCCESS! Added ${addedCount} mock team members to Spotlight department!`);
    console.log('\n📊 Mock Team Summary:');
    console.log(`   - 1 Dept Admin (spotlight-lead@cryptoraft.com)`);
    console.log(`   - 2 Staff (search-specialist, data-analyst)`);
    console.log(`   - 1 Read-only (search-intern)`);
    console.log(`   - 1 Suspended (former-member)`);
    console.log(`   - Total: ${addedCount} members`);
    console.log(`\n✅ You can now test the Spotlight department page!`);
    console.log(`   Go to: /admin/departments/spotlight`);
    console.log(`\n🔍 Test features:`);
    console.log(`   ✓ View team list (5 members)`);
    console.log(`   ✓ Add new members`);
    console.log(`   ✓ Remove members`);
    console.log(`   ✓ Suspend/reactivate members`);
    console.log(`   ✓ View stats`);
    console.log(`   ✓ See role badges`);
    console.log(`   ✓ Check permissions`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding mock data:', error);
    process.exit(1);
  }
}

// Run the script
addMockData();


