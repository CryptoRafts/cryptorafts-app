# Check Hero Section Visibility

## Run this in Browser Console (F12 → Console):

```javascript
// Check hero section visibility
const hero = document.querySelector('section[aria-label*="Hero section"]');
if (hero) {
    const styles = window.getComputedStyle(hero);
    const rect = hero.getBoundingClientRect();
    console.log('Hero Section:', {
        found: true,
        display: styles.display,
        visibility: styles.visibility,
        opacity: styles.opacity,
        zIndex: styles.zIndex,
        position: styles.position,
        width: rect.width,
        height: rect.height,
        top: rect.top,
        left: rect.left,
        visible: rect.width > 0 && rect.height > 0 && styles.display !== 'none' && styles.visibility !== 'hidden' && styles.opacity !== '0'
    });
} else {
    console.log('Hero Section: NOT FOUND');
}

// Check hero content
const content = document.querySelector('.hero-content');
if (content) {
    const styles = window.getComputedStyle(content);
    const rect = content.getBoundingClientRect();
    console.log('Hero Content:', {
        found: true,
        display: styles.display,
        visibility: styles.visibility,
        opacity: styles.opacity,
        zIndex: styles.zIndex,
        width: rect.width,
        height: rect.height,
        top: rect.top,
        left: rect.left,
        visible: rect.width > 0 && rect.height > 0 && styles.display !== 'none' && styles.visibility !== 'hidden' && styles.opacity !== '0'
    });
} else {
    console.log('Hero Content: NOT FOUND');
}

// Check hero text
const heroText = document.querySelector('section[aria-label*="Hero section"] h1');
if (heroText) {
    const styles = window.getComputedStyle(heroText);
    const rect = heroText.getBoundingClientRect();
    console.log('Hero Text:', {
        found: true,
        text: heroText.textContent.trim().substring(0, 50),
        display: styles.display,
        visibility: styles.visibility,
        opacity: styles.opacity,
        color: styles.color,
        width: rect.width,
        height: rect.height,
        visible: rect.width > 0 && rect.height > 0
    });
} else {
    console.log('Hero Text: NOT FOUND');
}

// Check if content is behind something
const allSections = document.querySelectorAll('section');
console.log('All sections:', Array.from(allSections).map(s => ({
    ariaLabel: s.getAttribute('aria-label'),
    zIndex: window.getComputedStyle(s).zIndex,
    position: window.getComputedStyle(s).position,
    display: window.getComputedStyle(s).display
})));
```

## What to Look For:

1. **Hero Section `visible: false`** → Content is hidden by CSS
2. **Hero Text `visible: false`** → Text is not visible
3. **`zIndex` too low** → Content is behind other elements
4. **`opacity: 0`** → Content is transparent
5. **`display: none`** → Content is not displayed

## Quick Fix Test:

If hero section is found but not visible, run this:

```javascript
// Force hero section visible
const hero = document.querySelector('section[aria-label*="Hero section"]');
if (hero) {
    hero.style.cssText = 'display: flex !important; visibility: visible !important; opacity: 1 !important; z-index: 200 !important; position: relative !important;';
    console.log('✅ Hero section forced visible');
}

const content = document.querySelector('.hero-content');
if (content) {
    content.style.cssText = 'display: flex !important; visibility: visible !important; opacity: 1 !important; z-index: 300 !important;';
    console.log('✅ Hero content forced visible');
}
```

