"use client";

import React from 'react';

interface SkeletonLoaderProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular' | 'card' | 'list' | 'table';
  width?: string | number;
  height?: string | number;
  lines?: number;
}

export default function SkeletonLoader({ 
  className = '', 
  variant = 'rectangular',
  width,
  height,
  lines = 1
}: SkeletonLoaderProps) {
  const baseClasses = 'animate-pulse bg-white/10 rounded';
  
  if (variant === 'text') {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`${baseClasses} h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
            style={{ width }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'circular') {
    return (
      <div
        className={`${baseClasses} rounded-full`}
        style={{ width: width || height || '40px', height: height || width || '40px' }}
      />
    );
  }

  if (variant === 'card') {
    return (
      <div className={`${baseClasses} p-6 space-y-4 ${className}`}>
        <div className="flex items-center space-x-4">
          <div className={`${baseClasses} w-12 h-12 rounded-full`} />
          <div className="space-y-2 flex-1">
            <div className={`${baseClasses} h-4 w-3/4`} />
            <div className={`${baseClasses} h-3 w-1/2`} />
          </div>
        </div>
        <div className="space-y-2">
          <div className={`${baseClasses} h-4 w-full`} />
          <div className={`${baseClasses} h-4 w-5/6`} />
          <div className={`${baseClasses} h-4 w-4/6`} />
        </div>
        <div className="flex space-x-2">
          <div className={`${baseClasses} h-8 w-20`} />
          <div className={`${baseClasses} h-8 w-16`} />
        </div>
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className={`space-y-4 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-4">
            <div className={`${baseClasses} w-10 h-10 rounded-full`} />
            <div className="flex-1 space-y-2">
              <div className={`${baseClasses} h-4 w-1/3`} />
              <div className={`${baseClasses} h-3 w-2/3`} />
            </div>
            <div className={`${baseClasses} h-8 w-16`} />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className={`space-y-2 ${className}`}>
        {/* Header */}
        <div className="flex space-x-4 p-4 border-b border-white/10">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={`${baseClasses} h-4 flex-1`} />
          ))}
        </div>
        {/* Rows */}
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="flex space-x-4 p-4">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className={`${baseClasses} h-4 flex-1`} />
            ))}
          </div>
        ))}
      </div>
    );
  }

  // Default rectangular
  return (
    <div
      className={`${baseClasses} ${className}`}
      style={{ 
        width: width || '100%', 
        height: height || '20px' 
      }}
    />
  );
}

// Specialized skeleton components
export function ProjectCardSkeleton() {
  return (
    <div className="glass rounded-2xl p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <SkeletonLoader variant="text" lines={2} className="h-6 w-3/4" />
          <SkeletonLoader variant="text" lines={1} className="h-4 w-1/2" />
        </div>
        <SkeletonLoader variant="circular" width={40} height={40} />
      </div>
      <SkeletonLoader variant="text" lines={3} />
      <div className="flex space-x-2">
        <SkeletonLoader width={60} height={24} />
        <SkeletonLoader width={80} height={24} />
        <SkeletonLoader width={70} height={24} />
      </div>
    </div>
  );
}

export function UserProfileSkeleton() {
  return (
    <div className="flex items-center space-x-4">
      <SkeletonLoader variant="circular" width={60} height={60} />
      <div className="space-y-2 flex-1">
        <SkeletonLoader width="60%" height={20} />
        <SkeletonLoader width="40%" height={16} />
        <SkeletonLoader width="50%" height={14} />
      </div>
    </div>
  );
}

export function DealRoomSkeleton() {
  return (
    <div className="glass rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <SkeletonLoader width="50%" height={24} />
        <SkeletonLoader width={80} height={32} />
      </div>
      <SkeletonLoader variant="text" lines={2} />
      <div className="flex items-center space-x-4">
        <SkeletonLoader variant="circular" width={32} height={32} />
        <SkeletonLoader variant="circular" width={32} height={32} />
        <SkeletonLoader variant="circular" width={32} height={32} />
        <SkeletonLoader width={60} height={20} />
      </div>
    </div>
  );
}

export function ChatMessageSkeleton() {
  return (
    <div className="flex space-x-3 p-4">
      <SkeletonLoader variant="circular" width={40} height={40} />
      <div className="flex-1 space-y-2">
        <div className="flex items-center space-x-2">
          <SkeletonLoader width={100} height={16} />
          <SkeletonLoader width={60} height={14} />
        </div>
        <SkeletonLoader variant="text" lines={2} />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass rounded-2xl p-6 space-y-4">
            <SkeletonLoader width="60%" height={16} />
            <SkeletonLoader width="80%" height={32} />
            <SkeletonLoader width="40%" height={14} />
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass rounded-2xl p-6 space-y-4">
          <SkeletonLoader width="40%" height={20} />
          <SkeletonLoader variant="list" lines={5} />
        </div>
        <div className="glass rounded-2xl p-6 space-y-4">
          <SkeletonLoader width="40%" height={20} />
          <SkeletonLoader variant="list" lines={5} />
        </div>
      </div>
    </div>
  );
}
