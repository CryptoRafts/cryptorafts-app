/**
 * Medium Direct API Setup Script
 * Sets up Medium integration (since Buffer doesn't support it)
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

async function setupMedium() {
  console.log('\n🚀 Medium Direct API Setup\n');
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

  // Step 2: Instructions
  console.log('📋 Medium Setup Instructions\n');
  console.log('Option 1: Integration Token (Easiest)');
  console.log('1. Go to: https://medium.com/me/applications');
  console.log('2. Click "Get an integration token"');
  console.log('3. Copy the token\n');
  console.log('Option 2: OAuth 2.0 (More Secure)');
  console.log('1. Go to: https://medium.com/me/applications');
  console.log('2. Create OAuth application');
  console.log('3. Get Client ID and Client Secret\n');

  const useOAuth = await question('Use OAuth 2.0? (y/n, default: n for integration token): ');
  const useOAuthBool = useOAuth.toLowerCase() === 'y';

  let mediumToken = '';
  let mediumClientId = '';
  let mediumClientSecret = '';

  if (useOAuthBool) {
    mediumClientId = await question('Enter Medium Client ID: ');
    mediumClientSecret = await question('Enter Medium Client Secret: ');
  } else {
    mediumToken = await question('Enter Medium Integration Token: ');
  }

  if (!useOAuthBool && (!mediumToken || mediumToken.includes('your_'))) {
    console.log('\n❌ Invalid token. Please try again.\n');
    rl.close();
    return;
  }

  if (useOAuthBool && (!mediumClientId || !mediumClientSecret)) {
    console.log('\n❌ Invalid credentials. Please try again.\n');
    rl.close();
    return;
  }

  // Step 3: Update .env.local
  console.log('\n📝 Updating .env.local...\n');

  // Remove old Medium credentials
  const lines = envContent.split('\n');
  const filteredLines = lines.filter(line => {
    const trimmed = line.trim();
    return !trimmed.startsWith('MEDIUM_ACCESS_TOKEN') &&
           !trimmed.startsWith('MEDIUM_CLIENT_ID') &&
           !trimmed.startsWith('MEDIUM_CLIENT_SECRET') &&
           !trimmed.startsWith('MEDIUM_REDIRECT_URI') &&
           !trimmed.startsWith('# Medium');
  });

  // Build new content
  const newLines = [
    ...filteredLines.filter(line => line.trim() !== ''),
    '',
    '# Medium Configuration (Direct API)',
  ];

  if (useOAuthBool) {
    newLines.push(`MEDIUM_CLIENT_ID=${mediumClientId}`);
    newLines.push(`MEDIUM_CLIENT_SECRET=${mediumClientSecret}`);
    newLines.push('MEDIUM_REDIRECT_URI=https://cryptorafts.com/api/blog/oauth/medium/callback');
  } else {
    newLines.push(`MEDIUM_ACCESS_TOKEN=${mediumToken}`);
  }

  newLines.push('');

  // Write to file
  fs.writeFileSync(envPath, newLines.join('\n'));
  console.log('✅ Updated .env.local with Medium credentials\n');

  // Step 4: Verify
  console.log('🔍 Verifying setup...\n');
  
  if ((useOAuthBool && mediumClientId && mediumClientSecret) || (!useOAuthBool && mediumToken)) {
    console.log('✅ Medium credentials are set!\n');
    console.log('📋 Next Steps:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('1. Restart your development server:');
    console.log('   npm run dev\n');
    console.log('2. Go to: http://localhost:3001/admin/blog');
    if (useOAuthBool) {
      console.log('3. Click "Connect" on Medium platform');
      console.log('4. Authorize the app');
    }
    console.log('5. Create a blog post and select "Medium" platform');
    console.log('6. Publish - it will post to Medium! ✅\n');
    console.log('🎉 Medium integration complete!\n');
  } else {
    console.log('⚠️  Warning: Credentials may not be valid\n');
  }

  rl.close();
}

// Run the setup
setupMedium().catch(console.error);

