/**
 * Browser Automation Script for Twitter OAuth Setup
 * This script helps automate the Twitter Developer Portal setup process
 * 
 * Note: You'll need to be logged into Twitter/X first
 * Run this in the browser console or use Playwright/Puppeteer
 */

// Instructions for manual setup with browser automation
const setupInstructions = {
  step1: {
    title: "Navigate to Twitter Developer Portal",
    url: "https://developer.twitter.com/en/portal/dashboard",
    action: "Make sure you're logged into X/Twitter first"
  },
  step2: {
    title: "Create or Select an App",
    selector: "button:contains('Create App') or 'Create Project'",
    action: "Click to create a new app for CryptoRafts Blog"
  },
  step3: {
    title: "Configure OAuth 2.0 Settings",
    instructions: [
      "1. Go to 'User authentication settings'",
      "2. Click 'Set up' or 'Edit'",
      "3. Set App permissions to 'Read and write'",
      "4. Set Type of App to 'Web App, Automated App or Bot'",
      "5. Add Callback URI: https://cryptorafts.com/api/blog/oauth/x/callback",
      "6. Add Website URL: https://cryptorafts.com",
      "7. Save changes"
    ]
  },
  step4: {
    title: "Get OAuth 2.0 Credentials",
    instructions: [
      "1. After saving, you'll see OAuth 2.0 Client ID and Client Secret",
      "2. Copy both values",
      "3. Run: npm run setup:twitter",
      "4. Paste the credentials when prompted"
    ]
  }
};

// Function to extract credentials from the page (if accessible)
function extractTwitterCredentials() {
  const credentials = {
    clientId: null,
    clientSecret: null
  };

  // Try to find Client ID
  const clientIdElements = document.querySelectorAll('*');
  clientIdElements.forEach(el => {
    const text = el.textContent || '';
    if (text.includes('Client ID') || text.includes('OAuth 2.0 Client ID')) {
      const nextSibling = el.nextElementSibling;
      if (nextSibling) {
        const value = nextSibling.textContent?.trim() || nextSibling.value;
        if (value && value.length > 20) {
          credentials.clientId = value;
        }
      }
    }
  });

  // Try to find Client Secret
  const secretElements = document.querySelectorAll('input[type="password"], input[value*="secret" i]');
  secretElements.forEach(el => {
    if (el.value && el.value.length > 20) {
      credentials.clientSecret = el.value;
    }
  });

  return credentials;
}

// Console helper function
console.log(`
🚀 Twitter OAuth Setup Helper
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

To use this script:
1. Log into https://developer.twitter.com/en/portal/dashboard
2. Open browser console (F12)
3. Paste this script
4. Run: extractTwitterCredentials()

Or follow these steps manually:
${JSON.stringify(setupInstructions, null, 2)}
`);

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { extractTwitterCredentials, setupInstructions };
}

