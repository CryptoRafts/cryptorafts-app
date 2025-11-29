/**
 * Auto-Complete All Integrations
 * Completes Buffer (X + LinkedIn) + Medium setup automatically
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const https = require('https');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function fetchBufferProfiles(accessToken) {
  return new Promise((resolve, reject) => {
    const url = `https://api.bufferapp.com/1/profiles.json?access_token=${accessToken}`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          if (res.statusCode !== 200) {
            reject(new Error(`API returned ${res.statusCode}`));
            return;
          }
          const profiles = JSON.parse(data);
          resolve(Array.isArray(profiles) ? profiles : []);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function autoCompleteAll() {
  console.log('\n🚀 Auto-Complete All Integrations\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('This will set up:');
  console.log('  ✅ Buffer (X & LinkedIn)');
  console.log('  ✅ Medium (Direct API)\n');

  // Step 1: Buffer Setup
  console.log('📋 Step 1: Buffer Setup (X & LinkedIn)\n');
  console.log('You already have X and LinkedIn connected in Buffer!');
  console.log('Now we just need the API token.\n');
  console.log('To get it:');
  console.log('1. Go to: https://buffer.com/developers/apps/create');
  console.log('2. Create app (or use existing)');
  console.log('3. Generate access token');
  console.log('4. Copy the token\n');

  const bufferToken = await question('Enter Buffer Access Token: ');

  if (!bufferToken || bufferToken.includes('your_') || bufferToken.length < 30) {
    console.log('\n❌ Invalid Buffer token. Please try again.\n');
    rl.close();
    return;
  }

  // Fetch profiles automatically
  console.log('\n📡 Fetching your Buffer profiles...\n');
  let bufferProfileIds = [];
  
  try {
    const profiles = await fetchBufferProfiles(bufferToken);
    
    if (profiles.length === 0) {
      console.log('⚠️  No profiles found. Make sure accounts are connected in Buffer.\n');
    } else {
      console.log('✅ Found profiles:\n');
      
      const xProfiles = [];
      const linkedinProfiles = [];
      
      profiles.forEach((profile) => {
        if (!profile.disabled) {
          const service = (profile.service || '').toLowerCase();
          console.log(`  ${profile.service || 'Unknown'}: @${profile.service_username || 'N/A'}`);
          console.log(`    Profile ID: ${profile.id}\n`);
          
          bufferProfileIds.push(profile.id);
          
          if (service === 'twitter') {
            xProfiles.push(profile.id);
          } else if (service === 'linkedin') {
            linkedinProfiles.push(profile.id);
          }
        }
      });

      if (bufferProfileIds.length > 0) {
        console.log(`✅ Found ${bufferProfileIds.length} active profile(s)\n`);
        if (xProfiles.length > 0) {
          console.log(`  🐦 X (Twitter): ${xProfiles.length} profile(s)`);
        }
        if (linkedinProfiles.length > 0) {
          console.log(`  💼 LinkedIn: ${linkedinProfiles.length} profile(s)\n`);
        }
      }
    }
  } catch (error) {
    console.log('⚠️  Could not fetch profiles automatically');
    console.log('   Error:', error.message);
    console.log('   You can add profile IDs manually later\n');
  }

  // Step 2: Medium Setup
  console.log('📋 Step 2: Medium Setup\n');
  console.log('Since Buffer doesn\'t support Medium, we\'ll use direct API.');
  console.log('To get Medium token:');
  console.log('1. Go to: https://medium.com/me/applications');
  console.log('2. Click "Get an integration token"');
  console.log('3. Copy the token\n');

  const mediumToken = await question('Enter Medium Integration Token (or press Enter to skip): ');

  // Step 3: Update .env.local
  console.log('\n📝 Step 3: Updating .env.local...\n');

  const envPath = path.join(process.cwd(), '.env.local');
  let envContent = '';

  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  // Remove old credentials
  const lines = envContent.split('\n');
  const filteredLines = lines.filter(line => {
    const trimmed = line.trim();
    return !trimmed.startsWith('BUFFER_ACCESS_TOKEN') &&
           !trimmed.startsWith('BUFFER_PROFILE_IDS') &&
           !trimmed.startsWith('MEDIUM_ACCESS_TOKEN') &&
           !trimmed.startsWith('MEDIUM_CLIENT_ID') &&
           !trimmed.startsWith('MEDIUM_CLIENT_SECRET') &&
           !trimmed.startsWith('# Buffer') &&
           !trimmed.startsWith('# Medium');
  });

  // Build new content
  const newLines = [
    ...filteredLines.filter(line => line.trim() !== ''),
    '',
    '# Buffer Configuration (X & LinkedIn)',
    `BUFFER_ACCESS_TOKEN=${bufferToken}`,
  ];

  if (bufferProfileIds.length > 0) {
    newLines.push(`BUFFER_PROFILE_IDS=${bufferProfileIds.join(',')}`);
  } else {
    newLines.push('# BUFFER_PROFILE_IDS=profile_id_x,profile_id_linkedin');
    newLines.push('# Run: npm run get-buffer-profiles to get profile IDs');
  }

  newLines.push('');

  if (mediumToken && !mediumToken.includes('your_') && mediumToken.length > 20) {
    newLines.push('# Medium Configuration (Direct API)');
    newLines.push(`MEDIUM_ACCESS_TOKEN=${mediumToken}`);
    newLines.push('');
  }

  // Ensure NEXT_PUBLIC_APP_URL exists
  if (!envContent.includes('NEXT_PUBLIC_APP_URL')) {
    newLines.push('NEXT_PUBLIC_APP_URL=https://cryptorafts.com');
  }

  // Write to file
  fs.writeFileSync(envPath, newLines.join('\n'));
  console.log('✅ Updated .env.local with all credentials\n');

  // Final summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('✅ Setup Complete!\n');
  console.log('📋 Configuration Summary:');
  console.log(`  ✅ Buffer Access Token: ${bufferToken.substring(0, 20)}...`);
  if (bufferProfileIds.length > 0) {
    console.log(`  ✅ Buffer Profile IDs: ${bufferProfileIds.length} profile(s)`);
  }
  if (mediumToken && mediumToken.length > 20) {
    console.log(`  ✅ Medium Token: ${mediumToken.substring(0, 20)}...`);
  }
  console.log('');
  console.log('📋 Next Steps:');
  console.log('1. Restart dev server: npm run dev');
  console.log('2. Go to: http://localhost:3001/admin/blog');
  console.log('3. Create a blog post');
  console.log('4. Select Buffer (for X & LinkedIn) and Medium');
  console.log('5. Publish - posts will go to all platforms! 🎉\n');
  console.log('🎉 Everything is set up and ready to use!\n');

  rl.close();
}

// Run
autoCompleteAll().catch(console.error);

