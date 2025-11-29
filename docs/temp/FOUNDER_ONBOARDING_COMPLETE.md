# Founder Onboarding Flow - Complete Implementation

## Overview
Implemented a complete onboarding flow for founders that enforces proper registration and KYC verification before accessing the dashboard.

## Problem Solved
Previously, founders could skip registration and KYC, going directly to the dashboard after role selection. Now, the onboarding flow is enforced.

## Implementation

### 1. Founder Registration Page
**Path**: `src/app/founder/register/page.tsx`

**Features**:
- Collects personal information (first name, last name, email, phone)
- Collects professional information (company, job title, bio)
- Collects social links (LinkedIn, Twitter, Website)
- Pre-fills form if partial data exists
- Auto-redirects if profile already completed
- Saves profile data to Firestore
- Redirects to KYC after completion

**Form Fields**:
- First Name *
- Last Name *
- Email *
- Phone
- Company
- Job Title
- Bio
- LinkedIn
- Twitter
- Website

### 2. Onboarding Guard in Layout
**Path**: `src/app/founder/layout.tsx`

**Features**:
- Checks user's onboarding status on every navigation
- Redirects to appropriate step if not completed
- Allows access to onboarding pages (`/register`, `/kyc`, `/pending-approval`)
- Blocks dashboard access until all steps complete

**Flow Logic**:
1. Check if user document exists → Redirect to `/founder/register` if not
2. Check profile completion → Redirect to `/founder/register` if not completed
3. Check KYC status → Redirect based on status:
   - Not submitted → `/founder/kyc`
   - Pending → `/founder/pending-approval`
   - Approved → Allow dashboard access

### 3. Access Control Integration
Uses existing `access-control.ts` functions:
- `checkOnboardingCompletion()` - Checks if user completed all steps
- `getNextOnboardingStep()` - Returns next step in onboarding

## User Flow

```
1. User selects "Founder" role
   ↓
2. Redirected to /founder/register
   ↓
3. User completes profile registration
   ↓
4. Redirected to /founder/kyc
   ↓
5. User completes KYC submission
   ↓
6. Redirected to /founder/pending-approval
   ↓
7. Admin approves KYC
   ↓
8. User sees Congratulations screen
   ↓
9. Redirected to /founder/dashboard
   ↓
10. Full access to founder features
```

## Data Stored in Firestore

When user completes registration, the following data is saved:

```javascript
{
  role: 'founder',
  // Name fields
  firstName: string,
  lastName: string,
  name: string,
  displayName: string,
  fullName: string,
  // Contact
  email: string,
  phone: string,
  // Company info
  company: string,
  jobTitle: string,
  // Bio and social
  bio: string,
  linkedin: string,
  twitter: string,
  website: string,
  // Status
  profileCompleted: true,
  onboardingStep: 'kyc',
  lastUpdated: timestamp,
  updatedAt: timestamp
}
```

## Onboarding Pages

### Allowed Without Verification
- `/founder/register` - Profile registration
- `/founder/kyc` - KYC verification
- `/founder/pending-approval` - Waiting for approval

### Requires Complete Onboarding
- `/founder/dashboard` - Main dashboard
- `/founder/pitch` - Pitch submissions
- `/founder/projects` - Project management
- `/founder/deals` - Deal management
- All other founder pages

## Testing Checklist

- [x] User selects founder role
- [x] Redirected to registration page
- [x] Registration form works
- [x] Profile data saved to Firestore
- [x] Auto-redirect to KYC after registration
- [x] Cannot access dashboard without registration
- [x] Cannot access dashboard without KYC completion
- [x] Cannot access dashboard without approval
- [x] Layout guard enforces onboarding steps
- [x] Access control functions work correctly

## Files Modified

1. ✅ `src/app/founder/register/page.tsx` - **NEW** (Created registration page)
2. ✅ `src/app/founder/layout.tsx` - **UPDATED** (Added onboarding guard)

## Next Steps

To complete onboarding for other roles, create similar pages:
- `src/app/vc/register/page.tsx`
- `src/app/exchange/register/page.tsx`
- `src/app/ido/register/page.tsx`
- `src/app/agency/register/page.tsx`
- `src/app/influencer/register/page.tsx`

And update their respective layouts with onboarding guards.

## Status

✅ **COMPLETE** - Founder onboarding flow is now fully enforced!

- Registration page created and working
- Onboarding guard implemented in layout
- Access control properly enforced
- User cannot skip any onboarding steps
- All data properly saved to Firestore
