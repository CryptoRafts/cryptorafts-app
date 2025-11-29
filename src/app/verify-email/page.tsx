"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/providers/SimpleAuthProvider";
import { sendEmailVerification } from "firebase/auth";
import { auth } from "@/lib/firebase.client";
import { useRouter } from "next/navigation";
import { CheckCircleIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";

export default function VerifyEmailPage() {
  const { user } = useAuth();
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (user?.emailVerified) {
      setIsVerified(true);
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/vc/dashboard');
      }, 2000);
    }
  }, [user, router]);

  const handleSendVerification = async () => {
    if (!user) return;
    
    setIsVerifying(true);
    setError("");
    
    try {
      await sendEmailVerification(user);
      alert("Verification email sent! Please check your inbox.");
    } catch (error: any) {
      console.error("Error sending verification email:", error);
      setError(error.message || "Failed to send verification email");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSkipVerification = () => {
    // Allow users to skip email verification for now
    router.push('/vc/dashboard');
  };

  if (!user) {
    return (
      <div 
        className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center"
        style={{
          backgroundImage: 'url("/worldmap.png")',
          filter: 'brightness(0.2) contrast(1.2) saturate(1.1)'
        }}
      >
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Please log in first</h1>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg transition-all duration-300 transform hover:scale-105"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (isVerified) {
    return (
      <div 
        className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center"
        style={{
          backgroundImage: 'url("/worldmap.png")',
          filter: 'brightness(0.2) contrast(1.2) saturate(1.1)'
        }}
      >
        <div className="text-center">
          <CheckCircleIcon className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-4">Email Verified!</h1>
          <p className="text-white/60 mb-6">Redirecting to your dashboard...</p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center p-4"
      style={{
        backgroundImage: 'url("/worldmap.png")',
        filter: 'brightness(0.2) contrast(1.2) saturate(1.1)'
      }}
    >
      <div className="max-w-md w-full">
        <div className="bg-black/90 border border-white/20 rounded-2xl p-8 shadow-2xl text-center">
          <ExclamationTriangleIcon className="w-16 h-16 text-yellow-400 mx-auto mb-6" />
          
          <h1 className="text-2xl font-bold text-white mb-4">Verify Your Email</h1>
          <p className="text-white/70 mb-6">
            We've sent a verification link to <strong>{user.email}</strong>. 
            Please check your inbox and click the link to verify your email address.
          </p>

          {error && (
            <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={handleSendVerification}
              disabled={isVerifying}
              className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isVerifying ? "Sending..." : "Resend Verification Email"}
            </button>

            <button
              onClick={handleSkipVerification}
              className="w-full px-6 py-3 bg-white/10 border border-white/20 text-white font-semibold rounded-xl hover:bg-white/20 transition-all duration-300"
            >
              Skip for Now
            </button>
          </div>

          <p className="text-white/50 text-sm mt-6">
            You can verify your email later in settings
          </p>
        </div>
      </div>
    </div>
  );
}
