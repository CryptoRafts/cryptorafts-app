# Fix Hydration Issues - Production Build

## Problem
App works in development but fails in production (VPS). Only logo shows, main content doesn't render.

## Root Cause
This is a **hydration error** - the server-rendered HTML doesn't match what the client renders.

## Common Causes & Fixes

### 1. Browser API Access (window, document, localStorage)

**Problem:**
```tsx
// ❌ WRONG - Crashes in SSR
export default function HomePage() {
  const width = window.innerWidth; // Server has no window!
  return <div>Width: {width}</div>;
}
```

**Fix:**
```tsx
// ✅ CORRECT - Use useEffect
export default function HomePage() {
  const [width, setWidth] = useState(0);
  
  useEffect(() => {
    setWidth(window.innerWidth);
  }, []);
  
  return <div>Width: {width}</div>;
}
```

### 2. Time/Random Data

**Problem:**
```tsx
// ❌ WRONG - Server and client render different values
export default function HomePage() {
  const time = new Date().toISOString();
  return <div>Time: {time}</div>;
}
```

**Fix:**
```tsx
// ✅ CORRECT - Only set after hydration
export default function HomePage() {
  const [time, setTime] = useState('');
  
  useEffect(() => {
    setTime(new Date().toISOString());
  }, []);
  
  return <div>Time: {time || 'Loading...'}</div>;
}
```

### 3. Dynamic Imports for Client-Only Components

**Problem:**
Component uses browser APIs and breaks SSR.

**Fix:**
```tsx
// ✅ Use dynamic import with ssr: false
import dynamic from 'next/dynamic';

const ClientOnlyComponent = dynamic(
  () => import('./ClientOnlyComponent'),
  { ssr: false }
);

export default function HomePage() {
  return <ClientOnlyComponent />;
}
```

### 4. Invalid HTML Nesting

**Problem:**
```tsx
// ❌ WRONG - Invalid nesting
<p>
  <div>Content</div>
</p>
```

**Fix:**
```tsx
// ✅ CORRECT - Valid nesting
<div>
  <p>Content</p>
</div>
```

## Testing Steps

### Step 1: Test Production Build Locally

```bash
# Build production
npm run build

# Start production server
npm run start

# Open http://localhost:3000
# Press F12 and check Console for errors
```

### Step 2: Check Browser Console

1. Open DevTools (F12)
2. Go to Console tab
3. Look for:
   - Red errors (hydration errors)
   - Yellow warnings (mismatch warnings)
   - React errors

### Step 3: Check Elements Tab

1. Go to Elements tab
2. Find the hero section
3. Check if:
   - HTML structure is correct
   - CSS classes are applied
   - Content is in the DOM

### Step 4: Binary Search

1. Comment out the new feature you added
2. Rebuild and test
3. If it works, the problem is in that feature
4. Uncomment sections one by one until it breaks again

## Quick Fixes for Your Code

### If using window/document:
```tsx
useEffect(() => {
  // All window/document access here
}, []);
```

### If using Date/random:
```tsx
useEffect(() => {
  // All Date/random logic here
}, []);
```

### If component needs browser APIs:
```tsx
const MyComponent = dynamic(
  () => import('./MyComponent'),
  { ssr: false }
);
```

## Diagnostic Commands

```bash
# Check for hydration errors on VPS
ssh root@72.61.98.99 'cd /var/www/cryptorafts && bash CHECK_HYDRATION_ERRORS.sh'

# Test production build locally
bash TEST_PRODUCTION_LOCALLY.sh
```

