/**
 * Twitter/X OAuth Setup Verification Script
 * Checks if all required environment variables are set
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Twitter/X OAuth Setup...\n');

// Check for .env.local file
const envPath = path.join(process.cwd(), '.env.local');
const envExamplePath = path.join(process.cwd(), '.env.local.example');

let envExists = fs.existsSync(envPath);
let envContent = '';

if (envExists) {
  envContent = fs.readFileSync(envPath, 'utf8');
} else {
  console.log('⚠️  .env.local file not found!');
  console.log('   Creating .env.local.example for reference...\n');
  
  const exampleContent = `# X (Twitter) OAuth 2.0 Configuration
# Get these from: https://developer.twitter.com/en/portal/dashboard

TWITTER_CLIENT_ID=your_twitter_client_id_here
TWITTER_CLIENT_SECRET=your_twitter_client_secret_here
TWITTER_REDIRECT_URI=https://cryptorafts.com/api/blog/oauth/x/callback

# App URL
NEXT_PUBLIC_APP_URL=https://cryptorafts.com

# Optional: Medium Integration
MEDIUM_CLIENT_ID=your_medium_client_id_here
MEDIUM_CLIENT_SECRET=your_medium_client_secret_here
MEDIUM_REDIRECT_URI=https://cryptorafts.com/api/blog/oauth/medium/callback
`;

  if (!fs.existsSync(envExamplePath)) {
    fs.writeFileSync(envExamplePath, exampleContent);
    console.log('✅ Created .env.local.example');
  }
  
  console.log('\n📝 Next steps:');
  console.log('   1. Copy .env.local.example to .env.local');
  console.log('   2. Add your Twitter API credentials');
  console.log('   3. Run this script again to verify\n');
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
const requiredVars = {
  'TWITTER_CLIENT_ID': 'Twitter OAuth 2.0 Client ID',
  'TWITTER_CLIENT_SECRET': 'Twitter OAuth 2.0 Client Secret',
  'TWITTER_REDIRECT_URI': 'Twitter OAuth Callback URL',
  'NEXT_PUBLIC_APP_URL': 'Your app URL',
};

const optionalVars = {
  'MEDIUM_CLIENT_ID': 'Medium OAuth Client ID',
  'MEDIUM_CLIENT_SECRET': 'Medium OAuth Client Secret',
};

let allGood = true;

console.log('📋 Checking Required Variables:\n');

Object.entries(requiredVars).forEach(([key, description]) => {
  const value = envVars[key];
  if (!value || value.includes('your_') || value.includes('_here')) {
    console.log(`❌ ${key}`);
    console.log(`   Missing or not configured: ${description}`);
    console.log(`   Get it from: https://developer.twitter.com/en/portal/dashboard\n`);
    allGood = false;
  } else {
    // Mask sensitive values
    const masked = key.includes('SECRET') || key.includes('TOKEN')
      ? value.substring(0, 8) + '...' + value.substring(value.length - 4)
      : value;
    console.log(`✅ ${key}`);
    console.log(`   ${description}: ${masked}\n`);
  }
});

console.log('📋 Checking Optional Variables:\n');

Object.entries(optionalVars).forEach(([key, description]) => {
  const value = envVars[key];
  if (!value || value.includes('your_') || value.includes('_here')) {
    console.log(`⚪ ${key} - Not configured (optional)`);
  } else {
    const masked = key.includes('SECRET') || key.includes('TOKEN')
      ? value.substring(0, 8) + '...' + value.substring(value.length - 4)
      : value;
    console.log(`✅ ${key}`);
    console.log(`   ${description}: ${masked}\n`);
  }
});

// Validate redirect URI format
if (envVars.TWITTER_REDIRECT_URI) {
  const redirectUri = envVars.TWITTER_REDIRECT_URI;
  if (!redirectUri.includes('/api/blog/oauth/x/callback')) {
    console.log('⚠️  Warning: TWITTER_REDIRECT_URI should end with /api/blog/oauth/x/callback');
    console.log(`   Current: ${redirectUri}\n`);
  }
}

// Final summary
console.log('\n' + '='.repeat(50));
if (allGood) {
  console.log('✅ All required Twitter/X OAuth variables are configured!');
  console.log('\n📝 Next steps:');
  console.log('   1. Make sure your Twitter Developer App has:');
  console.log('      - OAuth 2.0 enabled');
  console.log('      - Callback URL set to:', envVars.TWITTER_REDIRECT_URI || 'NOT SET');
  console.log('      - App permissions: "Read and write"');
  console.log('   2. Restart your development server');
  console.log('   3. Go to /admin/blog and click "Connect" on X (Twitter)');
  console.log('   4. Authorize the app with your @cryptoraftsblog account\n');
} else {
  console.log('❌ Some required variables are missing or not configured');
  console.log('\n📚 See TWITTER_OAUTH_SETUP_STEPS.md for detailed setup instructions\n');
  process.exit(1);
}

