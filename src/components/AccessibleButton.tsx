'use client';

import React from 'react';
import { clsx } from 'clsx';

interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className,
  disabled,
  ...props
}) => {
  const baseClasses = [
    'inline-flex items-center justify-center',
    'font-medium rounded-lg',
    'transition-all duration-300',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'relative overflow-hidden'
  ];

  const variantClasses = {
    primary: [
      'bg-gradient-to-r from-blue-600 to-cyan-600',
      'hover:from-blue-700 hover:to-cyan-700',
      'text-white shadow-lg shadow-blue-500/25',
      'focus:ring-blue-500',
      'transform hover:scale-105'
    ],
    secondary: [
      'bg-white/10 hover:bg-white/20',
      'text-white border border-white/20',
      'focus:ring-white/50'
    ],
    outline: [
      'bg-transparent hover:bg-white/10',
      'text-white border-2 border-white/30',
      'hover:border-cyan-400/50',
      'focus:ring-cyan-500',
      'transform hover:scale-105'
    ],
    ghost: [
      'bg-transparent hover:bg-white/10',
      'text-white',
      'focus:ring-white/50'
    ],
    danger: [
      'bg-gradient-to-r from-red-600 to-rose-600',
      'hover:from-red-700 hover:to-rose-700',
      'text-white shadow-lg shadow-red-500/25',
      'focus:ring-red-500',
      'transform hover:scale-105'
    ],
    success: [
      'bg-gradient-to-r from-green-600 to-emerald-600',
      'hover:from-green-700 hover:to-emerald-700',
      'text-white shadow-lg shadow-green-500/25',
      'focus:ring-green-500',
      'transform hover:scale-105'
    ]
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
    xl: 'px-8 py-4 text-xl'
  };

  const shimmerClasses = [
    'absolute inset-0',
    'bg-gradient-to-r from-transparent via-white/20 to-transparent',
    'transform -skew-x-12',
    'transition-all duration-500',
    'opacity-0 group-hover:opacity-100'
  ];

  return (
    <button
      className={clsx(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        'group',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {/* Shimmer effect */}
      <div className={clsx(shimmerClasses)} />
      
      {/* Content */}
      <span className="relative z-10 flex items-center gap-2">
        {loading ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          icon
        )}
        {children}
      </span>
    </button>
  );
};

export default AccessibleButton;