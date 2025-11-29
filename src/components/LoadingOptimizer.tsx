"use client";
import { useEffect, useState } from 'react';

export default function LoadingOptimizer() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Mark as loaded immediately - don't block UI
    setIsLoaded(true);
  }, []);

  if (!isLoaded) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100]">
        <div className="glass p-12 rounded-3xl text-center max-w-md mx-4">
          {/* Logo/Brand */}
          <div className="mb-6">
            <div className="text-4xl font-bold text-white mb-2">
              Cryptorafts
            </div>
            <div className="text-cyan-400 text-sm font-medium">
              Pitch • Invest • Build • Verify
            </div>
          </div>
          
          {/* Loading Animation */}
          <div className="w-16 h-16 border-4 border-white/20 border-t-cyan-400 rounded-full animate-spin mx-auto mb-6"></div>
          
          {/* Welcome Message */}
          <div className="space-y-3">
            <div className="text-xl font-semibold text-white">
              Welcome to Cryptorafts
            </div>
            <div className="text-white/70 text-sm leading-relaxed">
              Your gateway to the future of crypto innovation. 
              Connecting founders, investors, and builders in one unified platform.
            </div>
          </div>
          
          {/* Loading Status */}
          <div className="mt-6 text-cyan-400/80 text-xs">
            Initializing your experience...
          </div>
        </div>
      </div>
    );
  }

  return null;
}
