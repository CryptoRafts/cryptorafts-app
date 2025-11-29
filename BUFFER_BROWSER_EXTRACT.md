# 🌐 Extract Buffer Credentials from Browser

## 🚀 Fastest Method - Browser Console

Since you have Buffer open in the browser, here's how to extract everything:

---

## 📋 Method 1: Browser Console Script

1. **In Buffer dashboard**, open browser console:
   - Press `F12` (or `Ctrl+Shift+I` / `Cmd+Option+I`)
   - Click **"Console"** tab

2. **Copy and paste this script:**

```javascript
(async function() {
  console.log('🔍 Extracting Buffer Credentials...');
  
  const credentials = { accessToken: null, profileIds: [] };
  
  // Check localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const value = localStorage.getItem(key);
    if (value && (key.includes('token') || key.includes('access')) && value.length > 30) {
      credentials.accessToken = value;
      console.log('✅ Found token:', key);
      break;
    }
  }
  
  // If token found, get profiles
  if (credentials.accessToken) {
    try {
      const res = await fetch('https://api.bufferapp.com/1/profiles.json?access_token=' + credentials.accessToken);
      const profiles = await res.json();
      credentials.profileIds = profiles.filter(p => !p.disabled).map(p => p.id);
      console.log('✅ Found', credentials.profileIds.length, 'profiles');
    } catch (e) {
      console.log('⚠️  Could not fetch profiles');
    }
  }
  
  // Output
  if (credentials.accessToken) {
    const envContent = `BUFFER_ACCESS_TOKEN=${credentials.accessToken}\nBUFFER_PROFILE_IDS=${credentials.profileIds.join(',')}`;
    console.log('\n📝 .env.local content:');
    console.log(envContent);
    
    try {
      await navigator.clipboard.writeText(envContent);
      console.log('\n✅ Copied to clipboard!');
    } catch (e) {}
  } else {
    console.log('\n❌ Token not found in browser storage');
    console.log('   Get it from: https://buffer.com/developers/apps/create');
  }
  
  return credentials;
})();
```

3. **Press Enter** - It will extract and copy credentials!

---

## 📋 Method 2: Automated Setup Script

**Run this in terminal:**

```bash
npm run complete:buffer
```

The script will:
- ✅ Ask for Buffer access token
- ✅ Automatically fetch profile IDs from API
- ✅ Ask for Medium token
- ✅ Update `.env.local` automatically
- ✅ Show you next steps

---

## 📋 Method 3: Manual Extraction

1. **Get Buffer Access Token:**
   - Go to: https://buffer.com/developers/apps/create
   - Create app → Generate token

2. **Get Profile IDs:**
   ```bash
   npm run get-buffer-profiles
   ```
   Paste your token → It shows all profile IDs!

3. **Get Medium Token:**
   - Go to: https://medium.com/me/applications
   - Get integration token

4. **Add to .env.local:**
   ```env
   BUFFER_ACCESS_TOKEN=your_token
   BUFFER_PROFILE_IDS=x_id,linkedin_id
   MEDIUM_ACCESS_TOKEN=your_medium_token
   ```

---

## ✅ Quickest Path

1. **Run:** `npm run complete:buffer`
2. **Paste tokens** when prompted
3. **Done!** ✅

---

**The automated script handles everything!** 🚀

