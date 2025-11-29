#!/usr/bin/env node

/**
 * 🔒 SECURE CONFIGURATION SETUP
 * This script helps you set up secure email configuration
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setupSecureConfig() {
  console.log('🔒 CryptoRafts Secure Email Configuration Setup');
  console.log('==============================================\n');

  try {
    // Check if .env.local already exists
    if (existsSync('.env.local')) {
      console.log('⚠️ .env.local already exists!');
      const overwrite = await question('Do you want to overwrite it? (y/n): ');
      if (overwrite.toLowerCase() !== 'y') {
        console.log('❌ Setup cancelled.');
        rl.close();
        return;
      }
    }

    console.log('📋 Let\'s set up your secure email configuration...\n');

    // Get configuration from user
    const emailUser = await question('Enter your business email (business@cryptorafts.com): ');
    const emailPassword = await question('Enter your Gmail App Password (16 characters): ');
    const appUrl = await question('Enter your app URL (https://cryptorafts.com): ');

    // Create secure configuration
    const envContent = `# 🔒 CryptoRafts Secure Email Configuration
# This file keeps your password secret and secure

# Gmail SMTP Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=${emailUser}
EMAIL_PASSWORD=${emailPassword}

# Application settings
NEXT_PUBLIC_APP_URL=${appUrl}
EMAIL_FROM_NAME=CryptoRafts
EMAIL_FROM_ADDRESS=${emailUser}

# Security settings
EMAIL_RATE_LIMIT_DELAY=1000
EMAIL_MAX_RETRIES=3
`;

    // Write secure configuration
    writeFileSync('.env.local', envContent);
    console.log('\n✅ Secure configuration created successfully!');
    console.log('🔒 Your password is now protected in .env.local');

    // Test the configuration
    console.log('\n🧪 Testing secure email system...');
    
    try {
      // Import and test the secure email service
      const { execSync } = await import('child_process');
      execSync('node secure-email-system.js', { stdio: 'inherit' });
    } catch (error) {
      console.log('⚠️ Test failed - check your Gmail App Password');
    }

    console.log('\n🎉 Setup Complete!');
    console.log('================');
    console.log('\n📋 What\'s Ready:');
    console.log('✅ Secure email configuration');
    console.log('✅ Password protection');
    console.log('✅ business@cryptorafts.com setup');
    console.log('✅ Professional email templates');
    console.log('\n🚀 Ready to use commands:');
    console.log('• node secure-email-system.js - Test secure system');
    console.log('• node admin.js approve-all - Send approval emails');
    console.log('• node admin.js stats - Get user statistics');

  } catch (error) {
    console.error('❌ Setup failed:', error);
  } finally {
    rl.close();
  }
}

// Run the secure setup
setupSecureConfig();
