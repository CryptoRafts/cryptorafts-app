# 🔒 VC ROLE SECURITY - LOCKED & HARD CODED

## Overview

The VC (Venture Capital) role functionality is **LOCKED** and **HARD CODED** with strict access controls to ensure:

- ✅ **Data Isolation**: VC users only see VC-specific data
- ✅ **Role Verification**: Automatic authentication and role validation
- ✅ **Unauthorized Access Prevention**: Automatic redirects for non-VC users
- ✅ **Immutable Configuration**: Core VC functionality cannot be modified

## 🔐 Security Architecture

### 1. Role Configuration (`src/config/vc-role-lock.ts`)

**LOCKED** configuration file defining:
- VC role identifier: `'vc'`
- VC permissions (view dashboard, accept pitches, etc.)
- Protected routes (`/vc/*`)
- Data isolation filters
- Firestore constraints

```typescript
// 🔒 LOCKED - Cannot be modified
export const VC_CONFIG = Object.freeze({
  ROLE_ID: 'vc',
  PERMISSIONS: { ... },
  PROTECTED_ROUTES: [ ... ],
  DATA_ISOLATION: true,
  STRICT_ACCESS: true,
});
```

### 2. Role Guard Hook (`src/hooks/useVCRoleGuard.ts`)

**LOCKED** React hook providing:
- Real-time role verification
- Automatic authentication checks
- Permission validation
- Unauthorized access handling

```typescript
// Usage in VC pages
const vcGuard = useVCRoleGuard({ 
  requireKYB: true, 
  redirectOnFail: true 
});
```

### 3. Role Guard Wrapper (`src/components/VCRoleGuardWrapper.tsx`)

**LOCKED** React component for wrapping VC pages:
- Enforces VC-only access
- Shows loading states
- Handles errors gracefully
- Provides security feedback

```typescript
// Wrap any VC page
<VCRoleGuardWrapper>
  <YourVCPageContent />
</VCRoleGuardWrapper>
```

### 4. Route Protection Middleware (`src/middleware/vc-route-guard.ts`)

**LOCKED** Next.js middleware protecting `/vc/*` routes:
- Intercepts all VC route requests
- Validates authentication
- Verifies VC role
- Adds security headers

## 🛡️ Access Control Flow

```
User Request → /vc/dashboard
     ↓
[Middleware] Check authentication
     ↓
[Middleware] Verify VC role
     ↓
[Page Guard] Secondary role verification
     ↓
[Component] Render VC content
```

### If Not Authenticated:
```
→ Redirect to /login
→ Store original URL for return
→ Show authentication required message
```

### If Not VC Role:
```
→ Redirect to /role
→ Show role selection page
→ Log unauthorized access attempt
```

### If VC Role Verified:
```
→ Grant access
→ Load VC-specific data
→ Apply data isolation filters
→ Enable VC permissions
```

## 🔒 Data Isolation

### VC Data Filtering

All Firestore queries automatically filtered by VC user ID:

```typescript
// Projects query
query(
  collection(db, 'projects'),
  where('targetRoles', 'array-contains', 'vc'),
  where('vcId', '==', user.uid)  // 🔒 Isolated by VC user
);

// Portfolio query  
query(
  collection(db, 'portfolio'),
  where('vcId', '==', user.uid)  // 🔒 Only this VC's portfolio
);
```

### No Cross-Role Data Access

```
❌ VC User A CANNOT see VC User B's data
❌ VC User CANNOT see Exchange/IDO/Agency data
❌ Exchange User CANNOT see VC data
✅ Each VC user sees ONLY their own data
✅ Complete data isolation enforced
```

## 🎯 VC-Specific Features

### Protected Pages

All these routes require VC role:

- `/vc/dashboard` - Main VC dashboard
- `/vc/pipeline` - Deal pipeline
- `/vc/portfolio` - Investment portfolio
- `/vc/analytics` - Performance analytics
- `/vc/settings` - VC settings
- `/vc/settings/team` - Team management
- `/vc/kyb` - KYB verification

### VC Permissions

Locked permissions that cannot be changed:

- ✅ `VIEW_DASHBOARD` - View VC dashboard
- ✅ `VIEW_PIPELINE` - View deal pipeline
- ✅ `VIEW_PORTFOLIO` - View investment portfolio
- ✅ `ACCEPT_PITCHES` - Accept project pitches
- ✅ `DECLINE_PITCHES` - Decline project pitches
- ✅ `CREATE_DEAL_ROOMS` - Create deal rooms
- ✅ `VIEW_ANALYTICS` - View analytics
- ✅ `MANAGE_TEAM` - Manage VC team
- ✅ `VIEW_SETTINGS` - Access settings
- ✅ `EXPORT_DATA` - Export data

## ⚠️ DO NOT MODIFY

The following files are **LOCKED** and should **NOT** be modified:

- `src/config/vc-role-lock.ts` - Core VC configuration
- `src/hooks/useVCRoleGuard.ts` - Role verification hook
- `src/components/VCRoleGuardWrapper.tsx` - Guard wrapper component
- `src/middleware/vc-route-guard.ts` - Route protection middleware

### Why Locked?

1. **Security**: Prevents unauthorized access modifications
2. **Consistency**: Ensures uniform VC role behavior
3. **Data Integrity**: Maintains strict data isolation
4. **Compliance**: Meets regulatory requirements
5. **Reliability**: Prevents accidental permission changes

## 🚀 Implementation Example

### Protecting a New VC Page

```typescript
// src/app/vc/new-feature/page.tsx
"use client";

import { VCRoleGuardWrapper } from '@/components/VCRoleGuardWrapper';
import { VC_CONFIG } from '@/config/vc-role-lock';

export default function NewVCFeaturePage() {
  return (
    <VCRoleGuardWrapper requireKYB={true}>
      <div>
        {/* Your VC feature content */}
        <h1>New VC Feature</h1>
        <p>This page is protected by VC role guards</p>
      </div>
    </VCRoleGuardWrapper>
  );
}
```

### Checking VC Permissions

```typescript
import { useVCPermission } from '@/hooks/useVCRoleGuard';

function MyComponent() {
  const canExportData = useVCPermission('EXPORT_DATA');
  
  return (
    <div>
      {canExportData && (
        <button>Export Data</button>
      )}
    </div>
  );
}
```

## 📊 Security Logging

All VC access attempts are logged:

```
✅ Access granted: /vc/dashboard (user: abc123)
❌ Access denied: /vc/pipeline (reason: NOT_VC_ROLE)
🔒 Role verification: VC role confirmed (user: abc123)
⚠️ Unauthorized attempt: /vc/settings (user: xyz789, role: exchange)
```

## 🎯 Summary

The VC role is:
- 🔒 **Locked**: Core functionality cannot be changed
- 🛡️ **Protected**: Multiple layers of access control
- 🔐 **Isolated**: Complete data separation
- ✅ **Verified**: Real-time role validation
- 📊 **Monitored**: All access logged

**No modifications should be made to the VC role security system without proper authorization and security review.**

---

**Last Updated**: December 2024
**Security Level**: MAXIMUM
**Status**: 🔒 LOCKED

