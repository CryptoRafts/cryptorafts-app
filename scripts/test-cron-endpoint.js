/**
 * Test Script: Cron Endpoint
 * 
 * Tests the auto-post cron endpoint manually
 * Run: node scripts/test-cron-endpoint.js
 */

const BASE_URL = process.env.BASE_URL || 'https://cryptorafts.com';

async function testCronEndpoint() {
  console.log('🧪 Testing cron endpoint...\n');
  console.log(`📍 URL: ${BASE_URL}/api/blog/cron/auto-post\n`);

  try {
    const response = await fetch(`${BASE_URL}/api/blog/cron/auto-post`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Add cron secret if set
        ...(process.env.CRON_SECRET && {
          'Authorization': `Bearer ${process.env.CRON_SECRET}`
        })
      }
    });

    const data = await response.json();
    
    console.log('📊 Response Status:', response.status);
    console.log('📊 Response Data:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('\n✅ Cron endpoint test PASSED');
      if (data.postId) {
        console.log(`📝 Post ID: ${data.postId}`);
        console.log(`📝 Title: ${data.title}`);
      }
      if (data.skipped) {
        console.log('ℹ️  Post skipped (already exists or disabled)');
      }
    } else {
      console.log('\n❌ Cron endpoint test FAILED');
      console.log(`❌ Error: ${data.error || data.message}`);
      if (data.help) {
        console.log(`💡 Help: ${data.help}`);
      }
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testCronEndpoint();

