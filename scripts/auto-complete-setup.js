/**
 * Auto-Complete Twitter OAuth Setup
 * This script automatically completes the entire setup process
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

async function autoCompleteSetup() {
  console.log('\n🚀 Auto-Complete Twitter OAuth Setup\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Step 1: Check/create .env.local
  const envPath = path.join(process.cwd(), '.env.local');
  let envContent = '';

  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
    console.log('✅ Found .env.local file\n');
  } else {
    console.log('📝 Creating .env.local file...\n');
  }

  // Step 2: Get credentials
  console.log('📋 Getting Twitter OAuth Credentials\n');
  console.log('Please provide your Twitter OAuth 2.0 credentials.');
  console.log('You can get these from: https://developer.twitter.com/en/portal/dashboard\n');
  console.log('After logging in:');
  console.log('1. Create/select an app');
  console.log('2. Go to "User authentication settings"');
  console.log('3. Set up OAuth 2.0');
  console.log('4. Copy Client ID and Client Secret\n');

  const clientId = await question('Enter Twitter Client ID: ');
  const clientSecret = await question('Enter Twitter Client Secret: ');

  if (!clientId || !clientSecret || clientId.includes('your_') || clientSecret.includes('your_')) {
    console.log('\n❌ Invalid credentials. Please try again.\n');
    rl.close();
    return;
  }

  // Step 3: Update .env.local
  console.log('\n📝 Updating .env.local...\n');

  // Remove old Twitter credentials
  const lines = envContent.split('\n');
  const filteredLines = lines.filter(line => {
    const trimmed = line.trim();
    return !trimmed.startsWith('TWITTER_CLIENT_ID') &&
           !trimmed.startsWith('TWITTER_CLIENT_SECRET') &&
           !trimmed.startsWith('TWITTER_REDIRECT_URI') &&
           !trimmed.startsWith('X_CLIENT_ID') &&
           !trimmed.startsWith('X_CLIENT_SECRET') &&
           !trimmed.startsWith('X_REDIRECT_URI') &&
           !trimmed.startsWith('# X (Twitter)') &&
           !trimmed.startsWith('# Twitter');
  });

  // Build new content
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

  // Write to file
  fs.writeFileSync(envPath, newLines.join('\n'));
  console.log('✅ Updated .env.local with Twitter credentials\n');

  // Step 4: Verify
  console.log('🔍 Verifying setup...\n');
  
  const hasClientId = clientId && clientId.length > 10;
  const hasClientSecret = clientSecret && clientSecret.length > 20;

  if (hasClientId && hasClientSecret) {
    console.log('✅ All credentials are set!\n');
    console.log('📋 Setup Complete! Next Steps:');
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
autoCompleteSetup().catch(console.error);

