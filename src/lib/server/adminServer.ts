import "server-only";
import * as admin from "firebase-admin";

/** Initialize Admin SDK once (prefers GOOGLE_APPLICATION_CREDENTIALS) */
function getApp(): admin.app.App {
  if (admin.apps.length) return admin.app();

  // OPTIMIZED: Better error handling for Base64 credentials
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
  if (b64 && b64.trim()) {
    try {
      const json = Buffer.from(b64.trim(), "base64").toString("utf8");
      if (json && json.trim()) {
        const creds = JSON.parse(json);
        return admin.initializeApp({ credential: admin.credential.cert(creds) });
      }
    } catch (error) {
      // Silently fall back to default initialization if Base64 parsing fails
      console.warn('Failed to parse FIREBASE_SERVICE_ACCOUNT_B64, using default credentials');
    }
  }
  // GOOGLE_APPLICATION_CREDENTIALS or default creds
  return admin.initializeApp();
}

const app = getApp();
export const authAdmin = app.auth();
export const dbAdmin   = app.firestore();
export const storageAdmin = app.storage();

/** Gate: require admin.super=true */
export async function assertSuperAdmin(req: Request) {
  const authz = req.headers.get("authorization") || "";
  const token = authz.startsWith("Bearer ") ? authz.slice(7) : null;
  if (!token) throw new Response("Unauthorized", { status: 401 });
  const decoded = await authAdmin.verifyIdToken(token, true).catch(() => null);
  if (!decoded?.admin?.super) throw new Response("Forbidden", { status: 403 });
  return decoded;
}
