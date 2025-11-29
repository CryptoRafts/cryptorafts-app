# 🔐 Complete Firebase Rules for ALL Roles

## 🎯 **Roles Supported:**
- **Admin** - Full access to everything
- **VC** - Venture Capital access with organization-based permissions
- **Founder** - Project and pitch management
- **Exchange** - Token listing and trading features
- **Agency** - Marketing and campaign management

## 📋 **Deployment Instructions:**

### **Step 1: Deploy Firestore Rules**

1. **Go to:** https://console.firebase.google.com/project/cryptorafts-b9067/firestore/rules

2. **Delete ALL existing rules**

3. **Copy and paste the complete rules from `firestore.rules.complete-all-roles`**

4. **Click "Publish"**

### **Step 2: Deploy Storage Rules**

1. **Go to:** https://console.firebase.google.com/project/cryptorafts-b9067/storage/rules

2. **Delete ALL existing rules**

3. **Copy and paste the complete rules from `storage.rules.complete-all-roles`**

4. **Click "Publish"**

## 🔐 **Role-Based Access Control:**

### **Admin Role:**
- ✅ Full access to all collections
- ✅ Can read/write any document
- ✅ Can manage all users and organizations
- ✅ Can access audit logs and system data

### **VC Role:**
- ✅ Access to projects and dealflow
- ✅ Can manage their organization's pipeline
- ✅ Can create and manage deal rooms
- ✅ Can access VC-specific collections (metrics, term sheets, AI sessions)
- ✅ Can read founder projects and pitches
- ✅ Can manage their organization's data

### **Founder Role:**
- ✅ Can create and manage their own projects
- ✅ Can upload pitch decks and whitepapers
- ✅ Can manage their own profile and organization
- ✅ Can participate in deal rooms
- ✅ Can access their own dashboard data

### **Exchange Role:**
- ✅ Can create and manage token listings
- ✅ Can upload exchange-specific files
- ✅ Can access exchange dashboard data
- ✅ Can manage their own organization

### **Agency Role:**
- ✅ Can create and manage marketing campaigns
- ✅ Can upload campaign files
- ✅ Can access agency dashboard data
- ✅ Can manage their own organization

## 📁 **Collection Access:**

### **Users Collection:**
- **Read:** All authenticated users
- **Write:** Users can write their own data, admins can write any

### **Organizations Collection:**
- **Read:** All authenticated users
- **Write:** Role-based access (VCs can write to their org, founders to theirs, etc.)

### **Projects Collection:**
- **Read:** All authenticated users
- **Write:** Founders can write to their own projects, VCs can write to projects in their pipeline

### **VC Pipeline Collection:**
- **Access:** VCs only (with organization membership check)
- **Write:** VCs can manage their organization's pipeline

### **Group Chats (Deal Rooms):**
- **Access:** Room members only
- **Create:** VCs, Founders, Exchanges, Agencies can create rooms

### **Storage Access:**

#### **Organization Logos:**
- **Read:** Public (anyone can view logos)
- **Write:** All authenticated users

#### **Project Files:**
- **Read:** VCs, Founders (project owners), Exchanges, Agencies
- **Write:** Founders (project owners), VCs (organization members)

#### **Pitch Decks & Whitepapers:**
- **Read:** VCs, Founders (project owners), Exchanges, Agencies
- **Write:** Founders (project owners) only

#### **Legal Documents:**
- **Read:** VCs (organization members), Founders (project owners)
- **Write:** Founders (project owners) only

#### **KYB/KYC Documents:**
- **Read/Write:** Users can only access their own documents

## 🛡️ **Security Features:**

### **Helper Functions:**
- `isAuthenticated()` - Checks if user is logged in
- `isAdmin()` - Checks if user has admin role
- `isVC()` - Checks if user has VC role
- `isFounder()` - Checks if user has founder role
- `isExchange()` - Checks if user has exchange role
- `isAgency()` - Checks if user has agency role
- `isOwner()` - Checks if user owns the resource
- `isVCOrgMember()` - Checks VC organization membership
- `isProjectOwner()` - Checks if founder owns the project
- `isRoomMember()` - Checks if user is member of chat room

### **Data Isolation:**
- VCs can only access their organization's data
- Founders can only manage their own projects
- Exchanges can only manage their own listings
- Agencies can only manage their own campaigns
- Users can only access their own personal data

### **Cross-Role Access:**
- VCs can read founder projects (for dealflow)
- All roles can participate in deal rooms
- Public data (like logos) is accessible to all
- Audit logs are role-specific

## ⚡ **After Deployment:**

1. **All permission errors will be resolved**
2. **Each role will have appropriate access**
3. **Data isolation will be enforced**
4. **Cross-role collaboration will work**
5. **Security will be maintained**

## 🚨 **Important Notes:**

- These rules provide **secure, role-based access control**
- **Admins have full access** for system management
- **Each role is isolated** to their own data
- **Cross-role features** (like deal rooms) work properly
- **Public data** (logos, public assets) is accessible to all

**Deploy these rules to have a complete, secure, multi-role Firebase setup!**
