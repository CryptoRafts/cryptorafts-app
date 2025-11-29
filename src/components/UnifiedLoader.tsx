import React from 'react';
import { motion } from 'framer-motion';

interface UnifiedLoaderProps {
  type?: 'skeleton' | 'spinner' | 'text';
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string;
}

const UnifiedLoader: React.FC<UnifiedLoaderProps> = ({
  type = 'spinner',
  size = 'md',
  message = 'Loading...',
  className = ''
}) => {
  const sizeClasses = {
    sm: {
      spinner: 'h-6 w-6',
      skeleton: 'h-4',
      text: 'text-sm'
    },
    md: {
      spinner: 'h-12 w-12',
      skeleton: 'h-6',
      text: 'text-base'
    },
    lg: {
      spinner: 'h-16 w-16',
      skeleton: 'h-8',
      text: 'text-lg'
    }
  };

  if (type === 'skeleton') {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className={`bg-white/10 rounded-lg ${sizeClasses[size].skeleton}`}></div>
      </div>
    );
  }

  if (type === 'spinner') {
    return (
      <div className={`flex flex-col items-center justify-center ${className}`}>
        <motion.div
          className={`animate-spin rounded-full border-b-2 border-blue-500 ${sizeClasses[size].spinner}`}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        {message && (
          <p className={`text-white/60 mt-4 ${sizeClasses[size].text}`}>
            {message}
          </p>
        )}
      </div>
    );
  }

  if (type === 'text') {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <motion.div
          className="flex items-center space-x-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex space-x-1">
            <motion.div
              className="w-2 h-2 bg-blue-500 rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
            />
            <motion.div
              className="w-2 h-2 bg-blue-500 rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
            />
            <motion.div
              className="w-2 h-2 bg-blue-500 rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
            />
          </div>
          <span className={`text-white/60 ${sizeClasses[size].text}`}>
            {message}
          </span>
        </motion.div>
      </div>
    );
  }

  return null;
};

// Skeleton loaders for specific use cases
export const ChatMessageSkeleton: React.FC = () => (
  <div className="flex space-x-3 p-4">
    <div className="w-8 h-8 bg-white/10 rounded-full animate-pulse"></div>
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-white/10 rounded animate-pulse w-1/4"></div>
      <div className="h-4 bg-white/10 rounded animate-pulse w-3/4"></div>
      <div className="h-4 bg-white/10 rounded animate-pulse w-1/2"></div>
    </div>
  </div>
);

export const ProjectCardSkeleton: React.FC = () => (
  <div className="bg-white/5 rounded-xl p-6 animate-pulse">
    <div className="flex items-center space-x-4 mb-4">
      <div className="w-12 h-12 bg-white/10 rounded-lg"></div>
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-white/10 rounded w-3/4"></div>
        <div className="h-3 bg-white/10 rounded w-1/2"></div>
      </div>
    </div>
    <div className="space-y-2 mb-4">
      <div className="h-4 bg-white/10 rounded"></div>
      <div className="h-4 bg-white/10 rounded w-5/6"></div>
    </div>
    <div className="flex justify-between items-center">
      <div className="h-6 bg-white/10 rounded w-20"></div>
      <div className="h-8 bg-white/10 rounded w-24"></div>
    </div>
  </div>
);

export const TableRowSkeleton: React.FC<{ columns: number }> = ({ columns }) => (
  <tr className="animate-pulse">
    {Array.from({ length: columns }).map((_, i) => (
      <td key={i} className="px-4 py-3">
        <div className="h-4 bg-white/10 rounded"></div>
      </td>
    ))}
  </tr>
);

// Page-level loader
export const PageLoader: React.FC<{ message?: string }> = ({ 
  message = "Loading page..." 
}) => (
  <div className="min-h-screen flex items-center justify-center bg-black/20">
    <UnifiedLoader type="spinner" size="lg" message={message} />
  </div>
);

// Component-level loader
export const ComponentLoader: React.FC<{ message?: string }> = ({ 
  message = "Loading..." 
}) => (
  <div className="flex items-center justify-center p-8">
    <UnifiedLoader type="spinner" size="md" message={message} />
  </div>
);

// Inline loader
export const InlineLoader: React.FC<{ message?: string }> = ({ 
  message = "Loading..." 
}) => (
  <div className="flex items-center justify-center py-4">
    <UnifiedLoader type="text" size="sm" message={message} />
  </div>
);

export default UnifiedLoader;
