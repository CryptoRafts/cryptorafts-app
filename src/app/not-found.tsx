"use client";

import Link from "next/link";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center neo-blue-background">
      <div className="max-w-md mx-auto text-center">
        <div className="neo-glass-card rounded-2xl p-8">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-blue-500/20 flex items-center justify-center">
            <MagnifyingGlassIcon className="w-8 h-8 text-blue-400" />
          </div>
          
          <h1 className="text-4xl font-bold text-white mb-4">404</h1>
          
          <h2 className="text-xl font-semibold text-white mb-4">Page Not Found</h2>
          
          <p className="text-white/70 mb-6">
            Sorry, we couldn't find the page you're looking for. It might have been moved, deleted, or you entered the wrong URL.
          </p>
          
          <div className="space-y-3">
            <Link
              href="/"
              className="block w-full btn-neon-primary"
            >
              Go Home
            </Link>
            
            <button
              onClick={() => window.history.back()}
              className="w-full btn-neon-secondary"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
