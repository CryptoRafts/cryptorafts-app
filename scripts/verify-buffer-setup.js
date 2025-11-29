/**
 * Buffer Setup Verification Script
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Buffer Setup...\n');

const envPath = path.join(process.cwd(), '.env.local');
let envExists = fs.existsSync(envPath);
let envContent = '';

if (envExists) {
  envContent = fs.readFileSync(envPath, 'utf8');
} else {
  console.log('❌ .env.local file not found!');
  console.log('   Run: npm run setup:buffer\n');
  process.exit(1);
}

// Parse environment variables
const envVars = {};
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  }
});

// Check required variables
const accessToken = envVars.BUFFER_ACCESS_TOKEN;
const profileIds = envVars.BUFFER_PROFILE_IDS;

console.log('📋 Buffer Configuration:\n');

if (accessToken && !accessToken.includes('your_') && accessToken.length > 20) {
  const masked = accessToken.substring(0, 8) + '...' + accessToken.substring(accessToken.length - 4);
  console.log('✅ BUFFER_ACCESS_TOKEN:', masked);
} else {
  console.log('❌ BUFFER_ACCESS_TOKEN: Not configured');
  console.log('   Get it from: https://buffer.com/developers/apps\n');
}

if (profileIds && !profileIds.includes('profile_id')) {
  console.log('✅ BUFFER_PROFILE_IDS:', profileIds);
} else {
  console.log('⚠️  BUFFER_PROFILE_IDS: Not configured (optional)');
  console.log('   Get from Buffer dashboard or API\n');
}

console.log('\n' + '='.repeat(50));
if (accessToken && accessToken.length > 20) {
  console.log('✅ Buffer is configured!');
  console.log('\n📝 Next steps:');
  console.log('1. Make sure X and Medium are connected in Buffer');
  console.log('2. Restart dev server: npm run dev');
  console.log('3. Test posting from admin blog panel\n');
} else {
  console.log('❌ Buffer not fully configured');
  console.log('\n📚 See BUFFER_SETUP_GUIDE.md for setup instructions\n');
  process.exit(1);
}

