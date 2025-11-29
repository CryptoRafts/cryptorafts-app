import * as admin from "firebase-admin";

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(require("../secrets/service-account.json")),
  });
}

(async ()=>{
  const email = "anasshamsiggc@gmail.com";
  let user = await admin.auth().getUserByEmail(email).catch(async ()=>{
    return await admin.auth().createUser({ email, password:"Admin"+Math.random().toString(36).slice(2)+"Aa1!", emailVerified:true });
  });
  await admin.auth().setCustomUserClaims(user.uid, { ...(user.customClaims||{}), admin:{ super:true } });
  await admin.firestore().doc(`users/${user.uid}`).set({ role:"admin", status:"active", profileCompleted:true, admin:{ super:true }, updatedAt: Date.now() }, { merge:true });
  console.log("✅ Super-admin set:", email);
  process.exit(0);
})().catch(e=>{ console.error(e); process.exit(1); });
