'use client';

import React from 'react';
import { clsx } from 'clsx';

interface AccessibleInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'filled' | 'outlined';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const AccessibleInput: React.FC<AccessibleInputProps> = ({
  label,
  error,
  helperText,
  icon,
  variant = 'default',
  size = 'md',
  className,
  id,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = error ? `${inputId}-error` : undefined;
  const helperId = helperText ? `${inputId}-helper` : undefined;

  const baseClasses = [
    'w-full rounded-lg border transition-all duration-300',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'placeholder-gray-400'
  ];

  const variantClasses = {
    default: [
      'bg-gray-800/50 border-gray-600',
      'focus:border-blue-500 focus:ring-blue-500',
      'text-white'
    ],
    filled: [
      'bg-gray-700/50 border-gray-500',
      'focus:border-cyan-500 focus:ring-cyan-500',
      'text-white'
    ],
    outlined: [
      'bg-transparent border-2 border-white/20',
      'focus:border-cyan-400 focus:ring-cyan-500',
      'text-white'
    ]
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-6 py-4 text-lg'
  };

  const errorClasses = error ? [
    'border-red-500 focus:border-red-500 focus:ring-red-500'
  ] : [];

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-white/80 mb-2"
        >
          {label}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        
        <input
          id={inputId}
          className={clsx(
            baseClasses,
            variantClasses[variant],
            sizeClasses[size],
            errorClasses,
            icon ? 'pl-10' : '',
            className
          )}
          aria-describedby={clsx(helperId, errorId)}
          aria-invalid={error ? 'true' : 'false'}
          {...props}
        />
      </div>
      
      {error && (
        <p
          id={errorId}
          className="mt-1 text-sm text-red-400"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p
          id={helperId}
          className="mt-1 text-sm text-white/60"
        >
          {helperText}
        </p>
      )}
    </div>
  );
};

export default AccessibleInput;