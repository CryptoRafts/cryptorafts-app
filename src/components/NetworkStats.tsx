import React from 'react';

interface NetworkStatsProps {
  className?: string;
}

const NetworkStats: React.FC<NetworkStatsProps> = ({ className = '' }) => {
  return (
    <div className={`animate-pulse bg-gray-200 h-64 rounded-lg ${className}`}>
      <div className="p-4">
        <div className="h-4 bg-gray-300 rounded mb-2"></div>
        <div className="h-4 bg-gray-300 rounded mb-2 w-3/4"></div>
        <div className="h-4 bg-gray-300 rounded w-1/2"></div>
      </div>
    </div>
  );
};

export default NetworkStats;

