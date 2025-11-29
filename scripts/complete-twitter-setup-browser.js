/**
 * Complete Twitter OAuth Setup - Browser Automation Script
 * Run this in the browser console after logging into Twitter Developer Portal
 * 
 * Instructions:
 * 1. Log into https://developer.twitter.com/en/portal/dashboard
 * 2. Open browser console (F12)
 * 3. Copy and paste this entire script
 * 4. Press Enter
 * 5. Follow the prompts
 */

(async function completeTwitterSetup() {
  console.log('%c🚀 Twitter OAuth Setup Automation', 'font-size: 20px; font-weight: bold; color: #1DA1F2;');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Step 1: Check if we're on the right page
  const currentUrl = window.location.href;
  if (!currentUrl.includes('developer.twitter.com')) {
    console.log('❌ Please navigate to: https://developer.twitter.com/en/portal/dashboard');
    console.log('   Then run this script again.\n');
    return;
  }

  console.log('✅ Found Twitter Developer Portal\n');

  // Step 2: Look for existing apps or create new one
  console.log('📋 Step 1: Checking for existing apps...\n');
  
  // Function to find and click "Create App" button
  function findCreateAppButton() {
    const buttons = Array.from(document.querySelectorAll('button, a'));
    for (let btn of buttons) {
      const text = btn.textContent?.toLowerCase() || '';
      if (text.includes('create app') || text.includes('create project') || text.includes('new app')) {
        return btn;
      }
    }
    return null;
  }

  // Step 3: Guide user through OAuth setup
  console.log('📋 Step 2: OAuth 2.0 Setup Instructions\n');
  console.log('Please follow these steps:');
  console.log('1. Create a new App (or select existing)');
  console.log('2. Go to "User authentication settings"');
  console.log('3. Set up OAuth 2.0:');
  console.log('   - App permissions: "Read and write"');
  console.log('   - Type of App: "Web App, Automated App or Bot"');
  console.log('   - Callback URI: https://cryptorafts.com/api/blog/oauth/x/callback');
  console.log('   - Website URL: https://cryptorafts.com');
  console.log('4. Save changes\n');

  // Step 4: Extract credentials function
  function extractCredentials() {
    const credentials = {
      clientId: null,
      clientSecret: null
    };

    // Look for Client ID
    const allElements = document.querySelectorAll('*');
    for (let el of allElements) {
      const text = el.textContent || '';
      if (text.includes('Client ID') || text.includes('OAuth 2.0 Client ID')) {
        // Try to find the value
        let nextEl = el.nextElementSibling;
        if (!nextEl) nextEl = el.parentElement?.nextElementSibling;
        if (!nextEl) nextEl = el.closest('div')?.querySelector('input, code, span');
        
        if (nextEl) {
          const value = nextEl.value || nextEl.textContent?.trim();
          if (value && value.length > 10 && !value.includes(' ')) {
            credentials.clientId = value;
            break;
          }
        }
      }
    }

    // Look for Client Secret
    const secretInputs = document.querySelectorAll('input[type="password"], input[type="text"]');
    for (let input of secretInputs) {
      const label = input.closest('div')?.textContent || '';
      if (label.includes('Secret') || label.includes('Client Secret')) {
        if (input.value && input.value.length > 20) {
          credentials.clientSecret = input.value;
          break;
        }
      }
    }

    return credentials;
  }

  // Step 5: Wait for user to set up OAuth, then extract
  console.log('⏳ Waiting for you to complete OAuth setup...\n');
  console.log('Once you\'ve saved your OAuth settings, type: extractCredentials()\n');
  console.log('Or I\'ll check automatically in 30 seconds...\n');

  // Auto-check after 30 seconds
  setTimeout(async () => {
    console.log('🔍 Checking for credentials...\n');
    const creds = extractCredentials();
    
    if (creds.clientId && creds.clientSecret) {
      console.log('✅ Found credentials!\n');
      console.log('Client ID:', creds.clientId.substring(0, 20) + '...');
      console.log('Client Secret:', creds.clientSecret.substring(0, 20) + '...\n');
      
      console.log('📝 Next steps:');
      console.log('1. Copy these credentials');
      console.log('2. Run in terminal: npm run setup:twitter');
      console.log('3. Paste the credentials when prompted\n');
      
      // Copy to clipboard if possible
      if (navigator.clipboard) {
        const envContent = `TWITTER_CLIENT_ID=${creds.clientId}\nTWITTER_CLIENT_SECRET=${creds.clientSecret}\nTWITTER_REDIRECT_URI=https://cryptorafts.com/api/blog/oauth/x/callback\nNEXT_PUBLIC_APP_URL=https://cryptorafts.com`;
        try {
          await navigator.clipboard.writeText(envContent);
          console.log('✅ Credentials copied to clipboard!');
          console.log('   Paste into .env.local file\n');
        } catch (e) {
          console.log('⚠️  Could not copy to clipboard automatically');
        }
      }
    } else {
      console.log('❌ Credentials not found yet.');
      console.log('   Make sure you\'ve:');
      console.log('   1. Created/saved your OAuth 2.0 settings');
      console.log('   2. The page has loaded completely');
      console.log('   Then run: extractCredentials()\n');
    }
  }, 30000);

  // Make extractCredentials available globally
  window.extractCredentials = extractCredentials;
  
  console.log('💡 Tip: You can also run extractCredentials() manually anytime\n');
})();

