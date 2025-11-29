/**
 * Deploy to Vercel - Helper Script
 * Checks environment and guides deployment
 */

const fs = require('fs');
const path = require('path');

console.log('\n🚀 Vercel Deployment Helper\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Check .env.local for Twitter credentials
const envPath = path.join(process.cwd(), '.env.local');
let hasTwitterCredentials = false;

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  hasTwitterCredentials = envContent.includes('TWITTER_CLIENT_ID') && 
                         envContent.includes('TWITTER_CLIENT_SECRET');
}

console.log('📋 Pre-Deployment Checklist:\n');

if (hasTwitterCredentials) {
  console.log('✅ Twitter credentials found in .env.local');
} else {
  console.log('⚠️  Twitter credentials NOT found in .env.local');
}

console.log('\n📝 IMPORTANT: Before deploying to Vercel:\n');
console.log('1. Add environment variables to Vercel Dashboard:');
console.log('   - Go to: https://vercel.com/dashboard');
console.log('   - Select your project');
console.log('   - Settings → Environment Variables');
console.log('   - Add these variables:\n');
console.log('     TWITTER_CLIENT_ID=bzBaXzl4dmxCamoxLU5RUlNvOUg6MTpjaQ');
console.log('     TWITTER_CLIENT_SECRET=7W4BMtgX2Raui8Q8UJySy71KKjEFRJYRy8Lo0k-frs-tlMPj3e');
console.log('     TWITTER_REDIRECT_URI=https://cryptorafts.com/api/blog/oauth/x/callback');
console.log('     NEXT_PUBLIC_APP_URL=https://cryptorafts.com\n');
console.log('2. Set variables for: Production, Preview, Development\n');
console.log('3. Commit and push your changes:\n');
console.log('   git add .');
console.log('   git commit -m "Add Twitter/X OAuth integration"');
console.log('   git push\n');
console.log('4. Deploy:\n');
console.log('   Option A: Push to main branch (auto-deploys)');
console.log('   Option B: Go to Vercel dashboard → Click "Redeploy"');
console.log('   Option C: Use Vercel CLI: vercel --prod\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('📝 See DEPLOY_TO_VERCEL.md for complete guide\n');

