'use client';

import React from 'react';

interface FastLoaderProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function FastLoader({ message = 'Loading...', size = 'md' }: FastLoaderProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black/20">
      <div className="text-center">
        <div className={`animate-spin rounded-full border-b-2 border-blue-500 mx-auto mb-4 ${sizeClasses[size]}`}></div>
        <p className={`text-white/80 ${textSizes[size]}`}>{message}</p>
      </div>
    </div>
  );
}
