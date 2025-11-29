# Complete Firebase Rules Deployment Guide

## Overview
This guide provides comprehensive Firebase rules for both Firestore and Storage with complete admin access and proper role-based permissions for all user types in the Cryptorafts platform.

## Files Included
- `firestore.rules.complete` - Complete Firestore rules with admin override
- `storage.rules.complete` - Complete Storage rules with admin override

## User Roles Supported
- **Admin** - Full access to everything
- **VC** - Venture Capital users with organization access
- **Founder** - Project founders with project access
- **Exchange** - Exchange platform users
- **Agency** - Marketing agency users
- **Influencer** - Social media influencer users

## Key Features

### Admin Override
- Admins have full read/write access to all collections and files
- Admin role is checked first in all rules for maximum flexibility

### Role-Based Access Control
- Each user role has specific permissions
- Users can only access their own data unless explicitly allowed
- Organization members can access organization data
- Project members can access project data
- Room members can access chat data

### Security Features
- Authentication required for all operations
- File type validation for uploads
- File size limits for different file types
- Proper separation of public and private data

## Deployment Instructions

### 1. Backup Current Rules
```bash
# Backup current rules
cp firestore.rules firestore.rules.backup
cp storage.rules storage.rules.backup
```

### 2. Deploy New Rules
```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Storage rules
firebase deploy --only storage

# Or deploy both at once
firebase deploy --only firestore:rules,storage
```

### 3. Verify Deployment
```bash
# Check deployment status
firebase projects:list
firebase use --list
```

## Rule Categories

### Firestore Collections
- **Users** - User profiles and data
- **Organizations** - VC organization data
- **Projects** - Founder project data
- **Deals** - Investment deal data
- **Group Chats** - Deal room communications
- **Pitches** - Project pitch materials
- **Notifications** - User notifications
- **Audit** - System audit logs
- **Rate Limits** - API rate limiting
- **KYC/KYB Documents** - Verification documents

### Storage Paths
- **Users** - User profile photos and documents
- **Organizations** - Organization logos and documents
- **Projects** - Project images and pitch materials
- **Chat Attachments** - Room file attachments
- **Public Assets** - Publicly accessible files
- **Temporary Files** - Temporary uploads
- **System Files** - Admin-only system files

## Security Considerations

### File Upload Security
- File type validation for images, documents, videos, audio
- File size limits to prevent abuse
- Proper authentication for all uploads

### Data Access Control
- Users can only access their own data
- Organization members can access org data
- Project members can access project data
- Admins have full access for management

### Audit Trail
- All operations are logged for audit purposes
- Admin access is tracked
- User actions are recorded

## Testing the Rules

### 1. Test Admin Access
```javascript
// Test admin can access everything
const adminUser = { uid: 'admin-uid', token: { role: 'admin' } };
// Should have full access to all collections
```

### 2. Test Role-Based Access
```javascript
// Test VC access
const vcUser = { uid: 'vc-uid', token: { role: 'vc' } };
// Should access VC collections and organizations

// Test Founder access
const founderUser = { uid: 'founder-uid', token: { role: 'founder' } };
// Should access projects and pitches
```

### 3. Test File Uploads
```javascript
// Test organization logo upload
const logoPath = 'organizations/logos/org-logo.png';
// Should work for authenticated users

// Test project document upload
const docPath = 'projects/project-id/documents/doc.pdf';
// Should work for project members
```

## Troubleshooting

### Common Issues
1. **Permission Denied** - Check user authentication and role
2. **File Upload Failed** - Check file type and size limits
3. **Access Denied** - Verify user has proper role for collection

### Debug Commands
```bash
# Check Firebase project
firebase use --list

# Check rules deployment
firebase firestore:rules:get
firebase storage:rules:get

# Test rules locally
firebase emulators:start --only firestore,storage
```

## Maintenance

### Regular Updates
- Review rules quarterly for security updates
- Update file size limits as needed
- Add new collections as platform grows

### Monitoring
- Monitor Firebase console for rule violations
- Check audit logs for suspicious activity
- Review user access patterns

## Support

For issues with Firebase rules:
1. Check Firebase console for error details
2. Review rule syntax in Firebase console
3. Test rules in Firebase emulator
4. Contact Firebase support for complex issues

## Rule Files Summary

### firestore.rules.complete
- Complete Firestore rules with admin override
- Role-based access for all collections
- Proper security for user data
- Support for all user types

### storage.rules.complete
- Complete Storage rules with admin override
- File type and size validation
- Secure file upload paths
- Proper access control for all file types

Both files provide comprehensive security while maintaining the flexibility needed for the Cryptorafts platform.
