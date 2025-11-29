"use client";

import { useState, useEffect } from "react";
import {
  ShieldCheckIcon,
  UserIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  SparklesIcon,
  EyeIcon,
  HeartIcon,
  BoltIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";
import { collection, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase.client";
import type { AuthenticityReport } from "@/lib/raftai/videoAnalysis";

interface CallAnalysisRecord {
  id: string;
  callId: string;
  analyzedUserName: string;
  analyzedUserRole: string;
  callDuration: number;
  authenticityReport: AuthenticityReport;
  createdAt: any;
}

interface Props {
  userId: string;
  userRole: string;
}

export default function RaftAIAnalysisReports({ userId, userRole }: Props) {
  const [reports, setReports] = useState<CallAnalysisRecord[]>([]);
  const [selectedReport, setSelectedReport] = useState<CallAnalysisRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🤖 [RaftAI] Loading analysis reports for user:', userId);

    const firestore = db;
    if (!firestore) {
      setReports([]);
      setLoading(false);
      return;
    }

    const reportsRef = collection(firestore, 'callAnalysis');
    const q = query(
      reportsRef,
      where('accessibleBy', 'array-contains', userId),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const analyses = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as CallAnalysisRecord));
        
        console.log('🤖 [RaftAI] Loaded', analyses.length, 'analysis reports');
        setReports(analyses);
        setLoading(false);
      },
      (error) => {
        console.error('❌ [RaftAI] Error loading reports:', error);
        setReports([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-500';
    if (score >= 70) return 'text-blue-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 85) return 'bg-green-500/20 border-green-500/30';
    if (score >= 70) return 'bg-blue-500/20 border-blue-500/30';
    if (score >= 50) return 'bg-yellow-500/20 border-yellow-500/30';
    return 'bg-red-500/20 border-red-500/30';
  };

  const getRecommendationBadge = (recommendation: string) => {
    const badges = {
      highly_trustworthy: { text: 'Highly Trustworthy', color: 'bg-green-600 text-white' },
      trustworthy: { text: 'Trustworthy', color: 'bg-blue-600 text-white' },
      neutral: { text: 'Neutral', color: 'bg-gray-600 text-white' },
      proceed_with_caution: { text: 'Proceed with Caution', color: 'bg-yellow-600 text-white' },
      high_risk: { text: 'High Risk', color: 'bg-red-600 text-white' }
    };
    
    const badge = badges[recommendation as keyof typeof badges] || badges.neutral;
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-3"></div>
            <p className="text-white/60 text-sm">Loading RaftAI reports...</p>
          </div>
        </div>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-8">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mx-auto mb-4">
            <SparklesIcon className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-white font-bold text-xl mb-2">No Analysis Reports Yet</h3>
          <p className="text-white/70 text-sm mb-4">
            RaftAI automatically analyzes video calls for authenticity, emotions, and trust indicators.
          </p>
          <p className="text-white/60 text-xs">
            Start a video call to see AI-powered analysis reports here!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-lg rounded-xl border border-blue-500/30 p-6">
        <div className="flex items-center gap-3 mb-2">
          <SparklesIcon className="w-8 h-8 text-blue-400" />
          <h2 className="text-2xl font-bold text-white">RaftAI Call Analysis</h2>
        </div>
        <p className="text-white/70 text-sm">
          AI-powered authenticity, emotion, and trust verification for video calls
        </p>
      </div>

      {/* Reports List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {reports.map((report) => (
          <div
            key={report.id}
            onClick={() => setSelectedReport(report)}
            className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-5 hover:bg-white/10 transition-all cursor-pointer group"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {report.analyzedUserName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-white font-medium">{report.analyzedUserName}</p>
                  <p className="text-white/60 text-xs capitalize">{report.analyzedUserRole}</p>
                </div>
              </div>
              {getRecommendationBadge(report.authenticityReport.recommendation)}
            </div>

            {/* Score */}
            <div className={`rounded-lg border p-4 mb-4 ${getScoreBgColor(report.authenticityReport.overallScore)}`}>
              <div className="text-center">
                <p className="text-white/70 text-xs mb-1">Authenticity Score</p>
                <p className={`text-4xl font-bold ${getScoreColor(report.authenticityReport.overallScore)}`}>
                  {report.authenticityReport.overallScore}
                  <span className="text-2xl">/100</span>
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="bg-white/5 rounded-lg p-2">
                <p className="text-white/60 text-xs mb-1">Trust Level</p>
                <p className="text-white font-medium text-sm">
                  {Math.round(report.authenticityReport.trustIndicators.honesty)}%
                </p>
              </div>
              <div className="bg-white/5 rounded-lg p-2">
                <p className="text-white/60 text-xs mb-1">Engagement</p>
                <p className="text-white font-medium text-sm">
                  {Math.round(report.authenticityReport.trustIndicators.engagement)}%
                </p>
              </div>
            </div>

            {/* Meta */}
            <div className="flex items-center justify-between text-xs text-white/50">
              <span>{formatDate(report.createdAt)}</span>
              <span>{formatDuration(report.callDuration)}</span>
            </div>

            {/* View Details */}
            <div className="mt-3 pt-3 border-t border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-blue-400 text-xs font-medium">Click to view full analysis →</p>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Report Modal */}
      {selectedReport && (
        <DetailedReportModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
        />
      )}
    </div>
  );
}

// ===== DETAILED REPORT MODAL =====

function DetailedReportModal({ 
  report, 
  onClose 
}: { 
  report: CallAnalysisRecord; 
  onClose: () => void;
}) {
  const r = report.authenticityReport;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl border border-white/20 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-white/10 p-6 z-10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <span className="text-white font-bold text-xl">
                  {report.analyzedUserName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{report.analyzedUserName}</h2>
                <p className="text-white/60 text-sm capitalize">
                  {report.analyzedUserRole} • {formatDuration(report.callDuration)} call
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Overall Score */}
          <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-xl border border-blue-500/30 p-6">
            <div className="text-center mb-4">
              <p className="text-white/70 text-sm mb-2">Authenticity Score</p>
              <div className={`text-6xl font-bold mb-2 ${getScoreColor(r.overallScore)}`}>
                {r.overallScore}
                <span className="text-3xl">/100</span>
              </div>
              {getRecommendationBadge(r.recommendation)}
            </div>
            <p className="text-white/80 text-sm text-center leading-relaxed">
              {r.summary}
            </p>
          </div>

          {/* Trust Indicators */}
          <div className="bg-white/5 rounded-xl border border-white/10 p-6">
            <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <ShieldCheckIcon className="w-5 h-5" />
              Trust Indicators
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(r.trustIndicators).map(([key, value]) => (
                <div key={key}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-white/70 text-sm capitalize">{key}</p>
                    <p className={`font-bold ${getScoreColor(value as number)}`}>
                      {Math.round(value as number)}%
                    </p>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        value >= 70 ? 'bg-green-500' : value >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${value}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Emotional Profile */}
          <div className="bg-white/5 rounded-xl border border-white/10 p-6">
            <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <HeartIcon className="w-5 h-5" />
              Emotional Profile
            </h3>
            <div className="mb-4">
              <p className="text-white/70 text-sm mb-2">Dominant Emotion</p>
              <p className="text-white font-bold text-xl capitalize">{r.emotionalProfile.dominant}</p>
            </div>
            <div className="space-y-2">
              {Object.entries(r.emotionalProfile.distribution).map(([emotion, score]) => (
                <div key={emotion}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-white/70 text-xs capitalize">{emotion}</p>
                    <p className="text-white/90 text-xs font-medium">{Math.round(score * 100)}%</p>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                      style={{ width: `${score * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Behavioral Analysis */}
          <div className="bg-white/5 rounded-xl border border-white/10 p-6">
            <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <ChartBarIcon className="w-5 h-5" />
              Behavioral Analysis
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(r.behavioralAnalysis).map(([key, value]) => (
                <div key={key} className="bg-white/5 rounded-lg p-3">
                  <p className="text-white/70 text-xs mb-1 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                  <p className={`font-bold text-lg ${getScoreColor(value as number)}`}>
                    {Math.round(value as number)}%
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Deepfake Detection */}
          <div className="bg-white/5 rounded-xl border border-white/10 p-6">
            <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <EyeIcon className="w-5 h-5" />
              Deepfake Detection
            </h3>
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                r.deepfakeDetection.status === 'verified' 
                  ? 'bg-green-500/20' 
                  : r.deepfakeDetection.status === 'suspicious' 
                  ? 'bg-yellow-500/20' 
                  : 'bg-red-500/20'
              }`}>
                {r.deepfakeDetection.status === 'verified' ? (
                  <CheckCircleIcon className="w-8 h-8 text-green-500" />
                ) : (
                  <ExclamationTriangleIcon className="w-8 h-8 text-yellow-500" />
                )}
              </div>
              <div>
                <p className="text-white font-bold text-lg capitalize">
                  {r.deepfakeDetection.status.replace(/_/g, ' ')}
                </p>
                <p className="text-white/70 text-sm">
                  Confidence: {Math.round(r.deepfakeDetection.confidence * 100)}%
                </p>
              </div>
            </div>
            {r.deepfakeDetection.flags.length > 0 && (
              <div className="space-y-1">
                {r.deepfakeDetection.flags.map((flag, i) => (
                  <p key={i} className="text-yellow-400 text-xs">⚠️ {flag}</p>
                ))}
              </div>
            )}
          </div>

          {/* Identity Verification */}
          {r.identityVerification && (
            <div className="bg-white/5 rounded-xl border border-white/10 p-6">
              <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                <UserIcon className="w-5 h-5" />
                Identity Verification
              </h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">
                    {r.identityVerification.verified ? '✅ Identity Verified' : '⚠️ Identity Not Confirmed'}
                  </p>
                  <p className="text-white/60 text-sm">
                    Match Score: {Math.round(r.identityVerification.matchScore)}%
                  </p>
                </div>
                <div className={`text-5xl font-bold ${
                  r.identityVerification.verified ? 'text-green-500' : 'text-yellow-500'
                }`}>
                  {r.identityVerification.verified ? '✓' : '?'}
                </div>
              </div>
            </div>
          )}

          {/* Positive Signals */}
          {r.positiveSignals.length > 0 && (
            <div className="bg-green-500/10 rounded-xl border border-green-500/30 p-6">
              <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5 text-green-500" />
                Positive Signals
              </h3>
              <div className="space-y-2">
                {r.positiveSignals.map((signal, i) => (
                  <p key={i} className="text-green-400 text-sm">{signal}</p>
                ))}
              </div>
            </div>
          )}

          {/* Red Flags */}
          {r.redFlags.length > 0 && (
            <div className="bg-red-500/10 rounded-xl border border-red-500/30 p-6">
              <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
                Red Flags
              </h3>
              <div className="space-y-2">
                {r.redFlags.map((flag, i) => (
                  <p key={i} className="text-red-400 text-sm">{flag}</p>
                ))}
              </div>
            </div>
          )}

          {/* Call Details */}
          <div className="bg-white/5 rounded-xl border border-white/10 p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-white/60 mb-1">Call ID</p>
                <p className="text-white/90 font-mono text-xs">{report.callId.slice(0, 20)}...</p>
              </div>
              <div>
                <p className="text-white/60 mb-1">Date & Time</p>
                <p className="text-white/90">{formatDate(report.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );

  function getScoreColor(score: number) {
    if (score >= 85) return 'text-green-500';
    if (score >= 70) return 'text-blue-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  }

  function getScoreBgColor(score: number) {
    if (score >= 85) return 'bg-green-500/20 border-green-500/30';
    if (score >= 70) return 'bg-blue-500/20 border-blue-500/30';
    if (score >= 50) return 'bg-yellow-500/20 border-yellow-500/30';
    return 'bg-red-500/20 border-red-500/30';
  }

  function getRecommendationBadge(recommendation: string) {
    const badges = {
      highly_trustworthy: { text: 'Highly Trustworthy', color: 'bg-green-600 text-white' },
      trustworthy: { text: 'Trustworthy', color: 'bg-blue-600 text-white' },
      neutral: { text: 'Neutral', color: 'bg-gray-600 text-white' },
      proceed_with_caution: { text: 'Proceed with Caution', color: 'bg-yellow-600 text-white' },
      high_risk: { text: 'High Risk', color: 'bg-red-600 text-white' }
    };
    
    const badge = badges[recommendation as keyof typeof badges] || badges.neutral;
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold ${badge.color}`}>
        {badge.text}
      </span>
    );
  }

  function formatDate(timestamp: any) {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function formatDuration(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}

