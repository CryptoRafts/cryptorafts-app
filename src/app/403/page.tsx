"use client";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/SimpleAuthProvider";
import { ShieldExclamationIcon } from "@heroicons/react/24/outline";

export default function ForbiddenPage() {
  const router = useRouter();
  const { claims } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center max-w-md mx-auto px-4">
        <ShieldExclamationIcon className="h-24 w-24 text-red-500 mx-auto mb-6" />
        
        <h1 className="text-6xl font-bold text-red-500 mb-4">403</h1>
        <h2 className="text-2xl font-semibold text-white mb-4">Access Denied</h2>
        
        <p className="text-white/80 mb-6">
          You don't have permission to access this resource.
        </p>
        
        {claims?.role && (
          <p className="text-white/60 mb-8">
            Your current role: <span className="font-semibold text-blue-400">{claims.role}</span>
          </p>
        )}
        
        <div className="space-y-4">
          <button
            onClick={() => router.push(`/${claims?.role || 'founder'}/dashboard`)}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            Go to Dashboard
          </button>
          
          <button
            onClick={() => router.push("/role")}
            className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Switch Role
          </button>
          
        </div>
      </div>
    </div>
  );
}
