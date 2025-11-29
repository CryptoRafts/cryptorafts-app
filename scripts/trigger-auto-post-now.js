/**
 * Trigger Auto-Post Now
 * Manually triggers the auto-posting system to create today's post immediately
 */

const https = require('https');
const http = require('http');

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cryptorafts.com';
const triggerEndpoint = `${baseUrl}/api/blog/trigger-now`;

console.log('\n🚀 Triggering Auto-Post Now\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('📡 Calling:', triggerEndpoint);
console.log('');

const url = new URL(triggerEndpoint);
const client = url.protocol === 'https:' ? https : http;

const options = {
  hostname: url.hostname,
  port: url.port || (url.protocol === 'https:' ? 443 : 80),
  path: url.pathname,
  method: 'GET',
  headers: {
    'User-Agent': 'Auto-Post-Trigger-Script'
  }
};

const req = client.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      
      if (response.success) {
        console.log('✅ SUCCESS!\n');
        console.log('📝 Post Details:');
        console.log('   Title:', response.title || 'N/A');
        console.log('   Post ID:', response.postId || 'N/A');
        console.log('   Platforms:', response.platforms?.join(', ') || 'None');
        console.log('   Timestamp:', response.timestamp || new Date().toISOString());
        console.log('');
        
        if (response.skipped) {
          console.log('ℹ️  Post skipped:', response.message);
          console.log('   (Post may have already been created today)');
        } else {
          console.log('🎉 Blog post created and published successfully!');
          console.log('📱 Posted to platforms:', response.platforms?.length || 0);
        }
      } else {
        console.log('❌ ERROR:', response.error || 'Unknown error');
        if (response.details) {
          console.log('   Details:', response.details);
        }
      }
    } catch (e) {
      console.log('📋 Response:', data);
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📅 Next automatic post: Tomorrow at 9 AM UTC (5 AM EST)');
    console.log('🔄 Schedule: Daily at 9 AM UTC\n');
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error.message);
  console.log('\n💡 Make sure:');
  console.log('   1. The site is deployed and accessible');
  console.log('   2. Auto-posting is enabled in admin dashboard');
  console.log('   3. OpenAI API key is configured\n');
});

req.end();

