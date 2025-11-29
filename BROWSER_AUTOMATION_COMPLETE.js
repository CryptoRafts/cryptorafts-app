/**
 * COMPLETE TWITTER OAUTH SETUP - Browser Console Script
 * 
 * INSTRUCTIONS:
 * 1. Make sure you're logged into X/Twitter
 * 2. Navigate to: https://developer.twitter.com/en/portal/dashboard
 * 3. Open browser console (F12 → Console tab)
 * 4. Copy and paste this ENTIRE file
 * 5. Press Enter
 * 6. Follow the automated prompts
 */

(async function completeTwitterOAuthSetup() {
  console.clear();
  console.log('%c🚀 COMPLETE TWITTER OAUTH SETUP', 'font-size: 24px; font-weight: bold; color: #1DA1F2; padding: 10px;');
  console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #1DA1F2;');
  console.log('');

  // Check current page
  const url = window.location.href;
  console.log('📍 Current URL:', url);
  console.log('');

  if (!url.includes('developer.twitter.com')) {
    console.log('%c⚠️  Please navigate to Twitter Developer Portal first!', 'color: orange; font-weight: bold;');
    console.log('');
    console.log('👉 Go to: https://developer.twitter.com/en/portal/dashboard');
    console.log('');
    console.log('Then run this script again.');
    return;
  }

  console.log('✅ Found Twitter Developer Portal');
  console.log('');

  // Function to extract credentials
  function extractCredentials() {
    console.log('🔍 Searching for OAuth credentials...');
    console.log('');

    const credentials = {
      clientId: null,
      clientSecret: null,
      found: false
    };

    // Method 1: Look for Client ID in text
    const allText = document.body.innerText || '';
    const clientIdMatch = allText.match(/Client ID[:\s]+([A-Za-z0-9_-]{20,})/i);
    if (clientIdMatch) {
      credentials.clientId = clientIdMatch[1];
    }

    // Method 2: Look in input fields and code elements
    document.querySelectorAll('input, code, span, div').forEach(el => {
      const text = el.textContent || el.value || '';
      const parentText = el.closest('div')?.textContent || '';
      
      // Check for Client ID
      if ((parentText.includes('Client ID') || parentText.includes('OAuth 2.0 Client ID')) && !credentials.clientId) {
        const value = el.value || el.textContent?.trim();
        if (value && value.length > 15 && /^[A-Za-z0-9_-]+$/.test(value)) {
          credentials.clientId = value;
        }
      }
      
      // Check for Client Secret
      if ((parentText.includes('Client Secret') || parentText.includes('Secret')) && !credentials.clientSecret) {
        const value = el.value || el.textContent?.trim();
        if (value && value.length > 30 && /^[A-Za-z0-9_-]+$/.test(value)) {
          credentials.clientSecret = value;
        }
      }
    });

    // Method 3: Look for password inputs (secrets are often in password fields)
    document.querySelectorAll('input[type="password"], input[type="text"]').forEach(input => {
      const label = input.closest('div, label')?.textContent || '';
      if (label.includes('Secret') && input.value && input.value.length > 30) {
        credentials.clientSecret = input.value;
      }
    });

    credentials.found = !!(credentials.clientId && credentials.clientSecret);
    return credentials;
  }

  // Extract credentials
  let creds = extractCredentials();

  if (!creds.found) {
    console.log('❌ OAuth credentials not found on this page.');
    console.log('');
    console.log('📋 Please complete these steps:');
    console.log('');
    console.log('1. Create a new App (or select existing)');
    console.log('2. Go to "User authentication settings"');
    console.log('3. Click "Set up" or "Edit"');
    console.log('4. Configure:');
    console.log('   - App permissions: "Read and write"');
    console.log('   - Type of App: "Web App, Automated App or Bot"');
    console.log('   - Callback URI: https://cryptorafts.com/api/blog/oauth/x/callback');
    console.log('   - Website URL: https://cryptorafts.com');
    console.log('5. Click "Save"');
    console.log('');
    console.log('6. After saving, run this script again or type: extractCredentials()');
    console.log('');
    
    // Make function available globally
    window.extractCredentials = extractCredentials;
    return;
  }

  // Credentials found!
  console.log('✅ Credentials found!');
  console.log('');
  console.log('Client ID:', creds.clientId.substring(0, 20) + '...');
  console.log('Client Secret:', creds.clientSecret.substring(0, 20) + '...');
  console.log('');

  // Generate .env.local content
  const envContent = `# X (Twitter) OAuth 2.0 Configuration
TWITTER_CLIENT_ID=${creds.clientId}
TWITTER_CLIENT_SECRET=${creds.clientSecret}
TWITTER_REDIRECT_URI=https://cryptorafts.com/api/blog/oauth/x/callback

# App URL
NEXT_PUBLIC_APP_URL=https://cryptorafts.com`;

  console.log('📝 .env.local content:');
  console.log('%c' + envContent, 'background: #1e1e1e; color: #d4d4d4; padding: 10px; font-family: monospace;');
  console.log('');

  // Try to copy to clipboard
  try {
    await navigator.clipboard.writeText(envContent);
    console.log('✅ Copied to clipboard!');
    console.log('');
  } catch (e) {
    console.log('⚠️  Could not copy automatically. Please copy manually.');
    console.log('');
  }

  console.log('📋 Next Steps:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('1. Open your project folder');
  console.log('2. Open or create .env.local file');
  console.log('3. Paste the content above (or run: npm run setup:twitter)');
  console.log('4. Save the file');
  console.log('5. Run: npm run verify:twitter');
  console.log('6. Start dev server: npm run dev');
  console.log('7. Go to: http://localhost:3001/admin/blog');
  console.log('8. Click "Connect" on X (Twitter)');
  console.log('9. Authorize the app');
  console.log('');
  console.log('🎉 Done! Your blog will now auto-post to @cryptoraftsblog!');
  console.log('');

  // Also make available as return value
  return {
    clientId: creds.clientId,
    clientSecret: creds.clientSecret,
    envContent: envContent
  };
})();

