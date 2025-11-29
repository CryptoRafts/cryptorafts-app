/**
 * Auto-Extract Buffer Credentials from Browser
 * Run this in Buffer dashboard console to extract credentials
 */

// This script extracts Buffer credentials from the dashboard
const extractBufferCredentials = `
(async function() {
  console.log('%c🔍 Extracting Buffer Credentials...', 'font-size: 18px; font-weight: bold; color: #168eea;');
  console.log('');
  
  const credentials = {
    accessToken: null,
    profileIds: []
  };
  
  // Method 1: Check localStorage/sessionStorage for tokens
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const value = localStorage.getItem(key);
    if (value && (key.includes('token') || key.includes('access') || key.includes('auth'))) {
      if (value.length > 30 && /^[A-Za-z0-9_-]+$/.test(value)) {
        credentials.accessToken = value;
        console.log('✅ Found token in localStorage:', key);
        break;
      }
    }
  }
  
  // Method 2: Check sessionStorage
  if (!credentials.accessToken) {
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      const value = sessionStorage.getItem(key);
      if (value && (key.includes('token') || key.includes('access'))) {
        if (value.length > 30) {
          credentials.accessToken = value;
          console.log('✅ Found token in sessionStorage:', key);
          break;
        }
      }
    }
  }
  
  // Method 3: Check page content for API tokens
  const pageText = document.body.innerText || '';
  const tokenMatch = pageText.match(/[A-Za-z0-9_-]{40,}/g);
  if (tokenMatch && !credentials.accessToken) {
    // Filter for likely tokens
    const likelyTokens = tokenMatch.filter(t => t.length > 40 && t.length < 200);
    if (likelyTokens.length > 0) {
      credentials.accessToken = likelyTokens[0];
      console.log('✅ Found potential token in page content');
    }
  }
  
  // Method 4: Try to get profiles from API if we have a token
  if (credentials.accessToken) {
    try {
      const response = await fetch('https://api.bufferapp.com/1/profiles.json?access_token=' + credentials.accessToken);
      if (response.ok) {
        const profiles = await response.json();
        if (profiles && profiles.length > 0) {
          credentials.profileIds = profiles
            .filter(p => !p.disabled)
            .map(p => p.id);
          console.log('✅ Found', credentials.profileIds.length, 'active profiles');
        }
      }
    } catch (e) {
      console.log('⚠️  Could not fetch profiles via API');
    }
  }
  
  // Output results
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  
  if (credentials.accessToken) {
    console.log('✅ Access Token Found!');
    console.log('Token:', credentials.accessToken.substring(0, 20) + '...');
    console.log('');
  } else {
    console.log('❌ Access Token not found');
    console.log('');
    console.log('💡 To get your access token:');
    console.log('1. Go to: https://buffer.com/developers/apps/create');
    console.log('2. Create app → Generate access token');
    console.log('3. Copy the token');
    console.log('');
  }
  
  if (credentials.profileIds.length > 0) {
    console.log('✅ Profile IDs Found!');
    console.log('Profile IDs:', credentials.profileIds.join(', '));
    console.log('');
  } else {
    console.log('⚠️  Profile IDs not found');
    console.log('   You can get them by running: npm run get-buffer-profiles');
    console.log('');
  }
  
  // Generate .env.local content
  if (credentials.accessToken) {
    const envContent = \`# Buffer Configuration
BUFFER_ACCESS_TOKEN=\${credentials.accessToken}\${credentials.profileIds.length > 0 ? \`\\nBUFFER_PROFILE_IDS=\${credentials.profileIds.join(',')}\` : ''}\`;
    
    console.log('📝 .env.local content:');
    console.log('%c' + envContent, 'background: #1e1e1e; color: #d4d4d4; padding: 10px; font-family: monospace;');
    console.log('');
    
    // Try to copy to clipboard
    try {
      await navigator.clipboard.writeText(envContent);
      console.log('✅ Copied to clipboard!');
    } catch (e) {
      console.log('⚠️  Could not copy automatically');
    }
  }
  
  return credentials;
})();
`;

console.log(`
📋 Buffer Credentials Extractor
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Copy and paste this script into Buffer dashboard console:

${extractBufferCredentials}

Or run: extractBufferCredentials()
`);

// Make function available
window.extractBufferCredentials = new Function(extractBufferCredentials.replace('(async function()', 'return (async function()').replace('})();', '})();'));

