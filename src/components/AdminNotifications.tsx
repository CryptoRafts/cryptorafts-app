"use client";

import React, { useState, useEffect } from 'react';
import { db, collection, query, where, getDocs, onSnapshot } from '@/lib/firebase.client';
import { BellIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

interface Notification {
  id: string;
  type: 'kyc' | 'kyb' | 'pitch';
  userId: string;
  userName: string;
  projectId?: string;
  projectName?: string;
  timestamp: string;
  priority: 'high' | 'medium' | 'low';
}

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!db) return;
    const dbInstance = db; // Capture for type narrowing
    
    loadNotifications();
    
    // Real-time listener for new notifications
    const unsubscribers: (() => void)[] = [];

    // Listen for pending KYC
    const kycQuery = query(
      collection(dbInstance, 'users'),
      where('kycStatus', '==', 'pending')
    );
    const unsubKyc = onSnapshot(kycQuery, () => {
      loadNotifications();
    });
    unsubscribers.push(unsubKyc);

    // Listen for pending KYB
    const kybQuery = query(
      collection(dbInstance, 'users'),
      where('kybStatus', '==', 'pending')
    );
    const unsubKyb = onSnapshot(kybQuery, () => {
      loadNotifications();
    });
    unsubscribers.push(unsubKyb);

    // Listen for pending projects
    const projectQuery = query(
      collection(dbInstance, 'projects'),
      where('status', '==', 'pending')
    );
    const unsubProjects = onSnapshot(projectQuery, () => {
      loadNotifications();
    });
    unsubscribers.push(unsubProjects);

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, []);

  const loadNotifications = async () => {
    if (!db) return;
    const dbInstance = db; // Capture for type narrowing
    
    try {
      const notifs: Notification[] = [];

      // Get pending KYC
      const kycQuery = query(
        collection(dbInstance, 'users'),
        where('kycStatus', '==', 'pending')
      );
      const kycSnapshot = await getDocs(kycQuery);
      kycSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.kyc) {
          notifs.push({
            id: `kyc-${doc.id}`,
            type: 'kyc',
            userId: doc.id,
            userName: data.display_name || data.email || 'Unknown User',
            timestamp: data.kyc.submittedAt || data.updatedAt || new Date().toISOString(),
            priority: 'high'
          });
        }
      });

      // Get pending KYB
      const kybQuery = query(
        collection(dbInstance, 'users'),
        where('kybStatus', '==', 'pending')
      );
      const kybSnapshot = await getDocs(kybQuery);
      kybSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.kyb) {
          notifs.push({
            id: `kyb-${doc.id}`,
            type: 'kyb',
            userId: doc.id,
            userName: data.organization_name || data.display_name || 'Unknown Organization',
            timestamp: data.kyb.submittedAt || data.updatedAt || new Date().toISOString(),
            priority: 'high'
          });
        }
      });

      // Get pending projects
      const projectQuery = query(
        collection(dbInstance, 'projects'),
        where('status', '==', 'pending')
      );
      const projectSnapshot = await getDocs(projectQuery);
      projectSnapshot.forEach(doc => {
        const data = doc.data();
        notifs.push({
          id: `pitch-${doc.id}`,
          type: 'pitch',
          userId: data.founderId || data.userId || '',
          userName: data.founder_name || 'Unknown Founder',
          projectId: doc.id,
          projectName: data.project_name || 'Unnamed Project',
          timestamp: data.submittedAt || data.createdAt || new Date().toISOString(),
          priority: 'medium'
        });
      });

      // Sort by timestamp (newest first)
      notifs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setNotifications(notifs);
      setUnreadCount(notifs.length);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'kyc':
        return '👤';
      case 'kyb':
        return '🏢';
      case 'pitch':
        return '🚀';
      default:
        return '📋';
    }
  };

  const getNotificationText = (notif: Notification) => {
    switch (notif.type) {
      case 'kyc':
        return `KYC verification waiting for ${notif.userName}`;
      case 'kyb':
        return `KYB verification waiting for ${notif.userName}`;
      case 'pitch':
        return `Pitch "${notif.projectName}" waiting approval from ${notif.userName}`;
      default:
        return 'New notification';
    }
  };

  const getNotificationLink = (notif: Notification) => {
    switch (notif.type) {
      case 'kyc':
        return '/admin/kyc';
      case 'kyb':
        return '/admin/kyb';
      case 'pitch':
        return '/admin/projects';
      default:
        return '/admin/dashboard';
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all duration-300"
        title="Notifications"
      >
        <BellIcon className="w-6 h-6 text-white" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-96 max-h-[600px] bg-gray-900 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold text-lg">
                  Pending Approvals
                </h3>
                <span className="text-white/60 text-sm">
                  {unreadCount} waiting
                </span>
              </div>
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto max-h-[500px]">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <CheckCircleIcon className="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <p className="text-white/60">All caught up!</p>
                  <p className="text-white/40 text-sm mt-1">No pending approvals</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {notifications.map((notif) => (
                    <Link
                      key={notif.id}
                      href={getNotificationLink(notif)}
                      onClick={() => setIsOpen(false)}
                      className="block p-4 hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-start space-x-3">
                        {/* Icon */}
                        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center text-xl">
                          {getNotificationIcon(notif.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium">
                            {getNotificationText(notif)}
                          </p>
                          <p className="text-white/40 text-xs mt-1">
                            {new Date(notif.timestamp).toLocaleString()}
                          </p>
                        </div>

                        {/* Priority Badge */}
                        {notif.priority === 'high' && (
                          <span className="flex-shrink-0 px-2 py-1 bg-red-500/20 text-red-400 text-xs font-semibold rounded-full">
                            URGENT
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-white/10">
                <Link
                  href="/admin/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="block text-center text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                >
                  View All in Dashboard
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

