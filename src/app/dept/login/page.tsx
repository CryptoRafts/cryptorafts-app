"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase.client";
import { db, collection, query, where, getDocs } from "@/lib/firebase.client";

export default function DepartmentLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginMethod, setLoginMethod] = useState<"google" | "email">("google");

  const department = searchParams.get("dept") || "kyc";

  useEffect(() => {
    // Check if user is already authenticated and has department access
    if (!auth) return;
    const unsubscribe = auth.onAuthStateChanged(async (user: any) => {
      if (user) {
        try {
          const token = await user.getIdToken();
          const response = await fetch("/api/dept/guard/complete", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ department })
          });

          if (response.ok) {
            router.push(`/dept/${department}`);
          } else {
            if (auth) await signOut(auth);
            setError("You don't have access to this department.");
          }
        } catch (err) {
          console.error("Department verification failed:", err);
          if (auth) await signOut(auth);
          setError("Failed to verify department access.");
        }
      }
    });

    return () => unsubscribe();
  }, [router, department]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!auth) throw new Error('Authentication service unavailable');
      if (!db) throw new Error('Database unavailable');
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user has department access
      const memberQuery = query(
        collection(db!, "departmentMembers"),
        where("email", "==", user.email?.toLowerCase()),
        where("dept", "==", department),
        where("status", "==", "active")
      );

      const memberSnapshot = await getDocs(memberQuery);
      if (memberSnapshot.empty) {
        if (auth) await signOut(auth);
        setError("You don't have access to this department. Please contact your administrator.");
        return;
      }

      // Get ID token and verify department access
      const token = await user.getIdToken();
      const response = await fetch("/api/dept/guard/complete", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ department })
      });

      if (response.ok) {
        router.push(`/dept/${department}`);
      } else {
        if (auth) await signOut(auth);
        setError("Department access denied. Please contact your administrator.");
      }
    } catch (error: any) {
      console.error("Sign in error:", error);
      setError("Failed to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!auth) throw new Error('Authentication service unavailable');
      await signInWithEmailAndPassword(auth, email, password);
      
      // The auth state change handler will handle department verification
    } catch (error: any) {
      console.error("Email sign in error:", error);
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass p-8 rounded-2xl w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">{department.toUpperCase()} Department Access</h1>
          <p className="text-white/60">Sign in to access the department portal</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Login Method Tabs */}
        <div className="flex mb-6">
          <button
            onClick={() => setLoginMethod("google")}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              loginMethod === "google" 
                ? "text-white border-b-2 border-blue-400" 
                : "text-white/60 hover:text-white"
            }`}
          >
            Google
          </button>
          <button
            onClick={() => setLoginMethod("email")}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              loginMethod === "email" 
                ? "text-white border-b-2 border-blue-400" 
                : "text-white/60 hover:text-white"
            }`}
          >
            Email
          </button>
        </div>

        {loginMethod === "google" ? (
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="btn btn-primary w-full py-3 flex items-center justify-center gap-3"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            <span>{loading ? "Signing in..." : "Continue with Google"}</span>
          </button>
        ) : (
          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-400"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-400"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-3"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <p className="text-xs text-white/40">
            Only authorized department members can access this portal.
          </p>
        </div>
      </div>
    </div>
  );
}
