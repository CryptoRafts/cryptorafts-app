/**
 * Complete Setup with Tokens
 * Updates .env.local with Buffer and Medium tokens
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
  console.log('\n🚀 Complete Setup - Buffer & Medium\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Get Buffer token
  console.log('📋 Step 1: Buffer Access Token\n');
  const bufferToken = await question('Enter Buffer Access Token (or press Enter to skip): ');

  let bufferProfileIds = [];
  if (bufferToken && bufferToken.trim() && !bufferToken.includes('your_') && bufferToken.length > 30) {
    console.log('\n📡 Fetching Buffer profiles...\n');
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
  }

  // Get Medium token
  console.log('📋 Step 2: Medium Integration Token\n');
  const mediumToken = await question('Enter Medium Integration Token (or press Enter to skip): ');

  // Update .env.local
  console.log('\n📝 Updating .env.local...\n');

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
           !trimmed.startsWith('# Buffer') &&
           !trimmed.startsWith('# Medium');
  });

  // Build new content
  const newLines = [
    ...filteredLines.filter(line => line.trim() !== ''),
    '',
  ];

  if (bufferToken && bufferToken.trim() && bufferToken.length > 30) {
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

  if (mediumToken && mediumToken.trim() && mediumToken.length > 20) {
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
  console.log('📋 Next Steps:');
  console.log('1. Restart dev server: npm run dev');
  console.log('2. Go to: http://localhost:3001/admin/blog');
  console.log('3. Create a blog post');
  console.log('4. Select Buffer (for X & LinkedIn) and/or Medium');
  console.log('5. Publish - posts will go to all platforms! 🎉\n');

  rl.close();
}

completeSetup().catch(console.error);

