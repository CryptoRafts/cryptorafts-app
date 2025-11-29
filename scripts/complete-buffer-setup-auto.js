/**
 * Complete Buffer Setup - Fully Automated
 * Extracts credentials and updates .env.local automatically
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
          const profiles = JSON.parse(data);
          resolve(profiles || []);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function completeSetup() {
  console.log('\n🚀 Complete Buffer Setup - Automated\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Step 1: Get access token
  console.log('📋 Step 1: Get Buffer Access Token\n');
  console.log('To get your access token:');
  console.log('1. Go to: https://buffer.com/developers/apps/create');
  console.log('2. Create app (or use existing)');
  console.log('3. Generate access token');
  console.log('4. Copy the token\n');

  const accessToken = await question('Enter Buffer Access Token: ');

  if (!accessToken || accessToken.includes('your_') || accessToken.length < 30) {
    console.log('\n❌ Invalid access token.\n');
    rl.close();
    return;
  }

  // Step 2: Get profile IDs automatically
  console.log('\n📡 Fetching profiles from Buffer API...\n');

  let profileIds = [];
  try {
    const profiles = await fetchBufferProfiles(accessToken);
    
    if (profiles.length === 0) {
      console.log('⚠️  No profiles found. Make sure accounts are connected in Buffer.\n');
    } else {
      console.log('✅ Found profiles:\n');
      
      profiles.forEach((profile) => {
        if (!profile.disabled) {
          console.log(`  ${profile.service || 'Unknown'}: ${profile.service_username || 'N/A'}`);
          console.log(`    Profile ID: ${profile.id}\n`);
          profileIds.push(profile.id);
        }
      });

      if (profileIds.length > 0) {
        console.log(`✅ Found ${profileIds.length} active profile(s)\n`);
      }
    }
  } catch (error) {
    console.log('⚠️  Could not fetch profiles automatically');
    console.log('   You can add profile IDs manually later\n');
  }

  // Step 3: Update .env.local
  console.log('📝 Step 2: Updating .env.local...\n');

  const envPath = path.join(process.cwd(), '.env.local');
  let envContent = '';

  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

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
    '# Buffer Configuration (X & LinkedIn)',
    `BUFFER_ACCESS_TOKEN=${accessToken}`,
  ];

  if (profileIds.length > 0) {
    newLines.push(`BUFFER_PROFILE_IDS=${profileIds.join(',')}`);
  } else {
    newLines.push('# BUFFER_PROFILE_IDS=profile_id_x,profile_id_linkedin');
    newLines.push('# Run: npm run get-buffer-profiles to get profile IDs');
  }

  newLines.push('');

  // Ensure NEXT_PUBLIC_APP_URL exists
  if (!envContent.includes('NEXT_PUBLIC_APP_URL')) {
    newLines.push('NEXT_PUBLIC_APP_URL=https://cryptorafts.com');
  }

  // Write to file
  fs.writeFileSync(envPath, newLines.join('\n'));
  console.log('✅ Updated .env.local with Buffer credentials\n');

  // Step 4: Get Medium token
  console.log('📋 Step 3: Get Medium Integration Token\n');
  console.log('1. Go to: https://medium.com/me/applications');
  console.log('2. Click "Get an integration token"');
  console.log('3. Copy the token\n');

  const mediumToken = await question('Enter Medium Integration Token (or press Enter to skip): ');

  if (mediumToken && !mediumToken.includes('your_') && mediumToken.length > 20) {
    // Add Medium token
    const currentContent = fs.readFileSync(envPath, 'utf8');
    const mediumLines = [
      ...currentContent.split('\n').filter(line => line.trim() !== ''),
      '',
      '# Medium Configuration (Direct API)',
      `MEDIUM_ACCESS_TOKEN=${mediumToken}`,
      '',
    ];

    fs.writeFileSync(envPath, mediumLines.join('\n'));
    console.log('\n✅ Added Medium token to .env.local\n');
  }

  // Final summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('✅ Setup Complete!\n');
  console.log('📋 Next Steps:');
  console.log('1. Restart dev server: npm run dev');
  console.log('2. Go to: http://localhost:3001/admin/blog');
  console.log('3. Create a blog post');
  console.log('4. Select Buffer (for X & LinkedIn) and Medium');
  console.log('5. Publish - posts will go to all platforms! 🎉\n');

  rl.close();
}

// Run
completeSetup().catch(console.error);

