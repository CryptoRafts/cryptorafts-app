# 🔧 Environment Setup Instructions

## ⚡ **CRITICAL: Create .env.local File**

The RaftAI API key and other sensitive configurations must be stored in `.env.local` file in the project root.

### **Step 1: Create .env.local**

Create a new file named `.env.local` in the root directory (`C:\Users\dell\cryptorafts-starter\.env.local`)

### **Step 2: Add Configuration**

Copy and paste this content into `.env.local`:

```env
# ============================================
# RAFTAI CONFIGURATION (REQUIRED)
# ============================================
RAFT_AI_API_KEY=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
RAFT_AI_BASE_URL=https://api.raftai.com/v1

# ============================================
# SUPER ADMIN CONFIGURATION
# ============================================
SUPER_ADMIN_EMAIL=anasshamsiggc@gmail.com

# ============================================
# NEXT.JS CONFIGURATION
# ============================================
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ============================================
# SECURITY (Optional but Recommended)
# ============================================
NEXTAUTH_SECRET=your-random-secret-here-change-this-in-production
NEXTAUTH_URL=http://localhost:3000
```

### **Step 3: Save and Restart**

1. **Save** the `.env.local` file
2. **Restart** the development server:

```bash
# Windows PowerShell
taskkill /F /IM node.exe
npm run dev
```

### **Step 4: Verify Configuration**

1. Go to: `http://localhost:3000/admin/settings`
2. Check "RaftAI Integration Status"
3. Should show: ✅ **RaftAI is configured and operational**

---

## 📋 **Configuration Options Explained**

### **RAFT_AI_API_KEY**
- Your OpenAI/RaftAI API key
- **REQUIRED** for all AI features
- Used for: KYC analysis, KYB verification, pitch scoring, payment extraction, chat summaries
- Security: Never committed to git, never logged

### **RAFT_AI_BASE_URL**
- API endpoint for RaftAI service
- Default: `https://api.raftai.com/v1`
- Can be changed if using custom endpoint

### **SUPER_ADMIN_EMAIL**
- Email address with full platform access
- Default: `anasshamsiggc@gmail.com`
- This user can:
  - Access all departments
  - Create/manage departments
  - Add/remove team members
  - View all audit logs
  - No restrictions

### **NEXT_PUBLIC_APP_URL**
- Your application URL
- Development: `http://localhost:3000`
- Production: `https://yourdomain.com`

---

## 🔒 **Security Best Practices**

### **DO:**
✅ Keep `.env.local` in `.gitignore`  
✅ Use strong, random API keys  
✅ Rotate keys periodically  
✅ Use different keys for dev/staging/production  
✅ Store production keys in secure vault  

### **DON'T:**
❌ Commit `.env.local` to git  
❌ Share API keys in chat/email  
❌ Log API keys to console  
❌ Use same key across environments  
❌ Hardcode keys in source code  

---

## 🧪 **Testing Configuration**

### **Test 1: Check File Exists**
```bash
ls .env.local
```
Should show the file if it exists.

### **Test 2: Check RaftAI Status**
1. Open: `http://localhost:3000/admin/settings`
2. Look for "RaftAI Integration Status"
3. Should show green checkmark if configured

### **Test 3: Test AI Analysis**
1. Go to: `http://localhost:3000/admin/users`
2. Click on any user
3. AI analysis should generate instantly
4. If API key not configured, will show warning

---

## 🐛 **Troubleshooting**

### **Problem: "RaftAI API key not configured"**

**Solution:**
1. Check `.env.local` exists in root directory
2. Check `RAFT_AI_API_KEY` is set correctly
3. Restart development server (`taskkill /F /IM node.exe; npm run dev`)
4. Clear browser cache and reload

### **Problem: "Cannot find .env.local"**

**Solution:**
1. Create file in root directory (same level as `package.json`)
2. Name must be exactly `.env.local` (note the dot at start)
3. On Windows, create in File Explorer or use: `New-Item .env.local -ItemType File`

### **Problem: "API key invalid"**

**Solution:**
1. Check API key is complete (no spaces, line breaks)
2. Verify API key starts with `sk-`
3. Check API key hasn't expired
4. Try generating new API key from OpenAI dashboard

### **Problem: "Changes not taking effect"**

**Solution:**
1. Always restart server after changing `.env.local`
2. Use: `taskkill /F /IM node.exe; npm run dev`
3. Clear Next.js cache: `rm -rf .next` (or delete `.next` folder)
4. Restart again: `npm run dev`

---

## 📂 **File Location**

```
cryptorafts-starter/
├── .env.local          ← CREATE THIS FILE HERE
├── .gitignore          ← Should include .env.local
├── package.json
├── next.config.js
├── src/
│   ├── app/
│   ├── components/
│   └── lib/
└── ...
```

---

## ✅ **Verification Checklist**

Before proceeding, verify:

- [ ] `.env.local` file created in root directory
- [ ] `RAFT_AI_API_KEY` added with valid key
- [ ] `SUPER_ADMIN_EMAIL` set to `anasshamsiggc@gmail.com`
- [ ] Development server restarted
- [ ] Admin settings shows "✅ RaftAI is configured"
- [ ] No console errors about missing API key
- [ ] AI analysis works in admin/users page

---

## 🎯 **Next Steps**

Once `.env.local` is configured:

1. ✅ Test Super Admin access (anasshamsiggc@gmail.com)
2. ✅ Create departments
3. ✅ Add team members to departments
4. ✅ Test department login
5. ✅ Test AI features (KYC, Finance, etc.)
6. ✅ Review audit logs

---

**Need Help?**

- Check documentation: `ADMIN_PERFECT_SETUP.md`
- Check logs: Look for 🤖 RaftAI Config in terminal
- Test endpoint: `http://localhost:3000/admin/settings`

---

**Version:** 1.0.0  
**Last Updated:** October 11, 2025  
**Status:** ✅ Ready for Configuration

