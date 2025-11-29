# 🔍 **HOW TO RUN THE INSPECTOR SCRIPT IN BROWSER CONSOLE**

## **Step-by-Step Instructions:**

### **Step 1: Open Your Browser**
1. Open **Chrome**, **Firefox**, **Edge**, or any modern browser
2. Go to: **https://www.cryptorafts.com/**

### **Step 2: Open Developer Tools (F12)**
1. **Press `F12`** on your keyboard
   - OR
2. **Right-click anywhere on the page** → Click **"Inspect"** or **"Inspect Element"**
   - OR
3. **Press `Ctrl + Shift + I`** (Windows/Linux) or **`Cmd + Option + I`** (Mac)

### **Step 3: Go to Console Tab**
1. You should see a panel at the bottom or side of your browser
2. Click on the **"Console"** tab at the top of that panel
   - If you don't see tabs, look for "Console", "Elements", "Network", etc.

### **Step 4: Clear the Console (Optional)**
1. Right-click in the console area
2. Click **"Clear console"** or press `Ctrl + L` (Windows/Linux) or `Cmd + K` (Mac)

### **Step 5: Copy the Script**
1. Open the file `browser-inspector-script.js` in your code editor
2. **Select ALL** the code (Ctrl+A or Cmd+A)
3. **Copy** it (Ctrl+C or Cmd+C)

### **Step 6: Paste and Run the Script**
1. Click inside the **Console** area (where you see the `>` prompt)
2. **Paste** the script (Ctrl+V or Cmd+V)
3. **Press `Enter`** to run it

### **Step 7: You Should See This Message**
```
Cryptorafts Inspector ready — click the logo, then the purple graphic.
```

### **Step 8: Click the Elements**
1. **Click the logo** (in the header at the top)
   - You should see a message: "Captured element: ..."
   - The element will be highlighted with an orange outline
2. **Click the purple graphic** (the "Premium Spotlight" promotional card)
   - You should see another message: "Captured element: ..."
   - The element will be highlighted again

### **Step 9: Copy the Results**
1. After clicking both elements, you should see:
   ```
   Captured two elements. Listener removed. Inspect window._CR_clickedElements for results.
   To copy results, run: copy(window._CR_clickedElements)
   ```
2. In the console, type:
   ```javascript
   copy(window._CR_clickedElements)
   ```
3. Press `Enter`
4. The results are now copied to your clipboard!

### **Step 10: Paste the Results**
1. Paste the results here in this chat (Ctrl+V or Cmd+V)
2. I'll analyze them and tell you exactly what's wrong

---

## **Visual Guide:**

```
┌─────────────────────────────────────────┐
│  Browser Window                         │
│  ┌───────────────────────────────────┐  │
│  │  https://www.cryptorafts.com/     │  │
│  │  [Logo] [Navigation]              │  │
│  │                                   │  │
│  │  [Page Content]                   │  │
│  │  [Purple Graphic]                 │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │  Console | Elements | Network     │  │  ← Click "Console" tab
│  ├───────────────────────────────────┤  │
│  │  >                                 │  │  ← Paste script here
│  │  Cryptorafts Inspector ready...   │  │
│  │  Click the logo, then purple...   │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

---

## **Troubleshooting:**

### **If you don't see the Console tab:**
- Look for a menu icon (☰) or "More tools" → "Developer tools"
- Or press `Ctrl + Shift + J` (Windows/Linux) or `Cmd + Option + J` (Mac)

### **If the script doesn't run:**
- Make sure you pasted the **entire** script
- Make sure you're in the **Console** tab, not Elements or Network
- Try refreshing the page (F5) and running the script again

### **If you see errors:**
- Copy the error message and paste it here
- Make sure you're on the correct website: https://www.cryptorafts.com/

### **If you can't find the purple graphic:**
- Scroll down on the page
- Look for a section with purple/pink gradient colors
- It should say "Premium Spotlight" or "YOUR PROJECT HERE"

---

## **Quick Reference:**

| Action | Windows/Linux | Mac |
|--------|---------------|-----|
| Open DevTools | `F12` or `Ctrl + Shift + I` | `F12` or `Cmd + Option + I` |
| Clear Console | `Ctrl + L` | `Cmd + K` |
| Copy | `Ctrl + C` | `Cmd + C` |
| Paste | `Ctrl + V` | `Cmd + V` |
| Select All | `Ctrl + A` | `Cmd + A` |

---

## **What the Script Does:**

1. **Listens for clicks** on the page
2. **Captures information** about clicked elements:
   - Element position (z-index, position, display, etc.)
   - Element size and location
   - CSS styles
   - Parent elements
3. **Stores the data** in `window._CR_clickedElements`
4. **Highlights elements** with an orange outline when clicked

This helps us identify exactly which element is blocking or hiding the content!

