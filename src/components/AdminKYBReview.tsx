"use client";

import { useState, useEffect } from 'react';
import { db, doc, updateDoc, serverTimestamp, collection, query, where, getDocs } from '@/lib/firebase.client';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

interface KYBSubmission {
  id: string;
  orgId: string;
  orgName: string;
  submittedAt: any;
  submittedBy: string;
  status: 'pending' | 'approved' | 'rejected';
  riskScore: number;
  aiAnalysis: {
    complianceScore: number;
    riskFactors: string[];
    recommendations: string[];
  };
  adminReview?: {
    reviewedBy: string;
    reviewedAt: string;
    notes: string;
  };
}

export default function AdminKYBReview() {
  const [submissions, setSubmissions] = useState<KYBSubmission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<KYBSubmission | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    if (!db) {
      console.error('Database not available');
      setError('Database not available');
      return;
    }
    
    try {
      const orgsQuery = query(
        collection(db!, 'organizations'),
        where('kyb.status', '==', 'pending')
      );
      
      const orgsSnapshot = await getDocs(orgsQuery);
      const submissionsList: KYBSubmission[] = [];

      for (const orgDoc of orgsSnapshot.docs) {
        const orgData = orgDoc.data();
        if (orgData.kyb) {
          submissionsList.push({
            id: orgDoc.id,
            orgId: orgDoc.id,
            orgName: orgData.name,
            submittedAt: orgData.kyb.submittedAt,
            submittedBy: orgData.kyb.submittedBy,
            status: orgData.kyb.status,
            riskScore: orgData.kyb.riskScore || 0,
            aiAnalysis: orgData.kyb.aiAnalysis || {
              complianceScore: 0,
              riskFactors: [],
              recommendations: []
            },
            adminReview: orgData.kyb.adminReview
          });
        }
      }

      setSubmissions(submissionsList);
    } catch (error) {
      console.error('Error loading submissions:', error);
      setError('Failed to load KYB submissions');
    }
  };

  const approveKYB = async (submission: KYBSubmission) => {
    if (!submission || !db) return;

    setBusy(true);
    setError(null);

    try {
      await updateDoc(doc(db!, 'organizations', submission.orgId), {
        'kyb.status': 'approved',
        'kyb.adminReview': {
          reviewedBy: 'admin', // In real implementation, get from auth
          reviewedAt: serverTimestamp(),
          notes: reviewNotes,
          decision: 'approved'
        },
        'kyb.approvedAt': serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Update user's onboarding status
      await updateDoc(doc(db!, 'users', submission.submittedBy), {
        'onboarding.step': 'done',
        updatedAt: serverTimestamp()
      });

      setSelectedSubmission(null);
      setReviewNotes('');
      await loadSubmissions();
    } catch (err: any) {
      setError(err?.message || 'Failed to approve KYB');
    } finally {
      setBusy(false);
    }
  };

  const rejectKYB = async (submission: KYBSubmission) => {
    if (!submission || !db) return;

    setBusy(true);
    setError(null);

    try {
      await updateDoc(doc(db!, 'organizations', submission.orgId), {
        'kyb.status': 'rejected',
        'kyb.adminReview': {
          reviewedBy: 'admin', // In real implementation, get from auth
          reviewedAt: serverTimestamp(),
          notes: reviewNotes,
          decision: 'rejected'
        },
        'kyb.rejectedAt': serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      setSelectedSubmission(null);
      setReviewNotes('');
      await loadSubmissions();
    } catch (err: any) {
      setError(err?.message || 'Failed to reject KYB');
    } finally {
      setBusy(false);
    }
  };

  const getRiskColor = (score: number) => {
    if (score <= 30) return 'text-green-400 bg-green-400/20';
    if (score <= 60) return 'text-yellow-400 bg-yellow-400/20';
    return 'text-red-400 bg-red-400/20';
  };

  const getComplianceColor = (score: number) => {
    if (score >= 80) return 'text-green-400 bg-green-400/20';
    if (score >= 60) return 'text-yellow-400 bg-yellow-400/20';
    return 'text-red-400 bg-red-400/20';
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">KYB Review Dashboard</h1>
        <p className="text-white/60">Review and approve VC organization KYB submissions</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Submissions List */}
        <div className="lg:col-span-1">
          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-4">Pending Reviews</h2>
            
            {submissions.length === 0 ? (
              <p className="text-white/60">No pending KYB submissions</p>
            ) : (
              <div className="space-y-3">
                {submissions.map((submission) => (
                  <div
                    key={submission.id}
                    onClick={() => setSelectedSubmission(submission)}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedSubmission?.id === submission.id
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-white font-medium">{submission.orgName}</h3>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(submission.riskScore)}`}>
                        Risk: {submission.riskScore}/100
                      </div>
                    </div>
                    
                    <p className="text-white/60 text-sm">
                      Submitted: {new Date(submission.submittedAt?.toDate?.() || submission.submittedAt).toLocaleDateString()}
                    </p>
                    
                    <div className="flex items-center space-x-2 mt-2">
                      <ClockIcon className="h-4 w-4 text-yellow-400" />
                      <span className="text-yellow-400 text-sm">Pending Review</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Review Panel */}
        <div className="lg:col-span-2">
          {selectedSubmission ? (
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Review KYB Submission</h2>
                <div className="flex items-center space-x-2">
                  <ShieldCheckIcon className="h-5 w-5 text-blue-400" />
                  <span className="text-blue-400 text-sm">Admin Review</span>
                </div>
              </div>

              {/* Organization Info */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-white mb-3">Organization Details</h3>
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-white/60"><strong>Organization:</strong> {selectedSubmission.orgName}</p>
                  <p className="text-white/60"><strong>Submitted:</strong> {new Date(selectedSubmission.submittedAt?.toDate?.() || selectedSubmission.submittedAt).toLocaleString()}</p>
                  <p className="text-white/60"><strong>Submitted By:</strong> {selectedSubmission.submittedBy}</p>
                </div>
              </div>

              {/* AI Analysis Results */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-white mb-3">AI Analysis Results</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className={`rounded-lg p-4 ${getComplianceColor(selectedSubmission.aiAnalysis.complianceScore)}`}>
                    <p className="font-medium">Compliance Score</p>
                    <p className="text-2xl font-bold">{selectedSubmission.aiAnalysis.complianceScore}/100</p>
                  </div>
                  
                  <div className={`rounded-lg p-4 ${getRiskColor(selectedSubmission.riskScore)}`}>
                    <p className="font-medium">Risk Score</p>
                    <p className="text-2xl font-bold">{selectedSubmission.riskScore}/100</p>
                  </div>
                </div>

                {selectedSubmission.aiAnalysis.riskFactors.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-white font-medium mb-2">Risk Factors</h4>
                    <ul className="space-y-1">
                      {selectedSubmission.aiAnalysis.riskFactors.map((factor, index) => (
                        <li key={index} className="text-red-400 text-sm">• {factor}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedSubmission.aiAnalysis.recommendations.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-white font-medium mb-2">AI Recommendations</h4>
                    <ul className="space-y-1">
                      {selectedSubmission.aiAnalysis.recommendations.map((rec, index) => (
                        <li key={index} className="text-blue-400 text-sm">• {rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Admin Review Notes */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-white mb-3">Review Notes</h3>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  rows={4}
                  placeholder="Add your review notes and decision rationale..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <button
                  onClick={() => approveKYB(selectedSubmission)}
                  disabled={busy}
                  className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <CheckCircleIcon className="h-5 w-5" />
                  <span>Approve KYB</span>
                </button>
                
                <button
                  onClick={() => rejectKYB(selectedSubmission)}
                  disabled={busy}
                  className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <XCircleIcon className="h-5 w-5" />
                  <span>Reject KYB</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 text-center">
              <DocumentTextIcon className="h-12 w-12 text-white/40 mx-auto mb-4" />
              <h3 className="text-white font-medium mb-2">Select a KYB Submission</h3>
              <p className="text-white/60">Choose a submission from the list to review and approve or reject.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
