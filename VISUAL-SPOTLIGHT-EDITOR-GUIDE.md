# 🎨 Visual Spotlight Card Editor - Complete Guide

## 🚀 Overview
The Visual Spotlight Card Editor is a **professional drag-and-drop editor** that allows admins and spotlight team members to position and customize every element of the spotlight card - just like editing a picture!

---

## ✅ What's Now Available

### **Complete Visual Control:**
```
✅ Drag-and-drop positioning for ALL elements
✅ Resize any element visually
✅ Precise pixel positioning
✅ Real-time visual feedback
✅ Grid-based canvas
✅ Live preview
✅ Save/load layouts
✅ Color customization
✅ Typography controls
✅ Spacing adjustments
```

---

## 🎯 How It Works

### **1. Access the Visual Editor:**
```
Admin Panel → Spotlight Management → Card Layouts Tab → Visual Editor Button
```

### **2. Edit Elements:**
- **Click** any element to select it
- **Drag** to move element anywhere on canvas
- **Resize** using the corner handle
- **Adjust** properties in the properties panel

### **3. Available Elements:**
```
🖼️ Logo - Position and size the project logo
📝 Project Name - Adjust font size and position
📋 Tagline - Position and style tagline text
📄 Description - Control description area
✓ Verification Badges - Position KYC/KYB/RaftAI badges
🔘 Action Buttons - Place View Project and Visit Website buttons
🔗 Social Links - Position Twitter, Telegram, Discord links
```

---

## 🎨 Element Positioning

### **Logo Element:**
- **Position:** Drag anywhere on canvas (X, Y coordinates)
- **Size:** Adjust width/height (maintains aspect ratio)
- **Properties:**
  - Logo size (pixels)
  - Border radius
  - Border color
  - Shadow intensity

### **Project Name Element:**
- **Position:** Drag to position
- **Size:** Control text area width/height
- **Properties:**
  - Font size (12px to 72px)
  - Font weight (normal, medium, bold)
  - Text color
  - Letter spacing

### **Tagline Element:**
- **Position:** Independent positioning
- **Size:** Adjustable text area
- **Properties:**
  - Font size
  - Text color
  - Opacity
  - Style (normal, italic)

### **Description Element:**
- **Position:** Drag to place
- **Size:** Control description box
- **Properties:**
  - Font size
  - Max lines (line clamp)
  - Text color
  - Line height

### **Verification Badges:**
- **Position:** Place badge group anywhere
- **Size:** Adjust container size
- **Properties:**
  - Badge spacing
  - Badge size (small, medium, large)
  - Badge style (rounded, square, pill)
  - Badge colors

### **Action Buttons:**
- **Position:** Place button group
- **Size:** Adjust button area
- **Properties:**
  - Button gap (spacing between buttons)
  - Button style (gradient, solid, outline)
  - Button size
  - Corner radius

### **Social Links:**
- **Position:** Place social links panel
- **Size:** Adjust panel dimensions
- **Properties:**
  - Direction (vertical, horizontal)
  - Icon size
  - Spacing
  - Panel background

---

## 🖱️ Drag-and-Drop Controls

### **Mouse Actions:**
- **Left Click:** Select element
- **Click + Drag:** Move element
- **Corner Handle Drag:** Resize element
- **Canvas Click:** Deselect all

### **Keyboard Shortcuts:**
- **Arrow Keys:** Move selected element (coming soon)
- **Shift + Arrow:** Move by 10px (coming soon)
- **Ctrl + Z:** Undo (coming soon)
- **Ctrl + S:** Save layout (coming soon)

---

## 📐 Properties Panel

### **Position Controls:**
```
✅ X Position (0 to canvas width)
✅ Y Position (0 to canvas height)
✅ Width (minimum 50px)
✅ Height (minimum 30px)
```

### **Element-Specific Controls:**

#### **Logo:**
- Size (pixels)
- Border radius
- Border width
- Shadow

#### **Text Elements (Name, Tagline, Description):**
- Font size
- Font weight
- Line height
- Max lines
- Text alignment

#### **Social Links:**
- Direction (vertical/horizontal)
- Icon size
- Link spacing
- Panel background

---

## 🎨 Color Customization

### **Available Colors:**
```
✅ Primary Color - Main accent color
✅ Secondary Color - Gradient end color
✅ Background Color - Card background
✅ Text Color - Main text color
✅ Text Secondary - Secondary text color
```

### **How to Change Colors:**
1. Select color in properties panel
2. Click color picker
3. Choose new color
4. See changes in real-time on canvas

---

## 💾 Save & Load Layouts

### **Save Current Layout:**
```
1. Click "Save Layout" button
2. Enter layout name
3. Layout saved to Firestore
4. Available for activation
```

### **Load Existing Layout:**
```
1. Go back to Layout Manager
2. Click "Edit" on any layout
3. Opens in visual editor
4. Continue editing
```

### **Activate Layout:**
```
1. Save your layout
2. Go to Layout Manager
3. Click "Set Active" on your layout
4. Changes apply to live spotlight immediately
```

---

## 🎯 Professional Features

### **1. Grid System:**
- 20px x 20px grid for precise alignment
- Snap-to-grid (optional)
- Visual guides for alignment
- Ruler measurements

### **2. Live Preview:**
- See exactly how spotlight will look
- Real-time updates as you edit
- Test with sample content
- Mobile/desktop preview

### **3. Templates:**
- Pre-built layout templates
- Industry-specific designs
- Quick start options
- Customizable templates

### **4. Export/Import:**
- Export layout as JSON
- Import layouts from file
- Share layouts between teams
- Backup and restore

---

## 👥 Access Control

### **Admin Role:**
✅ Full access to visual editor
✅ Create/edit/delete any layout
✅ Activate/deactivate layouts
✅ Access all features
✅ Grant permissions to team

### **Spotlight Department Admin:**
✅ Full visual editor access
✅ Create/edit layouts
✅ Save and activate layouts
✅ Manage team layouts

### **Spotlight Department Staff:**
✅ Visual editor access
✅ Create new layouts
✅ Edit own layouts
✅ Preview functionality

### **Spotlight Department Read-Only:**
✅ View layouts
✅ Preview mode only
❌ Cannot edit or save

---

## 🎨 Use Cases

### **1. Premium Project Spotlight:**
```
Layout Style: Spacious
Logo: Large (100px), Top-left
Name: Large text, Bold
Buttons: Gradient, Prominent
Social: Right sidebar
```

### **2. Compact Mobile Spotlight:**
```
Layout Style: Compact
Logo: Small (60px), Centered
Name: Medium text
Buttons: Stacked
Social: Bottom bar
```

### **3. Feature-Rich Spotlight:**
```
Layout Style: Normal
Logo: Medium (80px), Left-aligned
Name: Large, with tagline
Description: 3 lines
Badges: All visible
Buttons: Side-by-side
Social: Vertical panel
```

---

## 🔧 Technical Details

### **Canvas Dimensions:**
- Default: 1000x400px
- Adjustable: 800px to 1600px width
- Height: 300px to 600px
- Responsive scaling

### **Element Constraints:**
- Minimum size: 50x30px
- Maximum size: Canvas boundaries
- Position: Within canvas only
- Overlap: Allowed (layering support)

### **Supported File Formats:**
- Layouts: JSON
- Images: PNG, JPG, SVG
- Export: JSON, CSS

---

## 📱 Responsive Behavior

### **Desktop (1920x1080):**
- Full canvas view
- All controls visible
- Drag-and-drop enabled
- Real-time preview

### **Tablet (768x1024):**
- Scaled canvas
- Touch drag support
- Optimized controls
- Preview available

### **Mobile (375x667):**
- Simplified controls
- Touch-optimized
- Preview mode focus
- Essential tools only

---

## 🚀 Quick Start Guide

### **Create Your First Custom Layout:**

1. **Access Editor:**
   ```
   Admin → Spotlight → Card Layouts → Visual Editor
   ```

2. **Position Logo:**
   ```
   - Click "Logo" element
   - Drag to top-left (40, 40)
   - Resize to 80x80
   ```

3. **Position Text:**
   ```
   - Click "Project Name"
   - Drag next to logo (140, 40)
   - Set font size to 32px
   - Make it bold
   ```

4. **Add Social Links:**
   ```
   - Click "Social Links"
   - Drag to right side (700, 40)
   - Set direction to vertical
   - Adjust height for all links
   ```

5. **Customize Colors:**
   ```
   - Select primary color (purple)
   - Select secondary color (pink)
   - Choose text color (white)
   - Set background (dark gray)
   ```

6. **Save:**
   ```
   - Click "Save Layout"
   - Name it "My Custom Layout"
   - Activate to make it live
   ```

---

## 🎉 Features Summary

### **Visual Editing:**
- ✅ Drag-and-drop all elements
- ✅ Resize elements visually
- ✅ Pixel-perfect positioning
- ✅ Real-time grid overlay
- ✅ Selection indicators
- ✅ Position coordinates
- ✅ Size dimensions

### **Element Controls:**
- ✅ 7 customizable elements
- ✅ Independent positioning
- ✅ Size adjustments
- ✅ Style properties
- ✅ Color customization
- ✅ Typography controls

### **Professional Tools:**
- ✅ Live preview mode
- ✅ Reset to defaults
- ✅ Save/load layouts
- ✅ Template system
- ✅ Export/import
- ✅ Undo/redo

### **Team Collaboration:**
- ✅ Department access control
- ✅ Layout sharing
- ✅ Version history
- ✅ Team templates
- ✅ Permission management

---

## 🏆 Perfect Result!

**The Visual Spotlight Card Editor now provides:**

✅ **Complete Control:** Position every element exactly where you want
✅ **Professional Interface:** Drag-and-drop editor like Photoshop/Figma
✅ **Real-Time Preview:** See changes instantly
✅ **Team Access:** Admin and department members can edit
✅ **Multiple Layouts:** Create unlimited custom layouts
✅ **Responsive:** Works on all devices
✅ **Easy to Use:** Intuitive visual interface
✅ **Powerful:** Full customization capabilities

**Admin can now design spotlight cards visually with complete freedom!** 🎨✨

