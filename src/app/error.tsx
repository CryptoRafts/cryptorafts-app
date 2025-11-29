"use client";

import { useEffect } from "react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center neo-blue-background">
      <div className="max-w-md mx-auto text-center">
        <div className="neo-glass-card rounded-2xl p-8">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
            <ExclamationTriangleIcon className="w-8 h-8 text-red-400" />
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-4">Something went wrong!</h1>
          
          <p className="text-white/70 mb-6">
            We encountered an unexpected error. Please try again or contact support if the problem persists.
          </p>
          
          <div className="space-y-3">
            <button
              onClick={reset}
              className="w-full btn-neon-primary"
            >
              Try again
            </button>
            
            <button
              onClick={() => window.location.href = '/'}
              className="w-full btn-neon-secondary"
            >
              Go Home
            </button>
          </div>
          
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-6 text-left">
              <summary className="text-sm text-white/50 cursor-pointer">
                Error Details (Development)
              </summary>
              <pre className="mt-2 text-xs text-red-300 bg-black/20 p-3 rounded overflow-auto">
                {error.message}
                {error.stack && `\n\n${error.stack}`}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
