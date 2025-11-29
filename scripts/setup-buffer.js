/**
 * Buffer Setup Script
 * Helps set up Buffer integration for Medium and X
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

async function setupBuffer() {
  console.log('\n🚀 Buffer Setup for Medium & X Integration\n');
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
  console.log('📋 Buffer Setup Instructions\n');
  console.log('1. Go to: https://buffer.com/signup (or login)');
  console.log('2. Connect X (Twitter) account:');
  console.log('   - Go to https://publish.buffer.com/all-channels');
  console.log('   - Click "Connect a Channel" → Select "X (Twitter)"');
  console.log('   - Authorize with @cryptoraftsblog account');
  console.log('3. Connect Medium account:');
  console.log('   - Click "Connect a Channel" → Select "Medium"');
  console.log('   - Authorize with your Medium account');
  console.log('4. Get API Access Token:');
  console.log('   - Go to https://buffer.com/developers/apps/create');
  console.log('   - Create app → Generate access token');
  console.log('5. Get Profile IDs:');
  console.log('   - Check Buffer dashboard or use API\n');

  const accessToken = await question('Enter Buffer Access Token: ');
  const profileIds = await question('Enter Profile IDs (comma-separated, e.g., id1,id2): ');

  if (!accessToken || accessToken.includes('your_')) {
    console.log('\n❌ Invalid access token. Please try again.\n');
    rl.close();
    return;
  }

  // Step 3: Update .env.local
  console.log('\n📝 Updating .env.local...\n');

  // Remove old Buffer credentials
  const lines = envContent.split('\n');
  const filteredLines = lines.filter(line => {
    const trimmed = line.trim();
    return !trimmed.startsWith('BUFFER_ACCESS_TOKEN') &&
           !trimmed.startsWith('BUFFER_PROFILE_IDS') &&
           !trimmed.startsWith('# Buffer');
  });

  // Build new content
  const newLines = [
    ...filteredLines.filter(line => line.trim() !== ''),
    '',
    '# Buffer Configuration (for Medium & X)',
    `BUFFER_ACCESS_TOKEN=${accessToken}`,
    profileIds ? `BUFFER_PROFILE_IDS=${profileIds}` : '# BUFFER_PROFILE_IDS=profile_id_x,profile_id_medium',
    '',
  ];

  // Write to file
  fs.writeFileSync(envPath, newLines.join('\n'));
  console.log('✅ Updated .env.local with Buffer credentials\n');

  // Step 4: Verify
  console.log('🔍 Verifying setup...\n');
  
  if (accessToken && accessToken.length > 20) {
    console.log('✅ Buffer access token is set!\n');
    console.log('📋 Next Steps:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('1. Make sure X and Medium are connected in Buffer dashboard');
    console.log('2. Restart your development server:');
    console.log('   npm run dev\n');
    console.log('3. Go to: http://localhost:3001/admin/blog');
    console.log('4. Create a blog post and select "Buffer" platform');
    console.log('5. Publish - it will post to both X and Medium! ✅\n');
    console.log('🎉 Buffer integration complete!\n');
  } else {
    console.log('⚠️  Warning: Access token may not be valid\n');
  }

  rl.close();
}

// Run the setup
setupBuffer().catch(console.error);

