/**
 * Twitter OAuth Setup Automation Script
 * Helps automate the setup process for Twitter API integration
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupTwitterOAuth() {
  console.log('\n🚀 Twitter/X OAuth Setup Automation\n');
  console.log('This script will help you set up Twitter OAuth 2.0 integration.\n');

  // Step 1: Check if .env.local exists
  const envPath = path.join(process.cwd(), '.env.local');
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
    console.log('✅ Found .env.local file\n');
  } else {
    console.log('📝 Creating .env.local file...\n');
    envContent = '';
  }

  // Step 2: Get Twitter API credentials
  console.log('📋 Step 1: Get Twitter API Credentials');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('Please follow these steps:');
  console.log('1. Go to: https://developer.twitter.com/en/portal/dashboard');
  console.log('2. Sign in with your @cryptoraftsblog account');
  console.log('3. Create a new App (or use existing)');
  console.log('4. Go to "User authentication settings"');
  console.log('5. Set up OAuth 2.0:');
  console.log('   - App permissions: "Read and write"');
  console.log('   - App type: "Web App, Automated App or Bot"');
  console.log('   - Callback URL: https://cryptorafts.com/api/blog/oauth/x/callback');
  console.log('   - Website URL: https://cryptorafts.com');
  console.log('6. Copy your Client ID and Client Secret\n');

  const clientId = await question('Enter your Twitter Client ID: ');
  const clientSecret = await question('Enter your Twitter Client Secret: ');
  
  // Step 3: Update .env.local
  console.log('\n📝 Step 2: Updating .env.local...\n');

  // Remove old Twitter credentials if they exist
  const lines = envContent.split('\n');
  const filteredLines = lines.filter(line => {
    const trimmed = line.trim();
    return !trimmed.startsWith('TWITTER_CLIENT_ID') &&
           !trimmed.startsWith('TWITTER_CLIENT_SECRET') &&
           !trimmed.startsWith('TWITTER_REDIRECT_URI') &&
           !trimmed.startsWith('X_CLIENT_ID') &&
           !trimmed.startsWith('X_CLIENT_SECRET') &&
           !trimmed.startsWith('X_REDIRECT_URI');
  });

  // Add new credentials
  const newLines = [
    ...filteredLines.filter(line => line.trim() !== ''),
    '',
    '# X (Twitter) OAuth 2.0 Configuration',
    `TWITTER_CLIENT_ID=${clientId}`,
    `TWITTER_CLIENT_SECRET=${clientSecret}`,
    'TWITTER_REDIRECT_URI=https://cryptorafts.com/api/blog/oauth/x/callback',
    '',
  ];

  // Ensure NEXT_PUBLIC_APP_URL exists
  if (!envContent.includes('NEXT_PUBLIC_APP_URL')) {
    newLines.push('NEXT_PUBLIC_APP_URL=https://cryptorafts.com');
  }

  fs.writeFileSync(envPath, newLines.join('\n'));
  console.log('✅ Updated .env.local with Twitter credentials\n');

  // Step 4: Verify setup
  console.log('🔍 Step 3: Verifying setup...\n');
  
  const hasClientId = clientId && !clientId.includes('your_') && clientId.length > 10;
  const hasClientSecret = clientSecret && !clientSecret.includes('your_') && clientSecret.length > 10;

  if (hasClientId && hasClientSecret) {
    console.log('✅ All credentials are set!\n');
    console.log('📋 Next Steps:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('1. Restart your development server:');
    console.log('   npm run dev\n');
    console.log('2. Go to: http://localhost:3001/admin/blog');
    console.log('3. Click "Connect" on X (Twitter) platform');
    console.log('4. Authorize the app with your @cryptoraftsblog account');
    console.log('5. You\'re done! ✅\n');
    console.log('🎉 Your blog will now auto-post to @cryptoraftsblog!\n');
  } else {
    console.log('⚠️  Warning: Credentials may not be valid');
    console.log('   Please double-check your Client ID and Client Secret\n');
  }

  rl.close();
}

// Run the setup
setupTwitterOAuth().catch(console.error);

