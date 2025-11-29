/**
 * Browser-Based Auto Setup for Buffer and Medium
 * This script runs in the browser to extract tokens and update .env.local
 */

// This will be injected into the browser
const browserExtractScript = `
(async function() {
  console.log('%c🚀 Auto-Extracting All Tokens...', 'font-size: 18px; font-weight: bold; color: #168eea;');
  
  const results = {
    buffer: { accessToken: null, profileIds: [] },
    medium: { accessToken: null },
    success: false
  };
  
  // Check localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const value = localStorage.getItem(key);
    if ((key.includes('buffer') || key.includes('token') || key.includes('access')) && value && value.length > 30) {
      if (!results.buffer.accessToken && /^[A-Za-z0-9_-]+$/.test(value)) {
        results.buffer.accessToken = value;
      }
    }
    if ((key.includes('medium') || key.includes('token') || key.includes('access')) && value && value.length > 20) {
      if (!results.medium.accessToken && /^[A-Za-z0-9_-]+$/.test(value)) {
        results.medium.accessToken = value;
      }
    }
  }
  
  // Check sessionStorage
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    const value = sessionStorage.getItem(key);
    if ((key.includes('buffer') || key.includes('token') || key.includes('access')) && value && value.length > 30) {
      if (!results.buffer.accessToken && /^[A-Za-z0-9_-]+$/.test(value)) {
        results.buffer.accessToken = value;
      }
    }
    if ((key.includes('medium') || key.includes('token') || key.includes('access')) && value && value.length > 20) {
      if (!results.medium.accessToken && /^[A-Za-z0-9_-]+$/.test(value)) {
        results.medium.accessToken = value;
      }
    }
  }
  
  // Check page content for tokens
  const pageText = document.body.innerText || '';
  const tokenMatches = pageText.match(/[A-Za-z0-9_-]{40,}/g);
  if (tokenMatches) {
    const likelyTokens = tokenMatches.filter(t => t.length > 40 && t.length < 200 && /^[A-Za-z0-9_-]+$/.test(t));
    if (likelyTokens.length > 0) {
      // Check if it's a Buffer token (usually starts with specific pattern)
      const bufferToken = likelyTokens.find(t => t.length > 50);
      if (bufferToken && !results.buffer.accessToken) {
        results.buffer.accessToken = bufferToken;
      }
    }
  }
  
  // Try to fetch Buffer profiles
  if (results.buffer.accessToken) {
    try {
      const response = await fetch(\`https://api.bufferapp.com/1/profiles.json?access_token=\${results.buffer.accessToken}\`);
      if (response.ok) {
        const profiles = await response.json();
        if (Array.isArray(profiles)) {
          results.buffer.profileIds = profiles.filter(p => !p.disabled).map(p => p.id);
        }
      }
    } catch (e) {
      console.log('Could not fetch profiles:', e.message);
    }
  }
  
  results.success = !!(results.buffer.accessToken || results.medium.accessToken);
  
  // Output
  if (results.buffer.accessToken) {
    console.log('✅ Buffer token found:', results.buffer.accessToken.substring(0, 20) + '...');
    if (results.buffer.profileIds.length > 0) {
      console.log('✅ Profile IDs:', results.buffer.profileIds.join(', '));
    }
  }
  if (results.medium.accessToken) {
    console.log('✅ Medium token found:', results.medium.accessToken.substring(0, 20) + '...');
  }
  
  return results;
})();
`;

console.log(`
📋 Browser Token Extraction Script
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Copy and paste this into your browser console on Buffer or Medium pages:

${browserExtractScript}

Or run it programmatically via browser automation.
`);

module.exports = { browserExtractScript };

