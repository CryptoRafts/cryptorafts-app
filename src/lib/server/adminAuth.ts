import * as admin from "firebase-admin";

if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = (process.env.FIREBASE_ADMIN_PRIVATE_KEY || "").replace(/\\n/g, "\n");

  if (projectId && clientEmail && privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    });
  } else {
    admin.initializeApp();
  }
}

export const adminDb = admin.firestore();

export async function assertSuperAdmin({ idToken, ip }:{ idToken:string; ip?:string|null }){
  const decoded = await admin.auth().verifyIdToken(idToken);
  const isSuper = (decoded as any)?.admin?.super === true || (decoded as any)?.admin_super === true;
  if (!isSuper) {
    const err: any = new Error("Not admin");
    err.status = 401;
    throw err;
  }
  return { uid: decoded.uid, ip: ip||null };
}

export async function writeAudit(entry: { type:string; actorUid:string|null; subject?:any; delta?:any }){
  await adminDb.collection("audit").add({
    ...entry,
    ts: admin.firestore.FieldValue.serverTimestamp(),
    immutable: true
  });
}

export { admin };
