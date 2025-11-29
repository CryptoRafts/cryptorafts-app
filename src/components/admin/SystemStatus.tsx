"use client";

import React, { useState, useEffect } from 'react';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  ClockIcon,
  ShieldCheckIcon,
  BoltIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface SystemStatusProps {
  className?: string;
}

export default function SystemStatus({ className = '' }: SystemStatusProps) {
  const [status, setStatus] = useState<'online' | 'offline' | 'maintenance'>('online');
  const [uptime, setUptime] = useState(0);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());

  useEffect(() => {
    // Simulate system status monitoring
    const interval = setInterval(() => {
      setLastCheck(new Date());
      setUptime(prev => prev + 1);
      
      // Simulate occasional status changes for demo
      if (Math.random() < 0.01) { // 1% chance
        setStatus('maintenance');
        setTimeout(() => setStatus('online'), 5000);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = () => {
    switch (status) {
      case 'online':
        return <CheckCircleIcon className="w-4 h-4 text-green-400" />;
      case 'maintenance':
        return <ExclamationTriangleIcon className="w-4 h-4 text-yellow-400" />;
      case 'offline':
        return <ExclamationTriangleIcon className="w-4 h-4 text-red-400" />;
      default:
        return <ClockIcon className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'online':
        return 'System Online';
      case 'maintenance':
        return 'Maintenance Mode';
      case 'offline':
        return 'System Offline';
      default:
        return 'Unknown Status';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'online':
        return 'text-green-400';
      case 'maintenance':
        return 'text-yellow-400';
      case 'offline':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`flex items-center gap-3 px-4 py-3 bg-gray-800 rounded-xl border border-gray-600 ${className}`}>
      <div className="flex items-center gap-2">
        {getStatusIcon()}
        <span className={`text-sm font-semibold ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      </div>
      
      {/* System Metrics */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <BoltIcon className="w-3 h-3 text-blue-400" />
          <span className="text-xs text-gray-300">Uptime: {formatUptime(uptime)}</span>
        </div>
        
        <div className="flex items-center gap-1">
          <ChartBarIcon className="w-3 h-3 text-green-400" />
          <span className="text-xs text-gray-300">Performance: 99.9%</span>
        </div>
        
        <div className="flex items-center gap-1">
          <ShieldCheckIcon className="w-3 h-3 text-purple-400" />
          <span className="text-xs text-gray-300">Security: Active</span>
        </div>
      </div>
      
      <div className="flex items-center gap-1">
        <ClockIcon className="w-3 h-3 text-gray-400" />
        <span className="text-xs text-gray-400">
          Last check: {lastCheck.toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}
