"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ensureDb, waitForFirebase, createSnapshotErrorHandler } from '@/lib/firebase-utils';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
  ClipboardDocumentCheckIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  UserIcon,
  DocumentTextIcon,
  StarIcon,
  ShieldCheckIcon,
  BuildingOffice2Icon,
  RocketLaunchIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  CalendarIcon,
  FunnelIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface AuditLog {
  id: string;
  timestamp: any;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  action: string;
  resource: string;
  resourceId: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  status: 'success' | 'failure' | 'warning' | 'info';
  department?: string;
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  metadata?: {
    sessionId: string;
    requestId: string;
    duration: number;
  };
}

export default function AdminAuditLogPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    success: 0,
    failure: 0,
    warning: 0,
    info: 0,
    today: 0,
    thisWeek: 0,
    thisMonth: 0
  });

  useEffect(() => {
    // Check authentication
    const checkAuth = async () => {
      try {
        const { auth } = await import('@/lib/firebase.client');
        const { onAuthStateChanged } = await import('firebase/auth');
        
        if (auth) {
          onAuthStateChanged(auth, (user) => {
            if (user) {
              // STRICT ADMIN ACCESS: Only allow anasshamsiggc@gmail.com
              const userEmail = user.email?.toLowerCase() || '';
              if (userEmail !== 'anasshamsiggc@gmail.com') {
                console.log('❌ Access denied. Only anasshamsiggc@gmail.com can access admin panel.');
                alert('Access Denied: Only authorized admin can access this panel.');
                router.replace('/admin/login');
                setIsLoading(false);
                return;
              }
              
              const userRole = localStorage.getItem('userRole');
              if (userRole === 'admin' || userEmail === 'anasshamsiggc@gmail.com') {
                setUser(user);
                setupRealtimeUpdates();
              } else {
                router.replace('/admin/login');
              }
            } else {
              router.replace('/admin/login');
            }
            setIsLoading(false);
          });
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // Filter and search functionality
  useEffect(() => {
    let filtered = [...auditLogs];

    // Search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(log => 
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(log => log.status === statusFilter);
    }

    // Action filter
    if (actionFilter !== 'all') {
      filtered = filtered.filter(log => log.action.toLowerCase().includes(actionFilter.toLowerCase()));
    }

    // User filter
    if (userFilter !== 'all') {
      filtered = filtered.filter(log => log.userRole === userFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      filtered = filtered.filter(log => {
        const logDate = log.timestamp?.toDate ? log.timestamp.toDate() : new Date(log.timestamp);
        
        switch (dateFilter) {
          case 'today':
            return logDate >= today;
          case 'week':
            return logDate >= weekAgo;
          case 'month':
            return logDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    setFilteredLogs(filtered);
  }, [auditLogs, searchTerm, statusFilter, actionFilter, userFilter, dateFilter]);

  const setupRealtimeUpdates = async () => {
    try {
      console.log('🔄 Setting up real-time audit log updates...');
      
      const isReady = await waitForFirebase(5000);
      if (!isReady) {
        console.error('❌ Firebase not initialized');
        return;
      }
      
      const dbInstance = ensureDb();
      if (!dbInstance) {
        console.error('❌ Database not available');
        return;
      }
      
      const { onSnapshot, collection, query, orderBy } = await import('firebase/firestore');
      
      // Listen for audit log changes
      const auditLogsUnsubscribe = onSnapshot(
        query(collection(dbInstance, 'audit_logs'), orderBy('timestamp', 'desc')), 
        (snapshot) => {
          console.log('📊 [AUDIT] Real-time update received:', snapshot.docs.length, 'documents');
          
          const auditLogsData = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              timestamp: data.timestamp,
              userId: data.userId || '',
              userName: data.userName || 'Unknown User',
              userEmail: data.userEmail || 'N/A',
              userRole: data.userRole || 'unknown',
              action: data.action || 'Unknown Action',
              resource: data.resource || 'Unknown Resource',
              resourceId: data.resourceId || '',
              details: data.details || '',
              ipAddress: data.ipAddress || 'N/A',
              userAgent: data.userAgent || 'N/A',
              status: data.status || 'info',
              department: data.department,
              changes: data.changes || [],
              metadata: data.metadata || {}
            } as AuditLog;
          });
          
          setAuditLogs(auditLogsData);
          
          // Update stats
          const total = auditLogsData.length;
          const success = auditLogsData.filter(log => log.status === 'success').length;
          const failure = auditLogsData.filter(log => log.status === 'failure').length;
          const warning = auditLogsData.filter(log => log.status === 'warning').length;
          const info = auditLogsData.filter(log => log.status === 'info').length;
          
          // Calculate time-based stats
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          
          const todayCount = auditLogsData.filter(log => {
            const logDate = log.timestamp?.toDate ? log.timestamp.toDate() : new Date(log.timestamp);
            return logDate >= today;
          }).length;
          
          const weekCount = auditLogsData.filter(log => {
            const logDate = log.timestamp?.toDate ? log.timestamp.toDate() : new Date(log.timestamp);
            return logDate >= weekAgo;
          }).length;
          
          const monthCount = auditLogsData.filter(log => {
            const logDate = log.timestamp?.toDate ? log.timestamp.toDate() : new Date(log.timestamp);
            return logDate >= monthAgo;
          }).length;
          
          setStats({ 
            total, 
            success, 
            failure, 
            warning, 
            info, 
            today: todayCount, 
            thisWeek: weekCount, 
            thisMonth: monthCount 
          });
          
          console.log('✅ [AUDIT] Real-time updates active -', total, 'audit logs loaded');
        },
        createSnapshotErrorHandler('admin audit logs')
      );

      return () => {
        auditLogsUnsubscribe();
      };
    } catch (error) {
      console.error('❌ Error setting up real-time updates:', error);
    }
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    // The real-time listener will automatically refresh the data
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'failure': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'warning': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'info': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircleIcon className="w-4 h-4" />;
      case 'failure': return <XCircleIcon className="w-4 h-4" />;
      case 'warning': return <ExclamationTriangleIcon className="w-4 h-4" />;
      case 'info': return <InformationCircleIcon className="w-4 h-4" />;
      default: return <InformationCircleIcon className="w-4 h-4" />;
    }
  };

  const getActionIcon = (action: string) => {
    if (action.toLowerCase().includes('login')) return <UserIcon className="w-4 h-4" />;
    if (action.toLowerCase().includes('create')) return <DocumentTextIcon className="w-4 h-4" />;
    if (action.toLowerCase().includes('update')) return <DocumentTextIcon className="w-4 h-4" />;
    if (action.toLowerCase().includes('delete')) return <XCircleIcon className="w-4 h-4" />;
    if (action.toLowerCase().includes('approve')) return <CheckCircleIcon className="w-4 h-4" />;
    if (action.toLowerCase().includes('reject')) return <XCircleIcon className="w-4 h-4" />;
    if (action.toLowerCase().includes('spotlight')) return <StarIcon className="w-4 h-4" />;
    if (action.toLowerCase().includes('kyc')) return <ShieldCheckIcon className="w-4 h-4" />;
    if (action.toLowerCase().includes('kyb')) return <BuildingOffice2Icon className="w-4 h-4" />;
    if (action.toLowerCase().includes('project')) return <RocketLaunchIcon className="w-4 h-4" />;
    if (action.toLowerCase().includes('payment')) return <CurrencyDollarIcon className="w-4 h-4" />;
    if (action.toLowerCase().includes('analytics')) return <ChartBarIcon className="w-4 h-4" />;
    return <InformationCircleIcon className="w-4 h-4" />;
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <LoadingSpinner size="lg" message="Loading audit logs..." />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="relative w-full text-white">
      <div className="w-full space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <ClipboardDocumentCheckIcon className="w-8 h-8 text-blue-400" />
              Audit Log
            </h1>
            <p className="text-gray-400 mt-2">Complete system activity monitoring and compliance tracking</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-400">Total Logs</p>
              <p className="text-2xl font-bold text-white">{stats.total.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Today</p>
              <p className="text-2xl font-bold text-white">{stats.today}</p>
            </div>
            <button
              onClick={refreshData}
              disabled={isRefreshing}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
            >
              {isRefreshing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Refreshing...
                </>
              ) : (
                <>
                  <ArrowPathIcon className="w-4 h-4" />
                  Refresh
                </>
              )}
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Success</p>
                <p className="text-white text-2xl font-bold">{stats.success}</p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <CheckCircleIcon className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Failures</p>
                <p className="text-white text-2xl font-bold">{stats.failure}</p>
              </div>
              <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                <XCircleIcon className="w-6 h-6 text-red-400" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Warnings</p>
                <p className="text-white text-2xl font-bold">{stats.warning}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <ExclamationTriangleIcon className="w-6 h-6 text-yellow-400" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">This Week</p>
                <p className="text-white text-2xl font-bold">{stats.thisWeek}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <CalendarIcon className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search audit logs by action, user, resource, or details..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="all">All Status</option>
              <option value="success">Success</option>
              <option value="failure">Failure</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
            </select>

            {/* Action Filter */}
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="all">All Actions</option>
              <option value="login">Login</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
              <option value="approve">Approve</option>
              <option value="reject">Reject</option>
            </select>

            {/* User Role Filter */}
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="all">All Users</option>
              <option value="admin">Admin</option>
              <option value="founder">Founder</option>
              <option value="investor">Investor</option>
            </select>

            {/* Date Filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>

          {searchTerm && (
            <p className="mt-3 text-sm text-gray-400">
              Showing {filteredLogs.length} of {auditLogs.length} audit logs
            </p>
          )}
        </div>

        {/* Audit Logs List */}
        <div className="space-y-4">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 bg-gray-800 border border-gray-700 rounded-xl">
              <ClipboardDocumentCheckIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                {searchTerm ? 'No audit logs match your search' : 'No audit logs found'}
              </h3>
              <p className="text-gray-400">
                {searchTerm ? 'Try adjusting your search criteria' : 'No system activity has been recorded yet.'}
              </p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6 hover:border-blue-500/30 transition-all duration-300">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.action)}
                        <h3 className="text-lg font-bold text-white">{log.action}</h3>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border flex items-center gap-1 ${getStatusColor(log.status)}`}>
                        {getStatusIcon(log.status)}
                        {log.status.toUpperCase()}
                      </span>
                      <span className="px-3 py-1 rounded-full text-sm font-medium border bg-gray-500/20 text-gray-400 border-gray-500/30">
                        {log.userRole.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-gray-400 text-sm">User</p>
                        <p className="text-white font-medium">{log.userName}</p>
                        <p className="text-gray-400 text-sm">{log.userEmail}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Resource</p>
                        <p className="text-white font-medium">{log.resource}</p>
                        <p className="text-gray-400 text-sm">ID: {log.resourceId}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Timestamp</p>
                        <p className="text-white font-medium">{formatTimestamp(log.timestamp)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">IP Address</p>
                        <p className="text-white font-medium">{log.ipAddress}</p>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="mb-4">
                      <p className="text-gray-400 text-sm mb-2">Details</p>
                      <p className="text-white text-sm bg-gray-700/50 rounded-lg p-3">{log.details}</p>
                    </div>

                    {/* Changes */}
                    {log.changes && log.changes.length > 0 && (
                      <div className="mb-4">
                        <p className="text-gray-400 text-sm mb-2">Changes Made</p>
                        <div className="space-y-2">
                          {log.changes.map((change, idx) => (
                            <div key={idx} className="bg-gray-700/50 rounded-lg p-3">
                              <p className="text-white text-sm">
                                <span className="font-medium">{change.field}:</span>
                                <span className="text-gray-400 ml-2">"{change.oldValue}"</span>
                                <ArrowDownIcon className="w-4 h-4 text-red-400 mx-2 inline" />
                                <span className="text-gray-400">"{change.newValue}"</span>
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Department */}
                    {log.department && (
                      <div className="mb-4">
                        <p className="text-gray-400 text-sm">Department</p>
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/30">
                          {log.department}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 ml-6">
                    <button
                      onClick={() => {
                        setSelectedLog(log);
                        setShowDetailsModal(true);
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                    >
                      <EyeIcon className="w-4 h-4" />
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Details Modal */}
        {showDetailsModal && selectedLog && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4" style={{ zIndex: 100 }}>
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto" style={{ zIndex: 101 }}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Audit Log Details</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <XCircleIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Action</label>
                    <p className="text-white">{selectedLog.action}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border flex items-center gap-1 w-fit ${getStatusColor(selectedLog.status)}`}>
                      {getStatusIcon(selectedLog.status)}
                      {selectedLog.status.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">User</label>
                    <p className="text-white">{selectedLog.userName} ({selectedLog.userEmail})</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">User Role</label>
                    <p className="text-white">{selectedLog.userRole}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Resource</label>
                    <p className="text-white">{selectedLog.resource} (ID: {selectedLog.resourceId})</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Timestamp</label>
                    <p className="text-white">{formatTimestamp(selectedLog.timestamp)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">IP Address</label>
                    <p className="text-white">{selectedLog.ipAddress}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Department</label>
                    <p className="text-white">{selectedLog.department || 'N/A'}</p>
                  </div>
                </div>

                {/* Details */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Details</label>
                  <p className="text-white bg-gray-700/50 rounded-lg p-4">{selectedLog.details}</p>
                </div>

                {/* Changes */}
                {selectedLog.changes && selectedLog.changes.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Changes Made</label>
                    <div className="space-y-3">
                      {selectedLog.changes.map((change, idx) => (
                        <div key={idx} className="bg-gray-700/50 rounded-lg p-4">
                          <p className="text-white font-medium mb-2">{change.field}</p>
                          <div className="flex items-center gap-4">
                            <div className="flex-1">
                              <p className="text-gray-400 text-sm">Old Value</p>
                              <p className="text-red-400">{JSON.stringify(change.oldValue)}</p>
                            </div>
                            <ArrowDownIcon className="w-5 h-5 text-gray-400" />
                            <div className="flex-1">
                              <p className="text-gray-400 text-sm">New Value</p>
                              <p className="text-green-400">{JSON.stringify(change.newValue)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Metadata */}
                {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Metadata</label>
                    <div className="bg-gray-700/50 rounded-lg p-4">
                      <pre className="text-white text-sm overflow-x-auto">
                        {JSON.stringify(selectedLog.metadata, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {/* User Agent */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">User Agent</label>
                  <p className="text-white bg-gray-700/50 rounded-lg p-4 text-sm break-all">{selectedLog.userAgent}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}