/**
 * Extract Medium Integration Token from Browser Console
 * Run this in the browser console on https://medium.com/me/applications (after login)
 */

const extractMediumToken = `
(async function() {
  console.log('%c🔍 Extracting Medium Integration Token...', 'font-size: 18px; font-weight: bold; color: #00ab6c;');
  console.log('');
  
  let token = null;
  
  // Method 1: Look for integration token in page content
  const pageText = document.body.innerText || '';
  
  // Check if we're on the applications page
  if (window.location.href.includes('medium.com/me/applications')) {
    // Look for token patterns
    const tokenPatterns = [
      /integration[\\s-]?token["\\s:=]+([A-Za-z0-9_-]{50,})/i,
      /token["\\s:=]+([A-Za-z0-9_-]{50,})/i,
      /([A-Za-z0-9_-]{60,})/g
    ];
    
    tokenPatterns.forEach(pattern => {
      const matches = pageText.match(pattern);
      if (matches && !token) {
        matches.forEach(m => {
          const t = typeof m === 'string' ? m : (m[1] || m);
          if (t && t.length > 50 && t.length < 200 && /^[A-Za-z0-9_-]+$/.test(t)) {
            // Filter out common non-token strings
            if (!t.includes(' ') && !t.includes('http') && !t.includes('medium.com')) {
              token = t;
            }
          }
        });
      }
    });
    
    // Method 2: Check for token in input fields or code blocks
    const inputs = document.querySelectorAll('input, textarea, code');
    inputs.forEach(el => {
      const value = el.value || el.textContent || '';
      if (value.length > 50 && value.length < 200 && /^[A-Za-z0-9_-]+$/.test(value)) {
        if (!value.includes(' ') && !value.includes('http')) {
          token = value;
        }
      }
    });
    
    // Method 3: Check localStorage for tokens
    if (!token) {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        if (value && (key.includes('token') || key.includes('integration'))) {
          if (value.length > 50 && /^[A-Za-z0-9_-]+$/.test(value)) {
            token = value;
            console.log('✅ Found token in localStorage:', key);
            break;
          }
        }
      }
    }
  }
  
  if (token) {
    console.log('✅ Medium Integration Token Found!');
    console.log('Token:', token.substring(0, 20) + '...');
    console.log('');
    console.log('📋 Full token:', token);
    console.log('');
    
    // Copy to clipboard
    try {
      await navigator.clipboard.writeText(token);
      console.log('✅ Copied to clipboard!');
      console.log('');
      console.log('📝 Next step: Run: npm run complete:setup');
      console.log('   Then paste this token when prompted.');
    } catch (e) {
      console.log('⚠️  Could not copy automatically');
      console.log('   Please copy the token above manually');
    }
    
    return token;
  } else {
    console.log('⚠️  Token not found automatically');
    console.log('');
    console.log('💡 To get your Medium integration token:');
    console.log('1. Make sure you are logged in to Medium');
    console.log('2. Go to: https://medium.com/me/applications');
    console.log('3. Click "Get integration token" button');
    console.log('4. Copy the token that appears');
    console.log('5. Run: npm run complete:setup');
    console.log('   Then paste the token when prompted');
    console.log('');
    return null;
  }
})();
`;

console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Medium Token Extractor
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Copy and paste this into the browser console on:
https://medium.com/me/applications

${extractMediumToken}

Or run: extractMediumToken()
`);

// Make function available
if (typeof window !== 'undefined') {
  window.extractMediumToken = new Function(
    extractMediumToken
      .replace('(async function()', 'return (async function()')
      .replace('})();', '})();')
  );
}

