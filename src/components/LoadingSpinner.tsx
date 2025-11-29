"use client";

import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'blue' | 'white' | 'green' | 'purple';
  message?: string;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'blue',
  message,
  className = ''
}) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const colors = {
    blue: 'border-blue-500',
    white: 'border-white',
    green: 'border-green-500',
    purple: 'border-purple-500'
  };

  return (
    <div 
      className={`flex flex-col items-center justify-center min-h-screen bg-black ${className}`}
      style={{ backgroundColor: '#000000', background: '#000000' }}
    >
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full mb-6 animate-pulse">
          <span className="text-2xl">🚀</span>
        </div>
        <div
          className={`
            ${sizes[size]}
            border-2
            border-cyan-500
            border-t-transparent
            rounded-full
            animate-spin
            mx-auto
            mb-4
          `}
        />
        {message && (
          <p className={`text-white ${size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-lg' : 'text-base'} animate-pulse`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default LoadingSpinner;
