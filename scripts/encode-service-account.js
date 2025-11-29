/**
 * Quick script to encode service account JSON to Base64
 * Usage: node scripts/encode-service-account.js [path-to-service-account.json]
 */

const fs = require('fs');
const path = require('path');

const serviceAccountPath = process.argv[2] || path.join(process.cwd(), 'secrets', 'service-account.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error(`❌ File not found: ${serviceAccountPath}`);
  console.log('\nUsage: node scripts/encode-service-account.js [path-to-service-account.json]');
  process.exit(1);
}

try {
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  
  // Validate
  if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
    console.error('❌ Invalid service account file. Missing required fields.');
    process.exit(1);
  }

  if (serviceAccount.private_key.includes('REPLACE_ME')) {
    console.error('❌ This appears to be a template file. Please download a real service account from Firebase Console.');
    process.exit(1);
  }

  // Encode to Base64
  const jsonString = JSON.stringify(serviceAccount);
  const base64 = Buffer.from(jsonString).toString('base64');
  
  // Output
  console.log('\n✅ Base64 encoded service account:\n');
  console.log(base64);
  console.log('\n📋 Copy the above Base64 string and add it to Vercel as FIREBASE_SERVICE_ACCOUNT_B64\n');

} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}

