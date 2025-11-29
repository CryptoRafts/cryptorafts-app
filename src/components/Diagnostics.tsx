"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { getRuntimeConfig } from '@/lib/runtime-config';
import { listenerManager } from '@/lib/firestore-listener-manager';
import { authTestRunner } from '@/lib/auth-test-utils';

interface DiagnosticsProps {
  show?: boolean;
}

export default function Diagnostics({ show = false }: DiagnosticsProps) {
  const { user, isLoading, isAuthenticated, claims } = useAuth();
  const [runtimeInfo, setRuntimeInfo] = useState<any>(null);
  const [listeners, setListeners] = useState<any[]>([]);
  const [testResults, setTestResults] = useState<any[]>([]);

  useEffect(() => {
    try {
      const config = getRuntimeConfig();
      setRuntimeInfo(config);
    } catch (error) {
      console.error('Failed to get runtime config:', error);
    }
  }, []);

  useEffect(() => {
    const updateListeners = () => {
      setListeners(listenerManager.getActiveListeners());
    };

    const runTests = async () => {
      try {
        const results = await authTestRunner.runAllTests();
        setTestResults(results);
      } catch (error) {
        console.error('Failed to run auth tests:', error);
      }
    };

    updateListeners();
    runTests();
    
    const interval = setInterval(updateListeners, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!show && process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/90 text-white text-xs p-3 rounded-lg max-w-sm z-50">
      <div className="font-bold mb-2">🔍 Diagnostics</div>
      
      <div className="space-y-1">
        <div>
          <strong>Auth:</strong> {isLoading ? 'Loading...' : isAuthenticated ? '✅' : '❌'}
        </div>
        
        {user && (
          <div>
            <strong>User:</strong> {user.uid?.substring(0, 8)}...
          </div>
        )}
        
        {claims && (
          <div>
            <strong>Role:</strong> {claims.role || 'none'}
          </div>
        )}
        
        {runtimeInfo && (
          <div>
            <strong>Runtime:</strong> {runtimeInfo.isClient ? 'Client' : 'Server'}
          </div>
        )}
        
        <div>
          <strong>Listeners:</strong> {listeners.length}
        </div>
        
        <div>
          <strong>Tests:</strong> {testResults.filter(r => r.success).length}/{testResults.length}
        </div>
        
        {listeners.length > 0 && (
          <div className="text-xs">
            {listeners.map((listener, index) => (
              <div key={index} className="truncate">
                {listener.key}: {listener.path}
              </div>
            ))}
          </div>
        )}
        
        {testResults.length > 0 && (
          <div className="text-xs">
            {testResults.map((result, index) => (
              <div key={index} className={result.success ? 'text-green-400' : 'text-red-400'}>
                {result.scenario}: {result.success ? '✅' : '❌'}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
