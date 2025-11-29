"use client";

import { useState } from 'react';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { vcAuthManager } from '@/lib/vc-auth';

export default function VCOnboardingDebug() {
  const { user } = useAuth();
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [isDebugging, setIsDebugging] = useState(false);

  const debugVCUser = async () => {
    if (!user) {
      setDebugInfo('❌ No user logged in');
      return;
    }

    setIsDebugging(true);
    setDebugInfo('🔄 Debugging VC user data...\n');

    try {
      // Test 1: Get VC User
      setDebugInfo(prev => prev + '1. Getting VC user...\n');
      const vcUser = await vcAuthManager.getVCUser(user.uid);
      setDebugInfo(prev => prev + `✅ VC User: ${JSON.stringify(vcUser, null, 2)}\n\n`);

      // Test 2: Get Organization if exists (using fallback method)
      if (vcUser?.orgId) {
        setDebugInfo(prev => prev + '2. Getting VC organization...\n');
        try {
          const org = await vcAuthManager.getVCOrganization(vcUser.orgId);
          setDebugInfo(prev => prev + `✅ Organization: ${JSON.stringify(org, null, 2)}\n\n`);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          setDebugInfo(prev => prev + `⚠️ Organization collection failed: ${message}\n`);
          // Try fallback method
          const { vcAuthManagerFallback } = await import('@/lib/vc-auth-fallback');
          const userWithOrg = await vcAuthManagerFallback.getVCUserWithOrg(user.uid);
          setDebugInfo(prev => prev + `✅ Fallback Organization: ${JSON.stringify(userWithOrg?.organization, null, 2)}\n\n`);
        }
      } else {
        setDebugInfo(prev => prev + '2. No organization ID found\n\n');
      }

      // Test 3: Check if portal is unlocked (using fallback method)
      setDebugInfo(prev => prev + '3. Checking portal access...\n');
      try {
        const isUnlocked = await vcAuthManager.isVCPortalUnlocked(user.uid);
        setDebugInfo(prev => prev + `✅ Portal unlocked: ${isUnlocked}\n\n`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setDebugInfo(prev => prev + `⚠️ Portal check failed: ${message}\n`);
        // Try fallback method
        const { vcAuthManagerFallback } = await import('@/lib/vc-auth-fallback');
        const isUnlockedFallback = await vcAuthManagerFallback.isVCPortalUnlockedFallback(user.uid);
        setDebugInfo(prev => prev + `✅ Fallback Portal unlocked: ${isUnlockedFallback}\n\n`);
      }

      setDebugInfo(prev => prev + '🎉 Debug complete!');

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setDebugInfo(prev => prev + `❌ Error: ${message}\n`);
      console.error('Debug error:', error);
    } finally {
      setIsDebugging(false);
    }
  };

  return (
    <div className="p-4 bg-white/5 rounded-lg border border-white/10 space-y-4">
      <h3 className="text-lg font-semibold text-white">VC Onboarding Debug</h3>
      
      <button
        onClick={debugVCUser}
        disabled={isDebugging}
        className="w-full px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-500/50 text-white rounded-lg transition-colors"
      >
        {isDebugging ? 'Debugging...' : 'Debug VC User Data'}
      </button>
      
      {debugInfo && (
        <div className="p-3 bg-white/5 rounded-lg">
          <pre className="text-sm text-white/80 whitespace-pre-wrap">{debugInfo}</pre>
        </div>
      )}
    </div>
  );
}
