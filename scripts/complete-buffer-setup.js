/**
 * Complete Buffer Setup - Auto-fetch profiles and update .env.local
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
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

function fetchBufferProfiles(accessToken) {
  return new Promise((resolve, reject) => {
    const url = `https://api.bufferapp.com/1/profiles.json?access_token=${accessToken}`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          if (res.statusCode !== 200) {
            reject(new Error(`Buffer API error: ${res.statusCode} - ${data}`));
            return;
          }
          const profiles = JSON.parse(data);
          resolve(profiles || []);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function completeBufferSetup() {
  console.log('\n🚀 Complete Buffer Setup\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const envPath = path.join(process.cwd(), '.env.local');
  let envContent = '';
  let existingToken = null;

  // Read existing .env.local
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
    const tokenMatch = envContent.match(/BUFFER_ACCESS_TOKEN=(.+)/);
    if (tokenMatch) {
      existingToken = tokenMatch[1].trim();
      if (existingToken && !existingToken.includes('YOUR_') && existingToken.length > 30) {
        console.log('✅ Found Buffer token in .env.local\n');
      } else {
        existingToken = null;
      }
    }
  }

  // Get or use existing token
  let bufferToken = existingToken;
  
  if (!bufferToken) {
    console.log('📋 Enter Buffer Access Token\n');
    bufferToken = await question('Buffer Access Token: ');
    bufferToken = bufferToken.trim();
  }

  if (!bufferToken || bufferToken.includes('YOUR_') || bufferToken.length < 30) {
    console.log('\n❌ Invalid Buffer access token.\n');
    rl.close();
    return;
  }

  // Fetch profiles
  console.log('\n📡 Fetching profiles from Buffer API...\n');

  let profileIds = [];
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
          const username = profile.service_username || 'N/A';
          
          console.log(`  ${profile.service || 'Unknown'}: ${username}`);
          console.log(`    Profile ID: ${profile.id}\n`);
          
          profileIds.push(profile.id);
          
          if (service === 'twitter' || service === 'x') {
            xProfiles.push({ id: profile.id, username });
          } else if (service === 'linkedin') {
            linkedinProfiles.push({ id: profile.id, username });
          }
        }
      });

      if (xProfiles.length > 0) {
        console.log('🐦 X (Twitter) Profiles:');
        xProfiles.forEach(p => console.log(`   ${p.id} - @${p.username}`));
        console.log('');
      }

      if (linkedinProfiles.length > 0) {
        console.log('💼 LinkedIn Profiles:');
        linkedinProfiles.forEach(p => console.log(`   ${p.id} - ${p.username}`));
        console.log('');
      }

      console.log(`✅ Found ${profileIds.length} active profile(s)\n`);
    }
  } catch (error) {
    console.log('❌ Error fetching profiles:', error.message);
    console.log('\nMake sure:');
    console.log('1. Your access token is correct');
    console.log('2. X and LinkedIn accounts are connected in Buffer dashboard');
    console.log('3. Token has proper permissions\n');
  }

  // Update .env.local
  console.log('📝 Updating .env.local...\n');

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
    `BUFFER_ACCESS_TOKEN=${bufferToken}`,
  ];

  if (profileIds.length > 0) {
    newLines.push(`BUFFER_PROFILE_IDS=${profileIds.join(',')}`);
  } else {
    newLines.push('# BUFFER_PROFILE_IDS=profile_id_x,profile_id_linkedin');
    newLines.push('# Add profile IDs manually or reconnect accounts in Buffer');
  }

  newLines.push('');

  // Ensure NEXT_PUBLIC_APP_URL exists
  if (!envContent.includes('NEXT_PUBLIC_APP_URL')) {
    newLines.push('NEXT_PUBLIC_APP_URL=https://cryptorafts.com');
  }

  // Write to file
  fs.writeFileSync(envPath, newLines.join('\n'));
  console.log('✅ Updated .env.local with Buffer credentials\n');

  // Final summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('✅ Buffer Setup Complete!\n');
  
  if (profileIds.length > 0) {
    console.log('📋 Next Steps:');
    console.log('1. Restart dev server: npm run dev');
    console.log('2. Go to: http://localhost:3001/admin/blog');
    console.log('3. Create a blog post');
    console.log('4. Select Buffer platform');
    console.log('5. Publish - posts will go to X and LinkedIn via Buffer! 🎉\n');
  } else {
    console.log('⚠️  No profiles found. Please:');
    console.log('1. Go to Buffer dashboard: https://publish.buffer.com');
    console.log('2. Connect your X and LinkedIn accounts');
    console.log('3. Run this script again: npm run setup:buffer\n');
  }

  rl.close();
}

completeBufferSetup().catch(console.error);

