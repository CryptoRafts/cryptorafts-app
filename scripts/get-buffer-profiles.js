/**
 * Get Buffer Profile IDs Script
 * Helps extract profile IDs from Buffer API
 */

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

async function getBufferProfiles() {
  console.log('\n🔍 Get Buffer Profile IDs\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const accessToken = await question('Enter your Buffer Access Token: ');

  if (!accessToken || accessToken.includes('your_')) {
    console.log('\n❌ Invalid access token.\n');
    rl.close();
    return;
  }

  console.log('\n📡 Fetching profiles from Buffer API...\n');

  try {
    // Buffer API uses access_token as query parameter, not Bearer token
    const response = await fetch(`https://api.bufferapp.com/1/profiles.json?access_token=${accessToken}`);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Buffer API error: ${response.status} - ${errorText}`);
    }

    const profiles = await response.json() || [];

    if (!profiles || profiles.length === 0) {
      console.log('❌ No profiles found. Make sure accounts are connected in Buffer.\n');
      rl.close();
      return;
    }

    console.log('✅ Found profiles:\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const profileIds = [];

    profiles.forEach((profile) => {
      console.log(`Platform: ${profile.service || 'Unknown'}`);
      console.log(`Username: ${profile.service_username || 'N/A'}`);
      console.log(`Profile ID: ${profile.id}`);
      console.log(`Status: ${profile.disabled ? 'Disabled' : 'Active'}`);
      console.log('');

      if (!profile.disabled) {
        profileIds.push(profile.id);
      }
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📋 Profile IDs for .env.local:\n');
    console.log(`BUFFER_PROFILE_IDS=${profileIds.join(',')}\n`);

    // Filter by service
    const xProfiles = profiles.filter((p) => p.service?.toLowerCase() === 'twitter');
    const linkedinProfiles = profiles.filter((p) => p.service?.toLowerCase() === 'linkedin');

    if (xProfiles.length > 0) {
      console.log('🐦 X (Twitter) Profile IDs:');
      xProfiles.forEach((p) => {
        console.log(`   ${p.id} - @${p.service_username}`);
      });
      console.log('');
    }

    if (linkedinProfiles.length > 0) {
      console.log('💼 LinkedIn Profile IDs:');
      linkedinProfiles.forEach((p) => {
        console.log(`   ${p.id} - ${p.service_username}`);
      });
      console.log('');
    }

    console.log('✅ Copy the BUFFER_PROFILE_IDS line above to your .env.local file!\n');

  } catch (error: any) {
    console.error('❌ Error fetching profiles:', error.message);
    console.log('\nMake sure:');
    console.log('1. Your access token is correct');
    console.log('2. Token has "read" scope');
    console.log('3. Accounts are connected in Buffer dashboard\n');
  }

  rl.close();
}

// Run
getBufferProfiles().catch(console.error);

