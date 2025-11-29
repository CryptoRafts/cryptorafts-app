"use client";

import { useState } from 'react';
import { EnvelopeIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function AdminEmailPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleBulkEmailAction = async (action: string, kycStatus?: string) => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/admin/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          kycStatus,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Failed to execute email action');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatistics = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/admin/email');
      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Failed to get statistics');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-black/80 backdrop-blur-lg border border-white/10 rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Email Management</h1>
            <p className="text-white/70">Manage approval emails for CryptoRafts users</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-400 mr-2" />
                <p className="text-red-300">{error}</p>
              </div>
            </div>
          )}

          {result && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <CheckCircleIcon className="w-5 h-5 text-green-400 mr-2" />
                <div>
                  <p className="text-green-300 font-semibold">{result.message}</p>
                  {result.result && (
                    <p className="text-green-400 text-sm mt-1">
                      Success: {result.result.success}, Failed: {result.result.failed}
                    </p>
                  )}
                  {result.statistics && (
                    <div className="mt-2 text-sm text-green-400">
                      <p>Total Registered: {result.statistics.totalRegistered}</p>
                      <p>Approved: {result.statistics.approved}</p>
                      <p>Pending: {result.statistics.pending}</p>
                      <p>Submitted: {result.statistics.submitted}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Statistics */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">User Statistics</h3>
              <p className="text-white/70 mb-4">Get current statistics about registered users</p>
              <button
                onClick={getStatistics}
                disabled={loading}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Get Statistics'}
              </button>
            </div>

            {/* Bulk Actions */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Bulk Email Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => handleBulkEmailAction('send_approval_to_all')}
                  disabled={loading}
                  className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg font-semibold transition-colors disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send Approval to All Users'}
                </button>
                
                <button
                  onClick={() => handleBulkEmailAction('send_approval_by_kyc_status', 'pending')}
                  disabled={loading}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-lg font-semibold transition-colors disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send Approval to Pending Users'}
                </button>
                
                <button
                  onClick={() => handleBulkEmailAction('send_kyc_approval_notifications')}
                  disabled={loading}
                  className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-lg font-semibold transition-colors disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send KYC Approval Notifications'}
                </button>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">Setup Instructions</h3>
            <div className="text-blue-800 text-sm space-y-2">
              <p><strong>1. Configure Hostinger Email:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Log into your Hostinger control panel</li>
                <li>Create email account: business@cryptorafts.com</li>
                <li>Set a strong password</li>
                <li>Configure SMTP settings (smtp.hostinger.com:587)</li>
              </ul>
              
              <p className="mt-4"><strong>2. Environment Variables:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Add EMAIL_PASSWORD to your .env.local file</li>
                <li>Set EMAIL_USER=business@cryptorafts.com</li>
                <li>Configure other email settings as needed</li>
              </ul>
              
              <p className="mt-4"><strong>3. Test Configuration:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Use the "Get Statistics" button to test connection</li>
                <li>Send a test email to verify everything works</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
