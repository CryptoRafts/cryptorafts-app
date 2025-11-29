/**
 * Auto-Complete Final Setup
 * Uses existing Buffer token and only needs Medium token
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
  console.log('\n🚀 Auto-Complete Final Setup\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const envPath = path.join(process.cwd(), '.env.local');
  let envContent = '';
  let existingBufferToken = null;
  let existingMediumToken = null;

  // Read existing .env.local
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
    
    // Extract existing tokens
    const bufferMatch = envContent.match(/BUFFER_ACCESS_TOKEN=(.+)/);
    if (bufferMatch) {
      existingBufferToken = bufferMatch[1].trim();
    }
    
    const mediumMatch = envContent.match(/MEDIUM_ACCESS_TOKEN=(.+)/);
    if (mediumMatch) {
      existingMediumToken = mediumMatch[1].trim();
    }
  }

  // Handle Buffer
  let bufferToken = existingBufferToken;
  let bufferProfileIds = [];

  if (bufferToken && bufferToken.length > 30) {
    console.log('✅ Buffer token found in .env.local\n');
    console.log('📡 Fetching Buffer profiles...\n');
    
    try {
      const profiles = await fetchBufferProfiles(bufferToken);
      if (profiles.length > 0) {
        console.log('✅ Found profiles:\n');
        profiles.forEach((profile) => {
          if (!profile.disabled) {
            console.log(`  ${profile.service || 'Unknown'}: ${profile.service_username || 'N/A'}`);
            console.log(`    Profile ID: ${profile.id}\n`);
            bufferProfileIds.push(profile.id);
          }
        });
      }
    } catch (error) {
      console.log('⚠️  Could not fetch profiles automatically\n');
    }
  } else {
    console.log('⚠️  Buffer token not found\n');
    const newBufferToken = await question('Enter Buffer Access Token (or press Enter to skip): ');
    if (newBufferToken && newBufferToken.trim() && newBufferToken.length > 30) {
      bufferToken = newBufferToken.trim();
    }
  }

  // Handle Medium
  let mediumToken = existingMediumToken;

  if (!mediumToken || mediumToken.length < 20) {
    console.log('📋 Medium Integration Token\n');
    console.log('To get your Medium token:');
    console.log('1. Go to: https://medium.com/me/applications');
    console.log('2. Sign in if needed');
    console.log('3. Click "Get integration token"');
    console.log('4. Copy the token\n');
    
    const newMediumToken = await question('Enter Medium Integration Token (or press Enter to skip): ');
    if (newMediumToken && newMediumToken.trim() && newMediumToken.length > 20) {
      mediumToken = newMediumToken.trim();
    }
  } else {
    console.log('✅ Medium token found in .env.local\n');
  }

  // Update .env.local
  console.log('\n📝 Updating .env.local...\n');

  // Remove old credentials
  const lines = envContent.split('\n');
  const filteredLines = lines.filter(line => {
    const trimmed = line.trim();
    return !trimmed.startsWith('BUFFER_ACCESS_TOKEN') &&
           !trimmed.startsWith('BUFFER_PROFILE_IDS') &&
           !trimmed.startsWith('MEDIUM_ACCESS_TOKEN') &&
           !trimmed.startsWith('# Buffer') &&
           !trimmed.startsWith('# Medium');
  });

  // Build new content
  const newLines = [
    ...filteredLines.filter(line => line.trim() !== ''),
    '',
  ];

  if (bufferToken && bufferToken.length > 30) {
    newLines.push('# Buffer Configuration (X & LinkedIn)');
    newLines.push(`BUFFER_ACCESS_TOKEN=${bufferToken}`);
    if (bufferProfileIds.length > 0) {
      newLines.push(`BUFFER_PROFILE_IDS=${bufferProfileIds.join(',')}`);
    } else {
      newLines.push('# BUFFER_PROFILE_IDS=profile_id_x,profile_id_linkedin');
      newLines.push('# Run: npm run get-buffer-profiles to get profile IDs');
    }
    newLines.push('');
  }

  if (mediumToken && mediumToken.length > 20) {
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
  console.log('✅ Updated .env.local\n');

  // Final summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('✅ Setup Complete!\n');
  
  if (bufferToken) {
    console.log('✅ Buffer: Configured');
  }
  if (mediumToken) {
    console.log('✅ Medium: Configured');
  }
  
  console.log('\n📋 Next Steps:');
  console.log('1. Restart dev server: npm run dev');
  console.log('2. Go to: http://localhost:3001/admin/blog');
  console.log('3. Create a blog post');
  console.log('4. Select Buffer (for X & LinkedIn) and/or Medium');
  console.log('5. Publish - posts will go to all platforms! 🎉\n');

  rl.close();
}

completeSetup().catch(console.error);

