/**
 * Auto-Deploy to Vercel with Environment Variables
 * Sets up Twitter credentials and deploys
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('\n🚀 Auto-Deploy to Vercel\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Twitter credentials
const envVars = {
  TWITTER_CLIENT_ID: 'bzBaXzl4dmxCamoxLU5RUlNvOUg6MTpjaQ',
  TWITTER_CLIENT_SECRET: '7W4BMtgX2Raui8Q8UJySy71KKjEFRJYRy8Lo0k-frs-tlMPj3e',
  TWITTER_REDIRECT_URI: 'https://cryptorafts.com/api/blog/oauth/x/callback',
  NEXT_PUBLIC_APP_URL: 'https://cryptorafts.com'
};

try {
  console.log('📋 Step 1: Setting environment variables in Vercel...\n');
  
  // Set environment variables for production
  for (const [key, value] of Object.entries(envVars)) {
    try {
      console.log(`Setting ${key}...`);
      execSync(`vercel env add ${key} production`, {
        input: value + '\n',
        stdio: ['pipe', 'pipe', 'pipe']
      }, { timeout: 10000 });
      console.log(`✅ ${key} set for production`);
    } catch (error) {
      // Try to update if exists
      try {
        execSync(`vercel env rm ${key} production --yes`, { stdio: 'ignore' });
        execSync(`vercel env add ${key} production`, {
          input: value + '\n',
          stdio: ['pipe', 'pipe', 'pipe']
        });
        console.log(`✅ ${key} updated for production`);
      } catch (e) {
        console.log(`⚠️  ${key} - may need manual setup in Vercel dashboard`);
      }
    }
  }

  // Also set for preview and development
  console.log('\n📋 Setting for preview and development environments...\n');
  for (const [key, value] of Object.entries(envVars)) {
    try {
      execSync(`vercel env add ${key} preview`, {
        input: value + '\n',
        stdio: ['pipe', 'pipe', 'pipe']
      }, { timeout: 5000 });
      execSync(`vercel env add ${key} development`, {
        input: value + '\n',
        stdio: ['pipe', 'pipe', 'pipe']
      }, { timeout: 5000 });
    } catch (e) {
      // Ignore errors for preview/dev
    }
  }

  console.log('\n📋 Step 2: Deploying to Vercel...\n');
  
  // Deploy to production
  console.log('🚀 Starting deployment...\n');
  execSync('vercel --prod --yes', { stdio: 'inherit' });
  
  console.log('\n✅ Deployment complete!\n');
  console.log('📋 Next Steps:');
  console.log('1. Visit: https://cryptorafts.com');
  console.log('2. Go to: https://cryptorafts.com/admin/blog');
  console.log('3. Click "Connect" on X (Twitter)');
  console.log('4. Test posting! 🎉\n');

} catch (error) {
  console.error('\n❌ Error during deployment:', error.message);
  console.log('\n📝 Alternative: Manual deployment via Vercel dashboard');
  console.log('1. Go to: https://vercel.com/dashboard');
  console.log('2. Add environment variables manually');
  console.log('3. Click "Redeploy"\n');
}

