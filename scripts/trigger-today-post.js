/**
 * Manually trigger today's auto-post
 * This will generate and publish a blog post immediately
 */

const https = require('https');

const url = 'https://cryptorafts.com/api/blog/cron/auto-post';

console.log('\n🚀 Triggering Today\'s Auto-Post\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('📅 Generating blog post for today...\n');

const options = {
  method: 'GET',
  headers: {
    'User-Agent': 'Auto-Post-Trigger/1.0'
  }
};

const req = https.request(url, options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      
      if (result.success) {
        console.log('✅ SUCCESS!\n');
        console.log('📝 Post Details:');
        console.log('   Title:', result.title || 'Generated');
        console.log('   Post ID:', result.postId);
        console.log('   Platforms:', result.platforms?.join(', ') || 'None connected');
        console.log('   Timestamp:', result.timestamp);
        console.log('\n🎉 Blog post generated and published successfully!');
        console.log('📱 Check your connected platforms for the new post.\n');
      } else if (result.skipped) {
        console.log('ℹ️  SKIPPED\n');
        console.log('   Reason:', result.message);
        if (result.message.includes('already created today')) {
          console.log('   ℹ️  A post was already created today.');
          console.log('   ℹ️  Next post will be tomorrow at 9 AM UTC.\n');
        } else if (result.message.includes('disabled')) {
          console.log('   ⚠️  Auto-posting is disabled.');
          console.log('   💡 Enable it in the admin dashboard.\n');
        }
      } else {
        console.log('❌ ERROR\n');
        console.log('   Error:', result.error);
        if (result.details) {
          console.log('   Details:', result.details);
        }
        console.log('\n');
      }
    } catch (error) {
      console.log('❌ Failed to parse response:', error.message);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
  console.log('\n💡 Make sure the site is deployed and accessible.\n');
});

req.end();

