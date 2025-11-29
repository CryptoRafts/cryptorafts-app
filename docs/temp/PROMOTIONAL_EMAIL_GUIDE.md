# 📧 Promotional Email System - Complete Guide

## ✅ **What's Been Added**

### **New Email Functions:**

1. ✅ **Welcome Email** - Sent automatically when someone subscribes
2. ✅ **Promotional Email** - Send custom marketing emails to all subscribers
3. ✅ **Bulk Email** - Send to multiple subscribers at once

---

## 🚀 **How to Use Promotional Emails**

### **1. Send Welcome Email to New Subscribers:**

When someone subscribes to your email list:

```typescript
import { emailService } from '@/lib/email.service';

// When new subscriber signs up
await emailService.sendWelcomeEmail({
  email: 'user@example.com',
  name: 'John Doe'  // Optional
});
```

### **2. Send Promotional Email to All Subscribers:**

```typescript
import { emailService } from '@/lib/email.service';

// Example: Send newsletter
const subscribers = [
  { email: 'user1@example.com', name: 'User 1' },
  { email: 'user2@example.com', name: 'User 2' },
  { email: 'user3@example.com' }
];

const result = await emailService.sendPromotionalEmail(
  subscribers,
  '🚀 New Features Launching Soon!',
  'Exciting Updates from CryptoRafts',
  `We're thrilled to announce that we'll be launching several new features in the coming weeks.\n\nFeatures include:\n- Enhanced AI verification\n- New dashboard design\n- Improved security measures\n\nStay tuned for more updates!`,
  'Learn More',
  'https://www.cryptorafts.com/features'
);

console.log(`Sent to ${result.success} subscribers, ${result.failed} failed`);
```

### **3. Send Marketing Campaigns:**

```typescript
import { emailService } from '@/lib/email.service';

// Campaign: Announce new investment opportunity
await emailService.sendPromotionalEmail(
  allSubscribers,
  '💰 Exclusive Investment Opportunity',
  'New High-Potential Project Available',
  `We've just added a new verified project to our platform.\n\nKey highlights:\n- $5M funding goal\n- AI-powered security solution\n- Pre-seed stage\n\nGet early access by becoming a verified investor!`,
  'View Project',
  'https://www.cryptorafts.com/projects/latest'
);
```

---

## 📧 **Email Examples**

### **Example 1: Weekly Newsletter**

```typescript
await emailService.sendPromotionalEmail(
  subscribers,
  '📊 CryptoRafts Weekly Newsletter - Week of Jan 15',
  'This Week in Web3: Key Updates',
  `Hey there!\n\nHere's what happened this week:\n\n🚀 $10M in new funding raised across platform\n📈 25 new projects listed\n✅ 150 KYC verifications completed\n💼 5 major partnerships announced\n\nOur community is growing fast - join us today!`,
  'Join CryptoRafts',
  'https://www.cryptorafts.com/signup'
);
```

### **Example 2: Product Updates**

```typescript
await emailService.sendPromotionalEmail(
  subscribers,
  '🎉 New Feature: Smart Deal Rooms',
  'Introducing Smart Deal Rooms',
  `We're excited to introduce our latest feature: Smart Deal Rooms.\n\nWhat's new:\n- AI-powered document analysis\n- Real-time collaboration tools\n- Enhanced security measures\n- Seamless integration with your workflow\n\nExperience the future of deal management!`,
  'Try It Now',
  'https://www.cryptorafts.com/features/deal-rooms'
);
```

### **Example 3: Event Announcement**

```typescript
await emailService.sendPromotionalEmail(
  subscribers,
  '🎯 CryptoRafts Investor Summit - Registration Open',
  'Join Us at the Investor Summit 2024',
  `Don't miss our biggest event of the year!\n\nWhen: March 15-17, 2024\nWhere: Virtual and In-Person\n\nFeatured sessions:\n- Keynote by leading VCs\n- Pitch sessions with top startups\n- Networking opportunities\n- Exclusive deal flow access\n\nEarly bird tickets are limited - register now!`,
  'Register Now',
  'https://www.cryptorafts.com/events/summit2024'
);
```

---

## 🎯 **Best Practices**

### **1. Personalize Content:**
```typescript
// Use subscriber names when available
const message = `Hi ${subscriber.name || 'Friend'}! ${yourMessage}`;
```

### **2. Include Clear Call-to-Action:**
```typescript
// Always include a button with clear text
buttonText: 'Get Started',
buttonUrl: 'https://www.cryptorafts.com/action'
```

### **3. Respect Rate Limits:**
- System automatically adds 1 second delay between emails
- Don't send too many emails at once
- Monitor your email provider's daily limits

### **4. Maintain Your Subscriber List:**
- Track unsubscribes in your database
- Update email lists regularly
- Remove bounced emails

---

## 📊 **Collecting Subscribers**

### **On Your Homepage:**

Your subscription form on homepage will collect emails. Store them in Firestore:

```typescript
// In your subscribe API route
import { emailService } from '@/lib/email.service';

export async function POST(request: Request) {
  const { email, name } = await request.json();
  
  // Save to Firestore
  await db.collection('subscribers').add({
    email,
    name: name || '',
    subscribedAt: new Date(),
    source: 'homepage'
  });
  
  // Send welcome email
  await emailService.sendWelcomeEmail({ email, name });
  
  return Response.json({ success: true });
}
```

### **Get All Subscribers:**

```typescript
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase.client';

const subscribersSnapshot = await getDocs(collection(db, 'subscribers'));
const subscribers = subscribersSnapshot.docs.map(doc => ({
  email: doc.data().email,
  name: doc.data().name
}));
```

---

## 📝 **Unsubscribe Feature**

All emails include an unsubscribe link. Create an unsubscribe page:

```typescript
// src/app/unsubscribe/page.tsx
'use client';

import { useState } from 'react';

export default function UnsubscribePage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');

  const handleUnsubscribe = async () => {
    // Remove from Firestore
    const querySnapshot = await getDocs(
      query(collection(db, 'subscribers'), where('email', '==', email))
    );
    querySnapshot.forEach(async (doc) => {
      await deleteDoc(doc.ref);
    });
    
    setStatus('Successfully unsubscribed');
  };

  return (
    <div>
      <h1>Unsubscribe</h1>
      <input 
        type="email" 
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
      />
      <button onClick={handleUnsubscribe}>Unsubscribe</button>
      {status && <p>{status}</p>}
    </div>
  );
}
```

---

## ✅ **Complete Email System Now Includes:**

1. ✅ **KYC Approval Email** - When KYC is approved
2. ✅ **KYC Rejection Email** - When KYC is rejected  
3. ✅ **KYB Approval Email** - When KYB is approved
4. ✅ **KYB Rejection Email** - When KYB is rejected
5. ✅ **Welcome Email** - For new subscribers
6. ✅ **Promotional Email** - Marketing campaigns
7. ✅ **Registration Confirmation** - After signup

All emails are sent from **business@cryptorafts.com**! 🎉

---

## 📞 **Need Help?**

- Check email logs in console
- Verify email configuration in `.env.local`
- Test with a single email first
- Monitor rate limits from your email provider

**Status**: ✅ Complete and Ready to Use!

