/**
 * Extract Buffer API Token from Browser Console
 * 
 * INSTRUCTIONS:
 * 1. Sign in to Buffer: https://login.buffer.com/login
 * 2. Navigate to: https://buffer.com/developers/apps
 * 3. Create an app or select existing one
 * 4. Generate access token
 * 5. Open browser console (F12)
 * 6. Copy and paste this entire script
 * 7. It will extract the token and copy it to clipboard
 */

const extractBufferToken = `
(async function() {
  console.log('%c🔍 Extracting Buffer API Token...', 'font-size: 18px; font-weight: bold; color: #168eea;');
  console.log('');
  
  let token = null;
  const currentUrl = window.location.href;
  
  // Method 1: Check if we're on the apps page and look for token in page content
  if (currentUrl.includes('buffer.com/developers/apps')) {
    const pageText = document.body.innerText || '';
    
    // Look for token patterns
    const tokenPatterns = [
      /access[\\s-]?token["\\s:=]+([A-Za-z0-9_\\/\\-]{40,})/i,
      /token["\\s:=]+([A-Za-z0-9_\\/\\-]{40,})/i,
      /([A-Za-z0-9_\\/\\-]{50,})/g
    ];
    
    tokenPatterns.forEach(pattern => {
      const matches = pageText.match(pattern);
      if (matches && !token) {
        matches.forEach(m => {
          const t = typeof m === 'string' ? m : (m[1] || m);
          if (t && t.length > 40 && t.length < 200) {
            // Filter out URLs and common non-token strings
            if (!t.includes(' ') && 
                !t.includes('http') && 
                !t.includes('buffer.com') &&
                !t.includes('@') &&
                (t.includes('/') || /^[A-Za-z0-9_-]+$/.test(t))) {
              token = t;
            }
          }
        });
      }
    });
    
    // Method 2: Check input fields, textareas, and code blocks
    if (!token) {
      const inputs = document.querySelectorAll('input, textarea, code, pre, .token, [class*="token"]');
      inputs.forEach(el => {
        const value = el.value || el.textContent || el.innerText || '';
        if (value.length > 40 && value.length < 200) {
          // Check if it looks like a token
          if ((value.includes('/') || /^[A-Za-z0-9_-]+$/.test(value)) &&
              !value.includes(' ') &&
              !value.includes('http') &&
              !value.includes('@')) {
            token = value.trim();
          }
        }
      });
    }
    
    // Method 3: Check for token in data attributes or hidden fields
    if (!token) {
      const hiddenInputs = document.querySelectorAll('input[type="hidden"], [data-token], [data-access-token]');
      hiddenInputs.forEach(el => {
        const value = el.value || el.getAttribute('data-token') || el.getAttribute('data-access-token') || '';
        if (value.length > 40 && value.length < 200) {
          token = value;
        }
      });
    }
  }
  
  // Method 4: Check localStorage for tokens
  if (!token) {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const value = localStorage.getItem(key);
      if (value && (key.toLowerCase().includes('token') || 
                   key.toLowerCase().includes('access') ||
                   key.toLowerCase().includes('buffer'))) {
        if (value.length > 40 && value.length < 200) {
          // Try to parse if it's JSON
          try {
            const parsed = JSON.parse(value);
            if (parsed.token || parsed.access_token) {
              token = parsed.token || parsed.access_token;
            }
          } catch (e) {
            // Not JSON, check if it's a plain token
            if ((value.includes('/') || /^[A-Za-z0-9_-]+$/.test(value)) &&
                !value.includes(' ') &&
                !value.includes('http')) {
              token = value;
            }
          }
        }
      }
    }
  }
  
  // Output results
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  
  if (token) {
    console.log('✅ Buffer API Token Found!');
    console.log('Token:', token.substring(0, 30) + '...');
    console.log('');
    console.log('📋 Full token:', token);
    console.log('');
    
    // Copy to clipboard
    try {
      await navigator.clipboard.writeText(token);
      console.log('✅ Copied to clipboard!');
      console.log('');
      console.log('📝 Next step: Run: npm run setup:buffer:complete');
      console.log('   Then paste this token when prompted.');
    } catch (e) {
      console.log('⚠️  Could not copy automatically');
      console.log('   Please copy the token above manually');
    }
    
    return token;
  } else {
    console.log('❌ Token not found automatically');
    console.log('');
    console.log('💡 To get your Buffer API token:');
    console.log('1. Make sure you are on: https://buffer.com/developers/apps');
    console.log('2. Sign in if needed');
    console.log('3. Click "My Apps" or "Create App"');
    console.log('4. Create an app or select existing one');
    console.log('5. Look for "Access Token" or "Generate Token" section');
    console.log('6. Click "Generate Access Token"');
    console.log('7. Copy the token');
    console.log('8. Run: npm run setup:buffer:complete');
    console.log('   Then paste the token when prompted');
    console.log('');
    return null;
  }
})();
`;

console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Buffer Token Extractor - Browser Console Script
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Copy and paste this into the browser console on:
https://buffer.com/developers/apps

${extractBufferToken}

Or run: extractBufferToken()
`);

// Make function available globally
if (typeof window !== 'undefined') {
  window.extractBufferToken = new Function(
    extractBufferToken
      .replace('(async function()', 'return (async function()')
      .replace('})();', '})();')
  );
  
  console.log('✅ Function available as: extractBufferToken()');
  console.log('   Just type: extractBufferToken() in console');
}

