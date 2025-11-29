"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/providers/SimpleAuthProvider";
import { useRouter } from "next/navigation";
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  ArrowLeftIcon
} from "@heroicons/react/24/outline";

export default function OnboardingFlow() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      // Simulate loading user data
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    } else if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Error Loading Profile</h2>
          <p className="text-white/70 mb-4">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => router.push('/')}
              className="flex items-center space-x-2 text-white/60 hover:text-white transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              <span>Back to Home</span>
            </button>
            <div className="text-sm text-white/60">
              Welcome, {user.email}
            </div>
          </div>

          <h1 className="text-3xl font-bold text-white text-center">
            Welcome to Cryptorafts!
          </h1>
          <p className="text-white/70 text-center mt-4">
            Let's get you set up with your founder profile
          </p>
        </div>

        {/* Onboarding Content */}
        <div className="bg-white/5 backdrop-blur-lg rounded-xl p-8 border border-white/10">
          <div className="text-center">
            <CheckCircleIcon className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Onboarding Coming Soon!</h2>
            <p className="text-white/70 mb-6">
              The complete onboarding flow is being prepared. For now, you can access your dashboard.
            </p>
            <button
              onClick={() => router.push('/founder/dashboard')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
