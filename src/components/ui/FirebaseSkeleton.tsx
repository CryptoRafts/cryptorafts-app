"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface FirebaseSkeletonProps {
  variant?: 'text' | 'card' | 'avatar' | 'button' | 'image' | 'table' | 'list';
  count?: number;
  className?: string;
  width?: string | number;
  height?: string | number;
  circle?: boolean;
}

const FirebaseSkeleton: React.FC<FirebaseSkeletonProps> = ({
  variant = 'text',
  count = 1,
  className = '',
  width,
  height,
  circle = false
}) => {
  const skeletonVariants = {
    text: 'h-4 w-full rounded',
    card: 'h-48 w-full rounded-xl',
    avatar: 'h-12 w-12 rounded-full',
    button: 'h-11 w-32 rounded-lg',
    image: 'h-64 w-full rounded-lg',
    table: 'h-8 w-full rounded',
    list: 'h-16 w-full rounded-lg'
  };

  const baseClass = skeletonVariants[variant];

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          className={`
            relative overflow-hidden
            bg-gradient-to-r from-white/5 via-white/10 to-white/5
            ${circle ? 'rounded-full' : baseClass}
            ${className}
          `}
          style={{
            width: width || undefined,
            height: height || undefined
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
        >
          {/* Shimmer Effect */}
          <motion.div
            className="absolute inset-0 -translate-x-full"
            animate={{
              translateX: ['(-100%)', '100%']
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'linear',
              repeatDelay: 0.5
            }}
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(56, 189, 248, 0.1), transparent)'
            }}
          />

          {/* Pulse Animation */}
          <motion.div
            className="absolute inset-0 bg-white/5"
            animate={{
              opacity: [0.5, 0.8, 0.5]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        </motion.div>
      ))}
      
      {/* Respect prefers-reduced-motion */}
      <style jsx>{`
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </>
  );
};

// Preset Skeletons for Common Use Cases
export const TextSkeleton: React.FC<{ lines?: number; className?: string }> = ({ 
  lines = 3, 
  className = '' 
}) => (
  <div className={`space-y-3 ${className}`}>
    <FirebaseSkeleton variant="text" count={lines} />
  </div>
);

export const CardSkeleton: React.FC<{ count?: number; className?: string }> = ({ 
  count = 1, 
  className = '' 
}) => (
  <div className={`grid gap-6 ${className}`}>
    <FirebaseSkeleton variant="card" count={count} />
  </div>
);

export const AvatarSkeleton: React.FC<{ size?: number; className?: string }> = ({ 
  size = 48, 
  className = '' 
}) => (
  <FirebaseSkeleton 
    variant="avatar" 
    circle 
    width={size} 
    height={size} 
    className={className} 
  />
);

export const TableSkeleton: React.FC<{ rows?: number; columns?: number; className?: string }> = ({ 
  rows = 5, 
  columns = 4,
  className = '' 
}) => (
  <div className={`space-y-3 ${className}`}>
    {/* Header */}
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {Array.from({ length: columns }).map((_, i) => (
        <FirebaseSkeleton key={`header-${i}`} variant="text" height={32} />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={`row-${rowIndex}`} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, colIndex) => (
          <FirebaseSkeleton key={`cell-${rowIndex}-${colIndex}`} variant="text" height={24} />
        ))}
      </div>
    ))}
  </div>
);

export const ListSkeleton: React.FC<{ items?: number; className?: string }> = ({ 
  items = 5, 
  className = '' 
}) => (
  <div className={`space-y-4 ${className}`}>
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} className="flex items-center gap-4">
        <AvatarSkeleton size={40} />
        <div className="flex-1 space-y-2">
          <FirebaseSkeleton variant="text" width="70%" height={16} />
          <FirebaseSkeleton variant="text" width="40%" height={12} />
        </div>
      </div>
    ))}
  </div>
);

export const DashboardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`space-y-6 ${className}`}>
    {/* Header */}
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <FirebaseSkeleton variant="text" width={200} height={32} />
        <FirebaseSkeleton variant="text" width={300} height={16} />
      </div>
      <FirebaseSkeleton variant="button" />
    </div>

    {/* Stats Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="glass-panel p-6 space-y-3">
          <FirebaseSkeleton variant="text" width="60%" height={16} />
          <FirebaseSkeleton variant="text" width="40%" height={32} />
        </div>
      ))}
    </div>

    {/* Main Content */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Large Card */}
      <div className="lg:col-span-2">
        <CardSkeleton />
      </div>
      {/* Sidebar */}
      <div className="space-y-4">
        <ListSkeleton items={3} />
      </div>
    </div>
  </div>
);

export default FirebaseSkeleton;

