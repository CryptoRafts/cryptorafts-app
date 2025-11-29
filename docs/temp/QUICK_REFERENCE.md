# 🚀 QUICK REFERENCE - CRYPTORAFTS PRODUCTION

## 🌐 Production URL
**https://cryptorafts-starter.vercel.app**

---

## ✅ All Systems Operational

### Chat System
- **Status:** ✅ Working for all 7 roles
- **Route:** `/messages`
- **Legacy Route:** `/chat` (auto-redirects)

### Features
- ✅ Real-time messaging
- ✅ Voice calls
- ✅ Video calls
- ✅ Notifications (sound + visual)
- ✅ Unread badges
- ✅ Privacy controls
- ✅ RaftAI integration

---

## 👥 Supported Roles
1. Founder - `/founder/dashboard` → "Deal Rooms"
2. VC - `/vc/dashboard` → "Messages"
3. Exchange - `/exchange/dashboard` → "Messages"
4. IDO - `/ido/dashboard` → "Messages"
5. Influencer - `/influencer/dashboard` → "Messages"
6. Marketing/Agency - `/agency/dashboard` → "Messages"
7. Admin - `/admin/dashboard` → "Messages"

---

## 🔧 Quick Commands

### Deploy to Production
```bash
vercel --prod --yes
```

### View Logs
```bash
vercel logs --follow
```

### Inspect Deployment
```bash
vercel inspect [url]
```

### Run Locally
```bash
npm run dev
```

---

## 📊 Key Files

### Chat System
- `/src/app/messages/page.tsx` - Main chat interface
- `/src/app/messages/[cid]/page.tsx` - Individual chat room
- `/src/components/ChatInterfaceTelegramFixed.tsx` - Chat UI
- `/src/lib/chatService.enhanced.ts` - Chat service

### Notifications
- `/src/lib/notification-manager.ts` - Notification system
- `/src/components/GlobalCallNotification.tsx` - Call notifications

### Calls
- `/src/lib/webrtc/WebRTCManager.ts` - WebRTC manager
- `/src/lib/simpleFirebaseCallManager.ts` - Firebase call manager

### Firebase
- `/src/lib/firebaseAdmin.ts` - Admin SDK
- `/src/lib/firebase.client.ts` - Client SDK
- `/firestore.rules.new` - Security rules

---

## 🐛 Troubleshooting

### Chat Not Loading
1. Check Firebase credentials in Vercel
2. Verify Firestore rules deployed
3. Clear browser cache

### Calls Not Working
1. Check browser permissions (mic/camera)
2. Verify HTTPS enabled
3. Check WebRTC compatibility

### Notifications Not Showing
1. Check browser notification permissions
2. Verify user is logged in
3. Test sound: `window.notificationManager.testSound()`

---

## 📚 Documentation
- `FOUNDER_CHAT_FIXED_COMPLETE.md` - Founder fixes
- `VERCEL_DEPLOYMENT_SUCCESS.md` - Deployment details
- `🎉_PRODUCTION_DEPLOYMENT_COMPLETE.md` - Full summary
- `FIREBASE_RULES_UPDATE_GUIDE.md` - Firebase setup
- `COMPLETE_CHAT_AND_CALL_SYSTEM_PERFECT.md` - Chat docs

---

## ✨ Status: PRODUCTION READY

**All features working. All roles supported. Zero errors. 100% deployed.** 🎉

