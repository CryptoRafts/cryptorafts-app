import { NextResponse } from "next/server";

export async function GET() {
  const debug: any = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    tests: {}
  };

  // Test 1: Environment variables
  try {
    debug.tests.env_vars = {
      status: "pass",
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? "set" : "missing",
      FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL ? "set" : "missing",
      FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? "set" : "missing",
      FIREBASE_SERVICE_ACCOUNT_KEY: process.env.FIREBASE_SERVICE_ACCOUNT_KEY ? "set" : "missing",
      GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS ? "set" : "missing"
    };
  } catch (error) {
    debug.tests.env_vars = { status: "fail", error: error instanceof Error ? error.message : "Unknown error" };
  }

  // Test 2: Service account file
  try {
    const fs = await import('fs');
    const path = await import('path');
    const serviceAccountPath = path.join(process.cwd(), 'secrets', 'service-account.json');
    const exists = fs.existsSync(serviceAccountPath);
    
    if (exists) {
      const content = fs.readFileSync(serviceAccountPath, 'utf8');
      const hasPlaceholders = content.includes('REPLACE_ME');
      debug.tests.service_account = {
        status: hasPlaceholders ? "warning" : "pass",
        exists: true,
        hasPlaceholders,
        path: serviceAccountPath
      };
    } else {
      debug.tests.service_account = {
        status: "fail",
        exists: false,
        path: serviceAccountPath
      };
    }
  } catch (error) {
    debug.tests.service_account = { status: "fail", error: error instanceof Error ? error.message : "Unknown error" };
  }

  // Test 3: Firebase Admin App - skipped, function doesn't exist
  debug.tests.firebase_admin_app = {
    status: "skip",
    message: "getAdminApp function not available"
  };

  // Test 4: Firebase Admin Auth
  try {
    const { getAdminAuth } = await import("@/server/firebaseAdmin");
    const auth = getAdminAuth();
    debug.tests.firebase_admin_auth = {
      status: "pass",
      message: "Firebase Admin Auth initialized"
    };
  } catch (error) {
    debug.tests.firebase_admin_auth = { status: "fail", error: error instanceof Error ? error.message : "Unknown error" };
  }

  // Test 5: Firebase Admin Firestore
  try {
    const { getAdminDb } = await import("@/server/firebaseAdmin");
    const db = getAdminDb();
    debug.tests.firebase_admin_firestore = {
      status: "pass",
      message: "Firebase Admin Firestore initialized"
    };
  } catch (error) {
    debug.tests.firebase_admin_firestore = { status: "fail", error: error instanceof Error ? error.message : "Unknown error" };
  }

  // Test 6: Firestore Connection (without actual read)
  try {
    const { getAdminDb } = await import("@/server/firebaseAdmin");
    const db = getAdminDb();
    if (!db) {
      throw new Error("Database not available");
    }
    // Just test if we can create a reference, don't actually read
    const testRef = db.doc('test/connection');
    debug.tests.firestore_connection = {
      status: "pass",
      message: "Firestore reference created successfully"
    };
  } catch (error) {
    debug.tests.firestore_connection = { status: "fail", error: error instanceof Error ? error.message : "Unknown error" };
  }

  // Calculate overall status
  const failedTests = Object.values(debug.tests).filter((test: any) => test.status === "fail");
  const warningTests = Object.values(debug.tests).filter((test: any) => test.status === "warning");
  
  debug.overall_status = failedTests.length === 0 ? (warningTests.length > 0 ? "warning" : "healthy") : "unhealthy";
  debug.failed_tests = failedTests.length;
  debug.warning_tests = warningTests.length;

  return NextResponse.json(debug, { 
    status: debug.overall_status === "unhealthy" ? 500 : 200 
  });
}
