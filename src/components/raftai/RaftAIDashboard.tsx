/**
 * RaftAI Admin Dashboard Component
 * Displays system health, analytics, and recent activities
 */

'use client';

import { useEffect, useState } from 'react';
import type { SystemHealth, RaftAIAnalytics } from '@/lib/raftai/types';

export function RaftAIDashboard() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSystemHealth();
    const interval = setInterval(fetchSystemHealth, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchSystemHealth = async () => {
    try {
      const response = await fetch('/api/raftai/health');
      const data = await response.json();
      if (data.success) {
        setHealth(data.health);
      }
    } catch (error) {
      console.error('Failed to fetch system health:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'text-green-600 bg-green-100';
      case 'degraded': return 'text-yellow-600 bg-yellow-100';
      case 'down': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">🧠 RaftAI Intelligence Dashboard</h1>
        <p className="text-gray-600 mt-1">Real-time compliance and intelligence monitoring</p>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">System Status</h3>
            {health && (
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(health.status)}`}>
                {health.status}
              </span>
            )}
          </div>
          {health && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Uptime</span>
                <span className="font-medium">{formatUptime(health.uptime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg Latency</span>
                <span className="font-medium">{health.averageLatency}ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Queue Depth</span>
                <span className="font-medium">{health.queueDepth}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Error Rate</span>
                <span className="font-medium">{(health.errorRate * 100).toFixed(3)}%</span>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Dependencies</h3>
          {health?.dependencies && (
            <div className="space-y-3">
              {Object.entries(health.dependencies).map(([name, dep]) => (
                <div key={name} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 capitalize">{name}</span>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${dep.status === 'up' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span className="text-sm text-gray-500">{dep.latency}ms</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              View Audit Logs
            </button>
            <button className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
              Analytics Report
            </button>
            <button className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
              Compliance Overview
            </button>
          </div>
        </div>
      </div>

      {/* Features Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Features</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <FeatureCard icon="🔐" title="KYC Verification" enabled={true} />
          <FeatureCard icon="🏢" title="KYB Verification" enabled={true} />
          <FeatureCard icon="📊" title="Pitch Analysis" enabled={true} />
          <FeatureCard icon="💬" title="Chat Moderation" enabled={true} />
          <FeatureCard icon="🎥" title="Video Verification" enabled={true} />
          <FeatureCard icon="📈" title="Scoring Engine" enabled={true} />
          <FeatureCard icon="⚖️" title="Compliance Check" enabled={true} />
          <FeatureCard icon="🔍" title="Anomaly Detection" enabled={true} />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          <ActivityItem 
            type="kyc" 
            message="KYC verification completed for user" 
            time="2 minutes ago"
            status="success"
          />
          <ActivityItem 
            type="pitch" 
            message="Pitch analysis completed - Rating: High" 
            time="5 minutes ago"
            status="success"
          />
          <ActivityItem 
            type="compliance" 
            message="Compliance check flagged for review" 
            time="12 minutes ago"
            status="warning"
          />
          <ActivityItem 
            type="video" 
            message="Video verification completed" 
            time="18 minutes ago"
            status="success"
          />
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, enabled }: { icon: string; title: string; enabled: boolean }) {
  return (
    <div className={`p-4 rounded-lg border ${enabled ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-sm font-medium text-gray-900">{title}</div>
      <div className={`text-xs mt-1 ${enabled ? 'text-green-600' : 'text-gray-500'}`}>
        {enabled ? 'Active' : 'Inactive'}
      </div>
    </div>
  );
}

function ActivityItem({ type, message, time, status }: { 
  type: string; 
  message: string; 
  time: string; 
  status: 'success' | 'warning' | 'error';
}) {
  const statusColors = {
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
  };

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
      <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[status]}`}>
        {type.toUpperCase()}
      </span>
      <div className="flex-1">
        <p className="text-sm text-gray-900">{message}</p>
        <p className="text-xs text-gray-500 mt-1">{time}</p>
      </div>
    </div>
  );
}

function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

