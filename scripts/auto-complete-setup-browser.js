/**
 * Auto-Complete Setup - Browser Console Script
 * Run this in the browser console on Buffer and Medium pages to extract tokens
 * Then run: node scripts/complete-setup-with-tokens.js
 */

// Buffer Token Extractor - Run on https://buffer.com/developers/apps (after login)
const extractBufferToken = `
(async function() {
  console.log('%c🔍 Extracting Buffer Token...', 'font-size: 18px; font-weight: bold; color: #168eea;');
  
  let token = null;
  
  // Method 1: Check page content for token
  const pageText = document.body.innerText || '';
  const tokenMatch = pageText.match(/[A-Za-z0-9_-]{50,}/g);
  if (tokenMatch) {
    const likelyTokens = tokenMatch.filter(t => t.length > 50 && t.length < 200);
    if (likelyTokens.length > 0) {
      token = likelyTokens[0];
      console.log('✅ Found token in page content');
    }
  }
  
  // Method 2: Check localStorage
  if (!token) {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const value = localStorage.getItem(key);
      if (value && (key.includes('token') || key.includes('access') || key.includes('auth'))) {
        if (value.length > 40 && /^[A-Za-z0-9_-]+$/.test(value)) {
          token = value;
          console.log('✅ Found token in localStorage:', key);
          break;
        }
      }
    }
  }
  
  // Method 3: Check network requests
  if (!token) {
    console.log('⚠️  Token not found. Please:');
    console.log('1. Go to: https://buffer.com/developers/apps/create');
    console.log('2. Create app → Generate access token');
    console.log('3. Copy the token manually');
  } else {
    console.log('✅ Buffer Token:', token.substring(0, 20) + '...');
    console.log('📋 Full token:', token);
    
    // Copy to clipboard
    try {
      await navigator.clipboard.writeText(token);
      console.log('✅ Copied to clipboard!');
    } catch (e) {
      console.log('⚠️  Could not copy automatically');
    }
  }
  
  return token;
})();
`;

// Medium Token Extractor - Run on https://medium.com/me/applications (after login)
const extractMediumToken = `
(async function() {
  console.log('%c🔍 Extracting Medium Token...', 'font-size: 18px; font-weight: bold; color: #00ab6c;');
  
  let token = null;
  
  // Check for "Get integration token" button or token display
  const pageText = document.body.innerText || '';
  
  // Look for integration token
  if (pageText.includes('integration token') || pageText.includes('Integration Token')) {
    const tokenMatch = pageText.match(/[A-Za-z0-9_-]{50,}/g);
    if (tokenMatch) {
      const likelyTokens = tokenMatch.filter(t => t.length > 50 && t.length < 200);
      if (likelyTokens.length > 0) {
        token = likelyTokens[0];
        console.log('✅ Found token in page content');
      }
    }
  }
  
  if (!token) {
    console.log('⚠️  Token not found. Please:');
    console.log('1. Click "Get integration token" button');
    console.log('2. Copy the token that appears');
    console.log('3. Or check the page for the token');
  } else {
    console.log('✅ Medium Token:', token.substring(0, 20) + '...');
    console.log('📋 Full token:', token);
    
    // Copy to clipboard
    try {
      await navigator.clipboard.writeText(token);
      console.log('✅ Copied to clipboard!');
    } catch (e) {
      console.log('⚠️  Could not copy automatically');
    }
  }
  
  return token;
})();
`;

console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Auto-Complete Setup - Browser Console Scripts
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

For Buffer:
1. Navigate to: https://buffer.com/developers/apps/create
2. Sign in if needed
3. Create app or use existing
4. Generate access token
5. Run this in console:
${extractBufferToken}

For Medium:
1. Navigate to: https://medium.com/me/applications
2. Sign in if needed
3. Click "Get integration token"
4. Run this in console:
${extractMediumToken}

Then run: node scripts/complete-setup-with-tokens.js
`);

// Make functions available
window.extractBufferToken = new Function(extractBufferToken.replace('(async function()', 'return (async function()').replace('})();', '})();'));
window.extractMediumToken = new Function(extractMediumToken.replace('(async function()', 'return (async function()').replace('})();', '})();'));

