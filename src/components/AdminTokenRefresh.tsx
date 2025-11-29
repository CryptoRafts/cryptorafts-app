"use client";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase.client";
import { useAuth } from '@/providers/SimpleAuthProvider';

export default function AdminTokenRefresh() {
  const { user } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [message, setMessage] = useState("");

  const refreshToken = async () => {
    if (!user) return;
    
    setIsRefreshing(true);
    setMessage("Refreshing token...");
    
    try {
      // Force refresh the ID token to get updated claims
      await auth.currentUser?.getIdToken(true);
      setMessage("✅ Token refreshed! Claims should be updated now.");
      
      // Reload the page to ensure all components get the new claims
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      console.error("Error refreshing token:", error);
      setMessage("❌ Failed to refresh token");
    } finally {
      setIsRefreshing(false);
    }
  };

  const fixAdminPermissions = async () => {
    if (!user?.email) return;
    
    setIsRefreshing(true);
    setMessage("Setting admin permissions...");
    
    try {
      const response = await fetch("/api/fix-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: user.email }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setMessage("✅ Admin permissions set! Refreshing token...");
        // Refresh token after setting permissions
        await auth.currentUser?.getIdToken(true);
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setMessage(`❌ Failed: ${result.error}`);
      }
    } catch (error) {
      console.error("Error setting admin permissions:", error);
      setMessage("❌ Failed to set admin permissions");
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!user) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 max-w-sm">
      <h3 className="text-white font-semibold mb-2">Admin Token Tools</h3>
      <p className="text-white/70 text-sm mb-3">
        If you're having permission issues, try these tools:
      </p>
      
      <div className="space-y-2">
        <button
          onClick={refreshToken}
          disabled={isRefreshing}
          className="w-full px-3 py-2 bg-blue-500/20 text-blue-400 rounded text-sm hover:bg-blue-500/30 disabled:opacity-50"
        >
          {isRefreshing ? "Refreshing..." : "Refresh Token"}
        </button>
        
        <button
          onClick={fixAdminPermissions}
          disabled={isRefreshing}
          className="w-full px-3 py-2 bg-green-500/20 text-green-400 rounded text-sm hover:bg-green-500/30 disabled:opacity-50"
        >
          {isRefreshing ? "Setting..." : "Fix Admin Permissions"}
        </button>
      </div>
      
      {message && (
        <p className="text-xs mt-2 text-white/60">{message}</p>
      )}
    </div>
  );
}
