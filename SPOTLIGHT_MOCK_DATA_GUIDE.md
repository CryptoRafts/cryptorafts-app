# 🎯 SPOTLIGHT MOCK DATA - TESTING GUIDE

## ✅ COMPLETE TEST DATA SETUP!

I've created **mock/test data** for your Spotlight department so you can test all features!

---

## 🚀 Quick Start - Add Test Data

### **Method 1: Using HTML File (EASIEST!)**

**Step 1: Open the HTML file**
```
File: add-spotlight-test-data.html
Location: Root of your project
Action: Double-click to open in browser
```

**Step 2: Click the button**
```
Button: "Add 5 Mock Team Members to Spotlight"
Click it!
```

**Step 3: Wait for success**
```
See: ✅ SUCCESS message
Shows: 5 members added
Stats: 1 Admin, 2 Staff, 1 Read-only, 1 Suspended
```

**Step 4: Verify**
```
Go to: /admin/departments/spotlight
See: 5 team members in the list!
Test: All features working!
```

---

### **Method 2: Using Node Script**

**Step 1: Run the script**
```bash
node scripts/add-spotlight-mock-data.js
```

**Step 2: See output**
```
🚀 Adding mock data to Spotlight department...

➕ Adding spotlight-lead@cryptoraft.com as Dept Admin...
   ✅ Added successfully
➕ Adding search-specialist@cryptoraft.com as Staff...
   ✅ Added successfully
... (continues for all 5 members)

🎉 SUCCESS! Added 5 mock team members!
```

**Step 3: Test**
```
Go to: /admin/departments/spotlight
```

---

## 👥 Mock Team Members

### **Team Composition:**

**1. Dept Admin:**
```
Email: spotlight-lead@cryptoraft.com
Role: Dept Admin
Status: Active
Added: Jan 15, 2024
Searches: 1,247
Last Active: Oct 16, 2024 8:30 AM

Permissions:
✓ Full spotlight access
✓ Add team members
✓ Remove team members
✓ Configure search
✓ View all analytics
```

**2. Staff Member #1:**
```
Email: search-specialist@cryptoraft.com
Role: Staff
Status: Active
Added: Jan 20, 2024
Searches: 892
Last Active: Oct 16, 2024 7:15 AM

Permissions:
✓ Use spotlight search
✓ View search results
✓ Access search history
✓ Basic analytics
```

**3. Staff Member #2:**
```
Email: data-analyst@cryptoraft.com
Role: Staff
Status: Active
Added: Feb 1, 2024
Searches: 654
Last Active: Oct 15, 2024 4:45 PM

Permissions:
✓ Use spotlight search
✓ View search results
✓ Access search history
✓ Basic analytics
```

**4. Read-only Member:**
```
Email: search-intern@cryptoraft.com
Role: Read-only
Status: Active
Added: Feb 15, 2024
Searches: 234
Last Active: Oct 16, 2024 6:00 AM

Permissions:
✓ View spotlight only
✓ Read search results
○ No modifications
```

**5. Suspended Member:**
```
Email: former-member@cryptoraft.com
Role: Staff
Status: Suspended
Added: Jan 25, 2024
Searches: 445
Last Active: Sep 30, 2024

Permissions:
❌ Access revoked (suspended)
```

---

## 📊 Mock Stats

After adding mock data, you'll see:

```
📊 Total Searches: 3,472
👥 Active Members: 4
🛡️ Total Team: 5
⏰ Searches Today: 127
```

---

## 🧪 What You Can Test

### **1. View Team List:**
```
✅ See 5 members
✅ Each with different roles
✅ Color-coded badges
✅ Status indicators
✅ Search counts shown
✅ Added dates visible
```

### **2. Test Add Member:**
```
✅ Click "Add Team Member"
✅ Enter new email
✅ Select role
✅ See permission preview
✅ Add successfully
✅ List updates
```

### **3. Test Remove Member:**
```
✅ Click trash icon 🗑️
✅ Confirm removal
✅ Member disappears
✅ Stats update
```

### **4. Test Suspend/Reactivate:**
```
✅ Click warning icon ⚠️
✅ Member becomes suspended
✅ Click check icon ✓
✅ Member reactivated
```

### **5. Test Role Badges:**
```
✅ Purple badge = Dept Admin
✅ Cyan badge = Staff
✅ Gray badge = Read-only
✅ Red badge = Suspended
```

### **6. Test Permissions Display:**
```
✅ Each member shows their permissions
✅ Green chips for each permission
✅ Different permissions per role
```

---

## 📸 What You'll See

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 🔍 Spotlight Search Department ✨                      ┃
┃                                    [Add Team Member]   ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                                        ┃
┃ 📊 3,472     👥 4         🛡️ 5        ⏰ 127          ┃
┃ Total       Active      Total       Today             ┃
┃ Searches    Members     Team        Searches          ┃
┃                                                        ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ 👥 Spotlight Team Members (5)                         ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                                        ┃
┃ S  spotlight-lead@cryptoraft.com  [DEPT ADMIN] [⚠️][🗑️]┃
┃    Added Jan 15, 2024 • By admin • 1,247 searches    ┃
┃    ✓ Full Access  ✓ Add Members  ✓ Configure         ┃
┃                                                        ┃
┃ S  search-specialist@cryptoraft.com [STAFF]  [⚠️][🗑️]┃
┃    Added Jan 20, 2024 • By lead • 892 searches       ┃
┃    ✓ Use Search  ✓ View Results  ✓ History           ┃
┃                                                        ┃
┃ D  data-analyst@cryptoraft.com     [STAFF]  [⚠️][🗑️]┃
┃    Added Feb 1, 2024 • By lead • 654 searches        ┃
┃    ✓ Use Search  ✓ View Results  ✓ History           ┃
┃                                                        ┃
┃ S  search-intern@cryptoraft.com  [READ-ONLY] [⚠️][🗑️]┃
┃    Added Feb 15, 2024 • By lead • 234 searches       ┃
┃    ✓ View Only  ✓ Read Results                        ┃
┃                                                        ┃
┃ F  former-member@cryptoraft.com [STAFF][SUSPENDED][✓][🗑️]┃
┃    Added Jan 25, 2024 • By lead • 445 searches       ┃
┃    ✓ Use Search  ✓ View Results (Access Revoked)     ┃
┃                                                        ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

---

## 🎯 Step-by-Step Testing

### **Complete Test Flow:**

**1. Add Mock Data:**
```
Open: add-spotlight-test-data.html
Click: "Add 5 Mock Team Members"
Wait: 2-3 seconds
See: ✅ SUCCESS message
```

**2. View Department:**
```
Navigate to: /admin/departments/spotlight
See: 5 members in list
Verify: Stats show correct numbers
Check: Each member has role badge
```

**3. Test Remove:**
```
Find: former-member@cryptoraft.com
Click: 🗑️ trash icon
Confirm: "Remove from team?"
Result: Member removed, list shows 4
```

**4. Test Suspend:**
```
Find: Any active member
Click: ⚠️ warning icon
Confirm: "Suspend member?"
Result: Badge changes to SUSPENDED
```

**5. Test Reactivate:**
```
Find: Suspended member
Click: ✓ check icon (green)
Confirm: "Reactivate member?"
Result: Badge back to ACTIVE
```

**6. Test Add New:**
```
Click: "Add Team Member"
Enter: your-test@gmail.com
Select: "Staff"
Click: "Add to Spotlight"
Result: New member appears in list!
```

---

## 💡 Tips

### **Testing Different Scenarios:**

**Scenario 1: Full Team**
```
Add all 5 mock members → See populated list
```

**Scenario 2: Empty Team**
```
Remove all members → See "No team members yet"
```

**Scenario 3: Mixed Status**
```
Some active, some suspended → See different badges
```

**Scenario 4: Different Roles**
```
See purple (Dept Admin), cyan (Staff), gray (Read-only)
```

---

## 🔧 Troubleshooting

### **If Members Don't Show:**

**1. Check Console (F12):**
```
Should see:
📂 Loading Spotlight team members...
✅ Loaded 5 Spotlight team members

If see "Loaded 0" → Data not added yet
```

**2. Check Firebase:**
```
Go to: Firebase Console
Open: Firestore Database
Collection: department_members
Filter: where department == 'Spotlight'
Should see: 5 documents
```

**3. Re-run HTML File:**
```
Open: add-spotlight-test-data.html
Click: Button again
Wait: For success
```

**4. Hard Refresh:**
```
Press: Ctrl + Shift + R
Clears: Cache
Reloads: Fresh data
```

---

## ✅ Complete Testing Checklist

**Data Addition:**
- [ ] Open add-spotlight-test-data.html
- [ ] Click "Add 5 Mock Team Members"
- [ ] See success message
- [ ] Console shows "✅ Added"

**Department Page:**
- [ ] Go to /admin/departments/spotlight
- [ ] See 5 members in list
- [ ] Stats show: 3,472 searches, 4 active, 5 total
- [ ] Each member has role badge
- [ ] Each member has status
- [ ] Permissions shown below each

**Add Feature:**
- [ ] Click "Add Team Member"
- [ ] Modal opens
- [ ] Email input auto-focused
- [ ] Role dropdown works
- [ ] Permission preview updates
- [ ] Can add new member

**Remove Feature:**
- [ ] Click trash icon
- [ ] Confirmation appears
- [ ] Member removed
- [ ] List updates
- [ ] Stats update

**Suspend Feature:**
- [ ] Click warning icon
- [ ] Member suspended
- [ ] Badge changes
- [ ] Can reactivate

---

## 📝 Summary

**Files Created:**
```
✅ add-spotlight-test-data.html
   - Browser-based data addition
   - Click one button to add all
   - Visual feedback
   - Error handling

✅ scripts/add-spotlight-mock-data.js
   - Node.js script version
   - Server-side addition
   - Console output
   - Batch processing

✅ src/app/admin/departments/spotlight/test-data.ts
   - TypeScript mock data
   - Reusable constants
   - Type-safe
```

**Features:**
```
✅ 5 mock team members
✅ Different roles (Admin, Staff, Read-only)
✅ Different statuses (Active, Suspended)
✅ Realistic search counts
✅ Proper timestamps
✅ Complete metadata
```

**What You Can Test:**
```
✅ View team list
✅ Add new members
✅ Remove members
✅ Suspend/reactivate
✅ Role badges
✅ Permission display
✅ Stats cards
✅ All features working!
```

---

**Last Updated:** October 16, 2024

🏆 **SPOTLIGHT MOCK DATA READY!** 🏆

**How to use:**
1. **Open:** `add-spotlight-test-data.html` in browser
2. **Click:** "Add 5 Mock Team Members"
3. **Wait:** 2-3 seconds
4. **See:** ✅ SUCCESS!
5. **Go to:** `/admin/departments/spotlight`
6. **Test:** All features with real data!

**Perfect for testing!** 🚀


