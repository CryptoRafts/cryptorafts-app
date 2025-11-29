import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/server/firebaseAdmin";

export async function GET() {
  const results: any = {
    timestamp: new Date().toISOString(),
    tests: {}
  };

  // Test 1: Basic API functionality
  try {
    results.tests.basic_api = { status: "pass", message: "API route is working" };
  } catch (error) {
    results.tests.basic_api = { status: "fail", error: error instanceof Error ? error.message : "Unknown error" };
  }

  // Test 2: Environment variables
  try {
    const envVars = {
      NODE_ENV: process.env.NODE_ENV,
      FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? "set" : "missing",
      FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? "set" : "missing",
      FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? "set" : "missing",
      ADMIN_ALLOWLIST: process.env.ADMIN_ALLOWLIST ? "set" : "missing"
    };
    results.tests.environment = { status: "pass", variables: envVars };
  } catch (error) {
    results.tests.environment = { status: "fail", error: error instanceof Error ? error.message : "Unknown error" };
  }

  // Test 3: Firebase Admin initialization
  try {
    const adminAuth = getAdminAuth();
    results.tests.firebase_admin_auth = { status: "pass", message: "Firebase Admin Auth initialized" };
  } catch (error) {
    results.tests.firebase_admin_auth = { status: "fail", error: error instanceof Error ? error.message : "Unknown error" };
  }

  // Test 4: Firebase Admin Firestore
  try {
    const adminDb = getAdminDb();
    results.tests.firebase_admin_firestore = { status: "pass", message: "Firebase Admin Firestore initialized" };
  } catch (error) {
    results.tests.firebase_admin_firestore = { status: "fail", error: error instanceof Error ? error.message : "Unknown error" };
  }

  // Test 5: Firestore connection
  try {
    const adminDb = getAdminDb();
    if (!adminDb) {
      results.tests.firestore_connection = { status: "skip", message: "Firestore not configured" };
    } else {
      const testDoc = await adminDb.doc('test/connection').get();
      results.tests.firestore_connection = { status: "pass", message: "Firestore connection successful" };
    }
  } catch (error) {
    results.tests.firestore_connection = { status: "fail", error: error instanceof Error ? error.message : "Unknown error" };
  }

  // Test 6: Service account file
  try {
    const fs = await import('fs');
    const path = await import('path');
    const serviceAccountPath = path.join(process.cwd(), 'secrets', 'service-account.json');
    const exists = fs.existsSync(serviceAccountPath);
    results.tests.service_account = { 
      status: exists ? "pass" : "fail", 
      message: exists ? "Service account file exists" : "Service account file missing",
      path: serviceAccountPath
    };
  } catch (error) {
    results.tests.service_account = { status: "fail", error: error instanceof Error ? error.message : "Unknown error" };
  }

  // Calculate overall status
  const failedTests = Object.values(results.tests).filter((test: any) => test.status === "fail");
  results.overall_status = failedTests.length === 0 ? "healthy" : "unhealthy";
  results.failed_tests = failedTests.length;

  return NextResponse.json(results, { 
    status: results.overall_status === "healthy" ? 200 : 500 
  });
}
