# Complete Firebase Rules with Admin Override

## Overview
This package provides comprehensive Firebase rules for both Firestore and Storage with complete admin access and proper role-based permissions for the Cryptorafts platform.

## Files Included

### Core Rule Files
- `firestore.rules.complete` - Complete Firestore rules with admin override
- `storage.rules.complete` - Complete Storage rules with admin override

### Deployment Scripts
- `deploy-firebase-rules.sh` - Linux/Mac deployment script
- `deploy-firebase-rules.bat` - Windows deployment script

### Documentation
- `firebase-rules-deployment.md` - Detailed deployment guide
- `FIREBASE_RULES_COMPLETE.md` - This comprehensive overview

## User Roles Supported

### 1. Admin Role
- **Full Access**: Complete read/write access to all collections and files
- **Override**: Admin rules take precedence over all other rules
- **Management**: Can manage all users, organizations, projects, and system data

### 2. VC (Venture Capital) Role
- **Organizations**: Full access to their organization data
- **Projects**: Read access to all projects for deal flow
- **Pipeline**: Manage their investment pipeline
- **Deals**: Create and manage investment deals
- **Chat**: Access to deal rooms and communications

### 3. Founder Role
- **Projects**: Full access to their own projects
- **Pitches**: Create and manage project pitches
- **Documents**: Upload project documents and materials
- **Chat**: Access to deal rooms for their projects

### 4. Exchange Role
- **Listings**: Manage exchange listings
- **Documents**: Access to listing documents
- **Projects**: Read access to projects for listing purposes

### 5. Agency Role
- **Projects**: Manage agency projects
- **Assets**: Upload and manage marketing assets
- **Content**: Create and manage promotional content

### 6. Influencer Role
- **Campaigns**: Manage influencer campaigns
- **Content**: Upload and manage content
- **Assets**: Access to campaign assets

## Security Features

### Authentication
- All operations require user authentication
- Role-based access control for all collections
- Proper user ownership validation

### File Security
- File type validation for uploads
- File size limits to prevent abuse
- Secure file paths for different content types
- Proper access control for sensitive documents

### Data Protection
- Users can only access their own data
- Organization members can access org data
- Project members can access project data
- Private documents are properly secured

## Rule Categories

### Firestore Collections

#### User Data
- `users/{userId}` - User profiles and personal data
- `users/{userId}/{subcollection}` - User subcollections

#### Organization Data
- `organizations/{orgId}` - VC organization data
- `organizations/{orgId}/{subcollection}` - Organization subcollections

#### Project Data
- `projects/{projectId}` - Founder project data
- `projects/{projectId}/{subcollection}` - Project subcollections

#### Communication
- `groupChats/{roomId}` - Deal room communications
- `groupChats/{roomId}/messages/{messageId}` - Chat messages
- `chatRooms/{chatId}` - General chat rooms

#### Business Data
- `deals/{dealId}` - Investment deals
- `pitches/{pitchId}` - Project pitches
- `vcPipelines/{orgId}/items/{projectId}` - VC pipeline

#### System Data
- `notifications/{notificationId}` - User notifications
- `audit/{auditId}` - System audit logs
- `rateLimits/{limitId}` - API rate limiting

### Storage Paths

#### User Files
- `users/{userId}/profile/{fileName}` - Profile photos
- `users/{userId}/documents/{fileName}` - User documents
- `users/{userId}/temp/{fileName}` - Temporary files

#### Organization Files
- `organizations/logos/{fileName}` - Organization logos
- `organizations/{orgId}/documents/{fileName}` - Org documents
- `organizations/{orgId}/kyb/{fileName}` - KYB documents

#### Project Files
- `projects/{projectId}/images/{fileName}` - Project images
- `projects/{projectId}/documents/{fileName}` - Project documents
- `projects/{projectId}/pitches/{fileName}` - Pitch materials
- `projects/{projectId}/videos/{fileName}` - Pitch videos

#### Communication Files
- `chat-attachments/{roomId}/{fileName}` - Chat attachments
- `chat-attachments/{roomId}/images/{fileName}` - Chat images
- `chat-attachments/{roomId}/documents/{fileName}` - Chat documents

#### System Files
- `audit/{fileName}` - Audit documents (admin only)
- `system/{fileName}` - System files (admin only)
- `analytics/{fileName}` - Analytics data (admin only)

## Deployment Instructions

### Quick Deployment
```bash
# Run the deployment script
./deploy-firebase-rules.sh  # Linux/Mac
deploy-firebase-rules.bat  # Windows
```

### Manual Deployment
```bash
# Backup current rules
cp firestore.rules firestore.rules.backup
cp storage.rules storage.rules.backup

# Copy complete rules
cp firestore.rules.complete firestore.rules
cp storage.rules.complete storage.rules

# Deploy to Firebase
firebase deploy --only firestore:rules,storage
```

### Verification
```bash
# Check deployment status
firebase projects:list
firebase firestore:rules:get
firebase storage:rules:get
```

## Testing the Rules

### 1. Admin Access Test
```javascript
// Admin should have full access
const adminUser = { uid: 'admin-uid', token: { role: 'admin' } };
// Should access all collections and files
```

### 2. Role-Based Access Test
```javascript
// VC access test
const vcUser = { uid: 'vc-uid', token: { role: 'vc' } };
// Should access VC collections and organizations

// Founder access test
const founderUser = { uid: 'founder-uid', token: { role: 'founder' } };
// Should access projects and pitches
```

### 3. File Upload Test
```javascript
// Organization logo upload
const logoPath = 'organizations/logos/org-logo.png';
// Should work for authenticated users

// Project document upload
const docPath = 'projects/project-id/documents/doc.pdf';
// Should work for project members
```

## Key Benefits

### 1. Complete Admin Control
- Admins have full access to everything
- Override any permission restrictions
- Manage all users and data

### 2. Role-Based Security
- Each user type has appropriate permissions
- Users can only access their own data
- Proper separation of concerns

### 3. Scalable Architecture
- Easy to add new user roles
- Flexible permission system
- Supports complex business logic

### 4. Security First
- Authentication required for all operations
- File type and size validation
- Proper access control for sensitive data

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

## Summary

This complete Firebase rules package provides:
- ✅ Full admin access to everything
- ✅ Role-based access control for all user types
- ✅ Secure file upload and storage
- ✅ Comprehensive security features
- ✅ Easy deployment and maintenance
- ✅ Scalable architecture for future growth

The rules are designed to be secure, flexible, and easy to maintain while providing complete control for administrators and appropriate access for each user role.
