"use client";

import React from 'react';

interface StandardLoadingProps {
  title?: string;
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

const StandardLoading: React.FC<StandardLoadingProps> = ({
  title = "Loading",
  message = "Please wait while we load your data...",
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-16 w-16',
    lg: 'h-24 w-24'
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  return (
    <div className="min-h-screen relative neo-blue-background flex items-center justify-center">
      <div className="neo-glass-card rounded-2xl p-8">
        <div className="text-center">
          <div className={`animate-spin rounded-full border-b-2 border-blue-500 mx-auto mb-4 ${sizeClasses[size]}`}></div>
          <h2 className={`font-semibold text-white mb-2 ${textSizeClasses[size]}`}>{title}</h2>
          <p className="text-white/60">{message}</p>
        </div>
      </div>
    </div>
  );
};

export default StandardLoading;
