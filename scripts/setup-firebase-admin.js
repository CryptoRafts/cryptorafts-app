/**
 * Firebase Admin SDK Setup Helper
 * This script helps you encode your service account JSON to Base64
 * for use in Vercel environment variables
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

async function main() {
  console.log('\n🔥 Firebase Admin SDK Setup Helper\n');
  console.log('This script will help you encode your Firebase service account JSON to Base64.');
  console.log('You need this for the FIREBASE_SERVICE_ACCOUNT_B64 environment variable in Vercel.\n');

  // Check if secrets directory exists
  const secretsDir = path.join(process.cwd(), 'secrets');
  if (!fs.existsSync(secretsDir)) {
    fs.mkdirSync(secretsDir, { recursive: true });
    console.log('✅ Created secrets directory');
  }

  const serviceAccountPath = path.join(secretsDir, 'service-account.json');
  const base64OutputPath = path.join(secretsDir, 'service-account-base64.txt');

  // Check if service account file already exists
  if (fs.existsSync(serviceAccountPath)) {
    console.log(`\n📄 Found existing service account file: ${serviceAccountPath}`);
    const useExisting = await question('Do you want to use this file? (y/n): ');
    
    if (useExisting.toLowerCase() === 'y') {
      try {
        const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
        
        // Check if it's a template
        if (serviceAccount.private_key && serviceAccount.private_key.includes('REPLACE_ME')) {
          console.log('❌ This appears to be a template file. Please download a real service account from Firebase Console.');
          process.exit(1);
        }

        // Encode to Base64
        const jsonString = JSON.stringify(serviceAccount);
        const base64 = Buffer.from(jsonString).toString('base64');
        
        // Save to file
        fs.writeFileSync(base64OutputPath, base64);
        console.log(`\n✅ Base64 encoded service account saved to: ${base64OutputPath}`);
        console.log('\n📋 Next steps:');
        console.log('1. Copy the contents of the base64 file');
        console.log('2. Go to Vercel: https://vercel.com/your-project/settings/environment-variables');
        console.log('3. Add variable: FIREBASE_SERVICE_ACCOUNT_B64');
        console.log('4. Paste the Base64 string as the value');
        console.log('5. Apply to: Production, Preview, Development');
        console.log('6. Redeploy your application\n');
        
        // Also show first 50 chars for verification
        console.log(`🔍 Base64 preview (first 50 chars): ${base64.substring(0, 50)}...\n`);
        
        rl.close();
        return;
      } catch (error) {
        console.error('❌ Error reading service account file:', error.message);
        process.exit(1);
      }
    }
  }

  console.log('\n📥 To get your Firebase service account:');
  console.log('1. Go to: https://console.firebase.google.com/project/cryptorafts-b9067/settings/serviceaccounts/adminsdk');
  console.log('2. Click "Generate new private key"');
  console.log('3. Save the JSON file');
  console.log('\n');

  const filePath = await question('Enter the path to your service account JSON file (or drag & drop the file): ');
  const cleanPath = filePath.trim().replace(/^["']|["']$/g, '');

  if (!fs.existsSync(cleanPath)) {
    console.error(`❌ File not found: ${cleanPath}`);
    process.exit(1);
  }

  try {
    // Read and validate JSON
    const serviceAccount = JSON.parse(fs.readFileSync(cleanPath, 'utf8'));
    
    // Check required fields
    if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
      console.error('❌ Invalid service account file. Missing required fields.');
      process.exit(1);
    }

    // Check if it's a template
    if (serviceAccount.private_key.includes('REPLACE_ME')) {
      console.error('❌ This appears to be a template file. Please download a real service account from Firebase Console.');
      process.exit(1);
    }

    // Copy to secrets directory
    fs.writeFileSync(serviceAccountPath, JSON.stringify(serviceAccount, null, 2));
    console.log(`✅ Service account copied to: ${serviceAccountPath}`);

    // Encode to Base64
    const jsonString = JSON.stringify(serviceAccount);
    const base64 = Buffer.from(jsonString).toString('base64');
    
    // Save to file
    fs.writeFileSync(base64OutputPath, base64);
    console.log(`✅ Base64 encoded service account saved to: ${base64OutputPath}`);

    console.log('\n📋 Next steps:');
    console.log('1. Copy the contents of the base64 file');
    console.log('2. Go to Vercel: https://vercel.com/your-project/settings/environment-variables');
    console.log('3. Add variable: FIREBASE_SERVICE_ACCOUNT_B64');
    console.log('4. Paste the Base64 string as the value');
    console.log('5. Apply to: Production, Preview, Development');
    console.log('6. Redeploy your application\n');
    
    // Show first 50 chars for verification
    console.log(`🔍 Base64 preview (first 50 chars): ${base64.substring(0, 50)}...\n`);

  } catch (error) {
    console.error('❌ Error processing service account:', error.message);
    process.exit(1);
  }

  rl.close();
}

main().catch(console.error);
