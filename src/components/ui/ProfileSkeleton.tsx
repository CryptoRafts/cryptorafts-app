"use client";

import React from 'react';

interface ProfileSkeletonProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

const ProfileSkeleton: React.FC<ProfileSkeletonProps> = ({ 
  size = 'md', 
  showText = true 
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const textSizeClasses = {
    sm: 'h-3 w-16',
    md: 'h-4 w-20',
    lg: 'h-4 w-24'
  };

  return (
    <div className="flex items-center gap-3">
      {/* Profile Photo Skeleton */}
      <div className={`${sizeClasses[size]} bg-white/10 rounded-full flex items-center justify-center ring-2 ring-cyan-400/20 animate-pulse`}>
        <div className="w-6 h-6 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin"></div>
      </div>
      
      {/* Text Skeleton */}
      {showText && (
        <div className="flex flex-col gap-1">
          <div className={`${textSizeClasses[size]} bg-white/20 rounded animate-pulse`}></div>
          <div className="h-3 w-12 bg-cyan-400/20 rounded animate-pulse"></div>
        </div>
      )}
    </div>
  );
};

export default ProfileSkeleton;
