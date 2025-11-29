# 🔍 **ALTERNATIVE METHODS TO RUN INSPECTOR SCRIPT**

## **Method 1: Use Sources Tab (Easiest - No Pasting Required!)**

### **Step 1: Open DevTools**
1. Go to https://www.cryptorafts.com/
2. Press **F12**

### **Step 2: Go to Sources Tab**
1. Click the **"Sources"** tab (or "Snippets" in some browsers)
2. If you see "Snippets" in the left sidebar, click it
3. If not, look for a **"+"** button or **"New snippet"** button

### **Step 3: Create New Snippet**
1. Click **"New snippet"** or the **"+"** button
2. Name it: `inspector`
3. Paste the script in the editor
4. Press **Ctrl+S** (or Cmd+S on Mac) to save

### **Step 4: Run the Snippet**
1. Right-click on the snippet name
2. Click **"Run"** or press **Ctrl+Enter** (or Cmd+Enter on Mac)

### **Step 5: Click Elements**
1. Click the logo
2. Click the purple graphic
3. Go back to Console tab
4. Type: `copy(window._CR_clickedElements)`
5. Press Enter

---

## **Method 2: Type "allow pasting" Correctly**

Make sure you:
1. Type exactly: `allow pasting` (lowercase, with a space)
2. Press Enter
3. Wait for the message to disappear
4. Then try pasting again

If it still doesn't work, try:
- `allow pasting` (with quotes)
- Or just type: `allow` then press Enter, then type `pasting` and press Enter

---

## **Method 3: Use Bookmarklet (No Console Needed!)**

### **Step 1: Create Bookmark**
1. Right-click your bookmarks bar
2. Click **"Add page"** or **"New bookmark"**
3. Name it: `Cryptorafts Inspector`
4. In the URL field, paste this (all on one line):

```javascript
javascript:(()=>{if(!window._CR_clickedElements)window._CR_clickedElements=[];console.log("%cCryptorafts Inspector ready — click the logo, then the purple graphic.","color:teal;font-weight:bold");const describe=el=>{if(!el)return null;const cs=getComputedStyle(el);const bbox=el.getBoundingClientRect();const selector=(()=>{if(el.id)return `#${el.id}`;if(el.className&&typeof el.className==="string")return `${el.tagName.toLowerCase()}.${el.className.trim().split(/\s+/).join('.')}`;return el.tagName.toLowerCase();})();return{timestamp:new Date().toString(),selector,tag:el.tagName.toLowerCase(),id:el.id||null,classes:el.className?el.className.trim().split(/\s+/):[],outerHTML:el.outerHTML.slice(0,1000),boundingClientRect:{top:Math.round(bbox.top),left:Math.round(bbox.left),width:Math.round(bbox.width),height:Math.round(bbox.height),bottom:Math.round(bbox.bottom),right:Math.round(bbox.right)},computed:{display:cs.display,position:cs.position,visibility:cs.visibility,zIndex:cs.zIndex,pointerEvents:cs.pointerEvents,opacity:cs.opacity,width:cs.width,height:cs.height,overflow:cs.overflow},nearestPositionedAncestor:(()=>{let cur=el.parentElement;while(cur){const p=getComputedStyle(cur).position;if(p&&p!=="static")return{tag:cur.tagName.toLowerCase(),id:cur.id||null,classes:cur.className||null,position:p};cur=cur.parentElement;}return null;})()};}function clickHandler(e){e.preventDefault();e.stopPropagation();const el=e.target;const rep=describe(el);window._CR_clickedElements.push(rep);console.groupCollapsed(`%cCaptured element: ${rep.selector}`,"color:purple;font-weight:bold");console.log("Tag:",rep.tag,"ID:",rep.id,"Classes:",rep.classes);console.log("Bounding rect:",rep.boundingClientRect);console.log("Computed styles:",rep.computed);console.log("Nearest positioned ancestor:",rep.nearestPositionedAncestor);console.log("OuterHTML (truncated):",rep.outerHTML);console.groupEnd();const oldOutline=el.style.outline;el.style.outline="3px solid rgba(255,165,0,0.9)";setTimeout(()=>el.style.outline=oldOutline,2000);if(window._CR_clickedElements.length>=2){console.log("%cCaptured two elements. Listener removed. Inspect window._CR_clickedElements for results.","color:green;font-weight:bold");console.log("%cTo copy results, run: copy(window._CR_clickedElements)","color:cyan;font-weight:bold");window.removeEventListener("click",clickHandler,true);}else{console.log("%cClick the second element now (purple graphic).","color:orange;font-weight:bold");}}window.addEventListener("click",clickHandler,true);setTimeout(()=>{if(window._CR_clickedElements.length<2){window.removeEventListener("click",clickHandler,true);console.log("%cInspector timed out after 30s. Rerun the snippet to try again.","color:gray");}},30000);})();
```

5. Click **"Save"**

### **Step 2: Use the Bookmarklet**
1. Go to https://www.cryptorafts.com/
2. Press **F12** to open Console
3. Click the bookmark you just created
4. Click the logo, then the purple graphic
5. In console, type: `copy(window._CR_clickedElements)`
6. Press Enter

---

## **Method 4: Manual Inspection (No Script Needed!)**

### **Step 1: Inspect the Logo**
1. Go to https://www.cryptorafts.com/
2. Press **F12**
3. Click the **"Elements"** tab (not Console)
4. Click the **"Select element"** icon (cursor icon) in the top-left of DevTools
5. Click the **logo** on the page
6. In the Elements panel, you'll see the logo element selected
7. In the **"Styles"** panel (right side), look for:
   - `z-index`
   - `position`
   - `display`
   - `visibility`
   - `opacity`
8. Write down these values

### **Step 2: Inspect the Purple Graphic**
1. Click the **"Select element"** icon again
2. Click the **purple graphic** (scroll down to find it)
3. In the Elements panel, you'll see the purple graphic element selected
4. In the **"Styles"** panel, look for the same properties
5. Write down these values

### **Step 3: Tell Me the Values**
Paste the values you found here, and I'll tell you what's wrong!

---

## **Method 5: Use Network Tab to Check**

1. Press **F12**
2. Go to **"Network"** tab
3. Refresh the page (F5)
4. Look for any **red** entries (errors)
5. Check if JavaScript files are loading (filter by "JS")
6. Tell me if you see any errors

---

## **RECOMMENDED: Method 1 (Sources/Snippets Tab)**

This is the easiest method and doesn't require pasting in the console!

1. **F12** → **Sources** tab
2. Click **"Snippets"** (or look for **"+"** button)
3. Click **"New snippet"**
4. Paste the script
5. **Ctrl+S** to save
6. Right-click snippet → **"Run"**
7. Click logo, then purple graphic
8. Console → Type: `copy(window._CR_clickedElements)`

Try Method 1 first - it's the easiest!

