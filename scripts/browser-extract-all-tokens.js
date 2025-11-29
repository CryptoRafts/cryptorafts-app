/**
 * Browser Console Script to Extract All Tokens
 * Run this in the browser console on Buffer and Medium pages
 */

(async function extractAllTokens() {
  console.log('%c🔍 Extracting All Tokens...', 'font-size: 18px; font-weight: bold; color: #168eea;');
  console.log('');
  
  const results = {
    buffer: {
      accessToken: null,
      profileIds: []
    },
    medium: {
      accessToken: null
    },
    allStorage: {}
  };
  
  // Extract from localStorage
  console.log('📦 Checking localStorage...');
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const value = localStorage.getItem(key);
    results.allStorage[`localStorage.${key}`] = value?.substring(0, 50) + '...';
    
    // Check for Buffer tokens
    if ((key.toLowerCase().includes('buffer') || key.toLowerCase().includes('token') || key.toLowerCase().includes('access')) && value && value.length > 30) {
      if (!results.buffer.accessToken && /^[A-Za-z0-9_-]+$/.test(value)) {
        results.buffer.accessToken = value;
        console.log('✅ Found Buffer token in localStorage:', key);
      }
    }
    
    // Check for Medium tokens
    if ((key.toLowerCase().includes('medium') || key.toLowerCase().includes('token') || key.toLowerCase().includes('access')) && value && value.length > 20) {
      if (!results.medium.accessToken && /^[A-Za-z0-9_-]+$/.test(value)) {
        results.medium.accessToken = value;
        console.log('✅ Found Medium token in localStorage:', key);
      }
    }
  }
  
  // Extract from sessionStorage
  console.log('📦 Checking sessionStorage...');
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    const value = sessionStorage.getItem(key);
    results.allStorage[`sessionStorage.${key}`] = value?.substring(0, 50) + '...';
    
    // Check for Buffer tokens
    if ((key.toLowerCase().includes('buffer') || key.toLowerCase().includes('token') || key.toLowerCase().includes('access')) && value && value.length > 30) {
      if (!results.buffer.accessToken && /^[A-Za-z0-9_-]+$/.test(value)) {
        results.buffer.accessToken = value;
        console.log('✅ Found Buffer token in sessionStorage:', key);
      }
    }
    
    // Check for Medium tokens
    if ((key.toLowerCase().includes('medium') || key.toLowerCase().includes('token') || key.toLowerCase().includes('access')) && value && value.length > 20) {
      if (!results.medium.accessToken && /^[A-Za-z0-9_-]+$/.test(value)) {
        results.medium.accessToken = value;
        console.log('✅ Found Medium token in sessionStorage:', key);
      }
    }
  }
  
  // Check page content for tokens
  console.log('📄 Checking page content...');
  const pageText = document.body.innerText || '';
  const tokenMatches = pageText.match(/[A-Za-z0-9_-]{40,}/g);
  if (tokenMatches) {
    const likelyTokens = tokenMatches.filter(t => t.length > 40 && t.length < 200 && /^[A-Za-z0-9_-]+$/.test(t));
    if (likelyTokens.length > 0 && !results.buffer.accessToken) {
      results.buffer.accessToken = likelyTokens[0];
      console.log('✅ Found potential token in page content');
    }
  }
  
  // Try to fetch Buffer profiles if we have a token
  if (results.buffer.accessToken) {
    console.log('📡 Fetching Buffer profiles...');
    try {
      const response = await fetch(`https://api.bufferapp.com/1/profiles.json?access_token=${results.buffer.accessToken}`);
      if (response.ok) {
        const profiles = await response.json();
        if (Array.isArray(profiles) && profiles.length > 0) {
          results.buffer.profileIds = profiles
            .filter(p => !p.disabled)
            .map(p => p.id);
          console.log(`✅ Found ${results.buffer.profileIds.length} Buffer profiles`);
        }
      }
    } catch (e) {
      console.log('⚠️  Could not fetch profiles:', e.message);
    }
  }
  
  // Output results
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  
  if (results.buffer.accessToken) {
    console.log('✅ Buffer Access Token Found!');
    console.log('Token:', results.buffer.accessToken.substring(0, 20) + '...');
    if (results.buffer.profileIds.length > 0) {
      console.log('Profile IDs:', results.buffer.profileIds.join(', '));
    }
    console.log('');
  } else {
    console.log('❌ Buffer Access Token not found');
    console.log('💡 Go to: https://buffer.com/developers/apps/create');
    console.log('');
  }
  
  if (results.medium.accessToken) {
    console.log('✅ Medium Access Token Found!');
    console.log('Token:', results.medium.accessToken.substring(0, 20) + '...');
    console.log('');
  } else {
    console.log('❌ Medium Access Token not found');
    console.log('💡 Go to: https://medium.com/me/applications');
    console.log('');
  }
  
  // Generate .env.local content
  const envLines = [];
  
  if (results.buffer.accessToken) {
    envLines.push('# Buffer Configuration (X & LinkedIn)');
    envLines.push(`BUFFER_ACCESS_TOKEN=${results.buffer.accessToken}`);
    if (results.buffer.profileIds.length > 0) {
      envLines.push(`BUFFER_PROFILE_IDS=${results.buffer.profileIds.join(',')}`);
    }
    envLines.push('');
  }
  
  if (results.medium.accessToken) {
    envLines.push('# Medium Configuration (Direct API)');
    envLines.push(`MEDIUM_ACCESS_TOKEN=${results.medium.accessToken}`);
    envLines.push('');
  }
  
  if (envLines.length > 0) {
    const envContent = envLines.join('\n');
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
  
  return results;
})();

