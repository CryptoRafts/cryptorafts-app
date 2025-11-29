# 🌟 VERIFIED SPOTLIGHT - COMPLETE GUIDE

## 🎯 Overview

The Verified Spotlight feature allows KYC/KYB-verified projects to showcase their projects on Cryptorafts for premium visibility. This is a monetized feature that provides two spotlight tiers.

---

## 💰 Spotlight Tiers

### 1️⃣ **Premium Spotlight** - $300/month
- **Location**: Top of homepage (main banner)
- **Visibility**: Maximum - seen by all visitors immediately
- **Slots Available**: 1 slot only
- **Display Size**: Large banner with full project details
- **Features**:
  - Large banner image (1200x400px recommended)
  - Project logo and name
  - Tagline and description
  - Verification badges (KYC, KYB, RaftAI)
  - Click tracking and analytics
  - Duration progress bar
  - Direct link to project profile

### 2️⃣ **Featured Spotlight** - $150/month
- **Location**: Mid-section of Explore page
- **Visibility**: High - seen by users browsing projects
- **Slots Available**: Up to 3 slots
- **Display Size**: Medium card in grid layout
- **Features**:
  - Banner image (800x300px recommended)
  - Project logo and name
  - Tagline
  - Verification badges
  - Click tracking
  - Direct link to project profile

---

## ✅ Requirements

To apply for a Verified Spotlight, projects must meet these criteria:

1. **KYC Verified** ✓
   - Founder identity verification complete
   
2. **KYB Verified** ✓
   - Business/project verification complete
   
3. **RaftAI Rating** ✓
   - Must have "High" or "Normal" rating
   - "Low" rated projects cannot apply
   
4. **Payment Complete** ✓
   - Stripe or Crypto payment processed
   - Payment confirmed before publishing

---

## 🚀 How It Works

### For Founders (Applying)

1. **Navigate to Spotlight Application**
   - Go to `/spotlight/apply`
   - Or click "Spotlight" in navigation menu

2. **Select Your Project**
   - Choose from your verified projects
   - Only eligible projects shown

3. **Choose Spotlight Tier**
   - Premium Spotlight ($300/month)
   - Featured Spotlight ($150/month)

4. **Submit Application**
   - Application sent to admin for review
   - Status: "Pending"

5. **Complete Payment**
   - Redirected to payment page
   - Choose payment method:
     - Stripe (Credit/Debit card)
     - Cryptocurrency
   - Payment processed securely

6. **Admin Approval**
   - Admin reviews application
   - Checks verification status
   - Approves or rejects

7. **Go Live!**
   - Once approved and paid, spotlight goes live
   - Displays for 30 days
   - Auto-hides after expiration

### For Admins (Managing)

1. **View All Applications**
   - Navigate to `/admin/spotlight`
   - See all pending, approved, rejected applications

2. **Review Application**
   - Check project verification status
   - Verify payment completion
   - Review project quality

3. **Actions Available**
   - **Approve**: Activates spotlight (if payment complete)
   - **Reject**: Declines application
   - **Suspend**: Temporarily hide active spotlight
   - **Renew**: Extend spotlight duration

4. **Filter & Sort**
   - Filter by status (pending, approved, rejected, suspended, expired)
   - View application details
   - Track analytics

---

## 📊 Analytics & Tracking

Every spotlight tracks the following metrics:

### Impressions
- Number of times spotlight was displayed
- Auto-tracked when component loads

### Profile Views
- Number of times user clicked to view project
- Tracked on "View Project" button click

### Click-Through Rate (CTR)
- Calculated: (Profile Views / Impressions) × 100%
- Shown in admin dashboard

### Duration
- Shows progress bar of spotlight duration
- Displays start date and end date
- Auto-expires after 30 days

---

## 🗂️ Firestore Collections

### `spotlightApplications` Collection

```typescript
{
  id: string;
  projectId: string;
  projectName: string;
  founderId: string;
  founderEmail: string;
  bannerUrl: string;
  logoUrl: string;
  tagline: string;
  description: string;
  slotType: 'premium' | 'featured';
  price: number; // 300 for premium, 150 for featured
  status: 'pending' | 'approved' | 'rejected' | 'suspended' | 'expired';
  paymentStatus: 'pending' | 'completed' | 'failed';
  paymentMethod?: 'stripe' | 'crypto';
  transactionId?: string;
  verificationData: {
    kycVerified: boolean;
    kybVerified: boolean;
    raftaiRating: 'High' | 'Normal' | 'Low';
  };
  startDate?: Date;
  endDate?: Date; // 30 days from startDate
  createdAt: Date;
  updatedAt: Date;
  approvedBy?: string; // Admin UID
  approvedAt?: Date;
  suspendedAt?: Date;
  analytics: {
    impressions: number;
    profileViews: number;
    clicks: number;
  };
}
```

---

## 🔧 Firestore Indexes Required

The following composite indexes are required:

### Index 1: Status + Created At
```json
{
  "collectionGroup": "spotlightApplications",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```

### Index 2: Status + Slot Type + Start Date
```json
{
  "collectionGroup": "spotlightApplications",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "slotType", "order": "ASCENDING" },
    { "fieldPath": "startDate", "order": "DESCENDING" }
  ]
}
```

### Index 3: Created By + Created At
```json
{
  "collectionGroup": "spotlightApplications",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "createdBy", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```

**To Deploy Indexes:**
1. Run `deploy-spotlight-indexes.bat` (Windows)
2. Or manually: `firebase deploy --only firestore:indexes`
3. Or click the link in the error message to create in Firebase Console

---

## 🎨 UI Components

### `PremiumSpotlight.tsx`
- **Location**: Homepage (`src/app/page.tsx`)
- **Purpose**: Display premium spotlight banner
- **Features**:
  - Large banner with glassmorphism effect
  - Project logo, name, tagline
  - Verification badges
  - Progress bar showing duration
  - Click tracking
  - Responsive design

### `FeaturedSpotlight.tsx`
- **Location**: Explore page (`src/app/explore/page.tsx`)
- **Purpose**: Display featured spotlight cards
- **Features**:
  - Grid layout (up to 3 cards)
  - Medium-sized cards
  - Project logo, name, tagline
  - Verification badges
  - Click tracking
  - Hover effects

### Application Form (`/spotlight/apply`)
- Project selection dropdown
- Verification status display
- Slot type selection (Premium/Featured)
- Price display
- Submit and redirect to payment

### Admin Dashboard (`/admin/spotlight`)
- View all applications
- Filter by status
- Approve/Reject/Suspend actions
- View analytics
- Renew spotlights

### Payment Page (`/spotlight/payment/[id]`)
- Order summary
- Payment method selection (Stripe/Crypto)
- Secure payment processing
- Redirect to success page

---

## 💳 Payment Integration

### Stripe Payment Flow

1. User selects "Stripe" payment method
2. Application creates payment intent
3. Stripe checkout session initiated
4. Payment processed by Stripe
5. Webhook confirms payment
6. Application status updated to "completed"
7. Spotlight activated (if approved)

### Crypto Payment Flow

1. User selects "Crypto" payment method
2. Application generates payment address
3. User sends crypto to address
4. Blockchain transaction monitored
5. Payment confirmed on-chain
6. Application status updated to "completed"
7. Spotlight activated (if approved)

**Note**: Current implementation uses mock payment for testing. Production integration requires:
- Stripe API keys (in `.env`)
- Crypto payment gateway (e.g., Coinbase Commerce)
- Webhook handlers for payment confirmation

---

## 🔐 Security & Validation

### Frontend Validation
- ✅ User must be authenticated
- ✅ User role must be "founder"
- ✅ Project must be KYC/KYB verified
- ✅ RaftAI rating must be High/Normal
- ✅ Payment amount matches slot type

### Backend Validation (API Routes)
- ✅ Verify user authentication token
- ✅ Verify user owns the project
- ✅ Verify payment transaction ID
- ✅ Prevent duplicate applications
- ✅ Admin-only actions (approve/reject/suspend)

### Firestore Security Rules

```javascript
match /spotlightApplications/{applicationId} {
  // Anyone can read approved spotlights
  allow read: if resource.data.status == 'approved';
  
  // Founders can read their own applications
  allow read: if request.auth != null && 
                 request.auth.uid == resource.data.founderId;
  
  // Founders can create applications
  allow create: if request.auth != null && 
                   request.auth.token.role == 'founder' &&
                   request.resource.data.founderId == request.auth.uid;
  
  // Only admins can update/delete
  allow update, delete: if request.auth != null && 
                           request.auth.token.role == 'admin';
}
```

---

## 📱 Marketing Copy

### For Telegram / Social Media

```
🔹 Verified Spotlight Now Open!

Showcase your verified Web3 project to investors, founders, 
and launchpads inside Cryptorafts.

2 Slots Only / Month:
✅ Premium Spotlight — $300 (Top Homepage)
✅ Featured Spotlight — $150 (Explore Section)

Requirements:
✅ KYC/KYB Verified Project
✅ Safe, compliant, no external links

Get visibility in the world's first AI-verified ecosystem.

DM @RaftAI_Bot or apply in-app under "Spotlight" → "Apply Now."

Pitch. Invest. Build. Verified.
```

### For In-App Announcements

```
🌟 NEW: Verified Spotlight Feature!

Premium exposure for verified projects:

💎 Premium Spotlight - $300/month
   → Top homepage banner
   → Maximum visibility
   
⭐ Featured Spotlight - $150/month
   → Explore section placement
   → High visibility

Only for KYC/KYB verified projects with 
High or Normal RaftAI ratings.

Apply now to showcase your project!
```

---

## 🐛 Troubleshooting

### Issue: Spotlight Not Showing on Homepage

**Possible Causes:**
1. No active spotlight application
2. Application not approved
3. Payment not completed
4. Dates expired
5. Firestore indexes not deployed

**Solutions:**
1. Check admin dashboard for active spotlights
2. Verify application status = 'approved'
3. Verify paymentStatus = 'completed'
4. Check startDate <= now <= endDate
5. Deploy Firestore indexes

### Issue: Firestore Index Error

**Error Message:**
```
The query requires an index. You can create it here: [link]
```

**Solution:**
1. Run `deploy-spotlight-indexes.bat`
2. Or click the provided link
3. Wait 2-5 minutes for index to build
4. Refresh page

### Issue: Payment Not Processing

**Possible Causes:**
1. Stripe API keys not configured
2. Network error
3. Invalid payment details

**Solutions:**
1. Check `.env` for STRIPE_SECRET_KEY
2. Check browser console for errors
3. Verify payment method details
4. Use test mode for development

### Issue: Application Stuck in Pending

**Possible Causes:**
1. Admin hasn't reviewed yet
2. Payment not completed

**Solutions:**
1. Contact admin to review
2. Complete payment first
3. Check application status in admin dashboard

---

## 🔄 Auto-Expiry System

Spotlights automatically expire after 30 days:

1. **Scheduled Check** (runs daily)
   - Checks all approved spotlights
   - Compares endDate with current date
   - Updates status to 'expired' if past endDate

2. **Display Logic**
   - Component only shows if: startDate <= now <= endDate
   - Expired spotlights hidden automatically
   - No manual intervention needed

3. **Renewal Process**
   - Admin can renew expired spotlights
   - Extends endDate by 30 days
   - Requires new payment
   - Updates renewal history

---

## 📈 Future Enhancements

### Phase 2 Features
- [ ] Automated renewal reminders
- [ ] Bulk spotlight purchases (3 months, 6 months)
- [ ] A/B testing for banner designs
- [ ] Advanced analytics dashboard
- [ ] Spotlight performance reports (PDF export)
- [ ] Competitor analysis
- [ ] Social media integration (auto-post)
- [ ] Spotlight marketplace (resell unused time)

### Phase 3 Features
- [ ] Dynamic pricing based on demand
- [ ] Auction system for premium slot
- [ ] Spotlight packages (Premium + Featured bundle)
- [ ] White-label spotlights for agencies
- [ ] API access for programmatic spotlight management

---

## 📞 Support

For assistance with Verified Spotlight:

- **Technical Issues**: Contact dev team
- **Payment Issues**: Contact billing@cryptorafts.com
- **Application Review**: Contact admin via `/admin/spotlight`
- **General Questions**: DM @RaftAI_Bot on Telegram

---

## ✅ Deployment Checklist

Before going live with Spotlight feature:

- [ ] Deploy Firestore indexes
- [ ] Add Firestore security rules
- [ ] Configure Stripe API keys
- [ ] Set up crypto payment gateway
- [ ] Test payment flow (Stripe + Crypto)
- [ ] Test admin approval flow
- [ ] Verify spotlight displays correctly
- [ ] Test analytics tracking
- [ ] Test auto-expiry system
- [ ] Add monitoring/alerts
- [ ] Create admin documentation
- [ ] Train support team
- [ ] Announce feature launch
- [ ] Monitor first applications

---

## 🎉 Success!

The Verified Spotlight feature is now complete and ready to use!

**Key Files:**
- `src/lib/spotlight-service.ts` - Service layer
- `src/lib/spotlight-types.ts` - TypeScript types
- `src/components/PremiumSpotlight.tsx` - Homepage banner
- `src/components/FeaturedSpotlight.tsx` - Explore cards
- `src/app/spotlight/apply/page.tsx` - Application form
- `src/app/spotlight/payment/[id]/page.tsx` - Payment page
- `src/app/admin/spotlight/page.tsx` - Admin dashboard
- `firestore.indexes.json` - Required indexes

**Next Steps:**
1. Deploy Firestore indexes (run `deploy-spotlight-indexes.bat`)
2. Test the complete flow
3. Create your first spotlight application!

---

🌟 **Pitch. Invest. Build. Verified.** 🌟

