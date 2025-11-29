"use client";

import React from 'react';

interface UnifiedLoadingScreenProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  showLogo?: boolean;
  className?: string;
}

export default function UnifiedLoadingScreen({
  message = 'Loading...',
  size = 'md',
  showLogo = true,
  className = ''
}: UnifiedLoadingScreenProps) {
  const sizeClasses = {
    sm: { spinner: 'w-8 h-8', text: 'text-sm', logo: 'w-12 h-12' },
    md: { spinner: 'w-12 h-12', text: 'text-base', logo: 'w-16 h-16' },
    lg: { spinner: 'w-16 h-16', text: 'text-lg', logo: 'w-20 h-20' }
  };

  const currentSize = sizeClasses[size];

  return (
    <div 
      className={`min-h-screen bg-black flex items-center justify-center ${className}`}
      style={{ backgroundColor: '#000000' }}
    >
      <div className="text-center">
        {showLogo && (
          <div className={`inline-flex items-center justify-center ${currentSize.logo} bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full mb-6 animate-pulse`}>
            <span className="text-2xl">🚀</span>
          </div>
        )}
        <div className={`animate-spin rounded-full border-2 border-cyan-500 border-t-transparent mx-auto mb-4 ${currentSize.spinner}`}></div>
        <p className={`text-white ${currentSize.text} animate-pulse`}>{message}</p>
      </div>
    </div>
  );
}

