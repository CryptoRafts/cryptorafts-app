import { getAdminAuth } from "@/server/firebaseAdmin";

export async function verifySessionCookie(sessionCookie: string) {
  try {
    const adminAuth = getAdminAuth();
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    return decodedClaims;
  } catch (error) {
    // Try to handle fallback session
    try {
      const decoded = JSON.parse(Buffer.from(sessionCookie, 'base64').toString());
      if (decoded.fallback && decoded.expires > Date.now()) {
        // Verify the ID token
        const adminAuth = getAdminAuth();
        const decodedToken = await adminAuth.verifyIdToken(decoded.idToken);
        return decodedToken;
      }
    } catch (fallbackError) {
      // Fallback also failed
    }
    console.error("Session verification failed:", error);
    return null;
  }
}
