"use client";

import React, { useState, useEffect } from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon, ClockIcon } from '@heroicons/react/24/outline';

interface RealtimeStatusProps {
  className?: string;
}

export default function RealtimeStatus({ className = '' }: RealtimeStatusProps) {
  const [status, setStatus] = useState<'active' | 'inactive' | 'testing'>('inactive');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [data, setData] = useState({
    users: 0,
    projects: 0,
    spotlights: 0,
    pendingKYC: 0,
    pendingKYB: 0
  });

  useEffect(() => {
    const setupRealtimeMonitoring = async () => {
      try {
        setStatus('testing');
        const { db } = await import('@/lib/firebase.client');
        const { collection, onSnapshot, query, where } = await import('firebase/firestore');
        
        if (!db) {
          console.error('Database not available');
          setStatus('inactive');
          return;
        }
        
        console.log('🔄 Setting up real-time monitoring...');
        
        // Listen for user count changes
        const usersUnsubscribe = onSnapshot(collection(db!, 'users'), (snapshot) => {
          setData(prev => ({ ...prev, users: snapshot.size }));
          setStatus('active');
          setLastUpdate(new Date());
        });

        // Listen for project count changes
        const projectsUnsubscribe = onSnapshot(collection(db!, 'projects'), (snapshot) => {
          setData(prev => ({ ...prev, projects: snapshot.size }));
          setLastUpdate(new Date());
        });

        // Listen for spotlight count changes
        const spotlightsUnsubscribe = onSnapshot(collection(db!, 'spotlights'), (snapshot) => {
          setData(prev => ({ ...prev, spotlights: snapshot.size }));
          setLastUpdate(new Date());
        });

        // Listen for pending KYC
        const kycUnsubscribe = onSnapshot(
          query(collection(db!, 'users'), where('kycStatus', '==', 'pending')), 
          (snapshot) => {
            setData(prev => ({ ...prev, pendingKYC: snapshot.size }));
            setLastUpdate(new Date());
          }
        );

        // Listen for pending KYB
        const kybUnsubscribe = onSnapshot(
          query(collection(db!, 'organizations'), where('kybStatus', '==', 'pending')), 
          (snapshot) => {
            setData(prev => ({ ...prev, pendingKYB: snapshot.size }));
            setLastUpdate(new Date());
          }
        );

        // Cleanup function
        return () => {
          usersUnsubscribe();
          projectsUnsubscribe();
          spotlightsUnsubscribe();
          kycUnsubscribe();
          kybUnsubscribe();
        };
      } catch (error) {
        console.error('❌ Error setting up real-time monitoring:', error);
        setStatus('inactive');
      }
    };

    setupRealtimeMonitoring();
  }, []);

  const getStatusIcon = () => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon className="w-4 h-4 text-green-400" />;
      case 'testing':
        return <ClockIcon className="w-4 h-4 text-yellow-400 animate-spin" />;
      case 'inactive':
        return <ExclamationTriangleIcon className="w-4 h-4 text-red-400" />;
      default:
        return <ClockIcon className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'active':
        return 'Real-time Active';
      case 'testing':
        return 'Connecting...';
      case 'inactive':
        return 'Offline';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'active':
        return 'text-green-400';
      case 'testing':
        return 'text-yellow-400';
      case 'inactive':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className={`flex items-center gap-3 px-4 py-3 bg-gray-800 rounded-xl border border-gray-600 ${className}`}>
      <div className="flex items-center gap-2">
        {getStatusIcon()}
        <span className={`text-sm font-semibold ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      </div>
      
      {/* Live Data Indicators */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
          <span className="text-xs text-gray-300">{data.users} Users</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
          <span className="text-xs text-gray-300">{data.projects} Projects</span>
        </div>
        {(data.pendingKYC > 0 || data.pendingKYB > 0) && (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-yellow-400">
              {data.pendingKYC + data.pendingKYB} Pending
            </span>
          </div>
        )}
      </div>
      
      {lastUpdate && (
        <div className="flex items-center gap-1">
          <ClockIcon className="w-3 h-3 text-gray-400" />
          <span className="text-xs text-gray-400">
            {lastUpdate.toLocaleTimeString()}
          </span>
        </div>
      )}
    </div>
  );
}
