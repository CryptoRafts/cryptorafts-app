'use client';

import { useState } from 'react';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';

export default function CreateDemoProjectsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const handleCreateDemoProjects = async () => {
    if (!user) {
      setError('Please log in first');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/admin/create-demo-projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Failed to create demo projects');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black pt-24 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="neo-glass-card rounded-xl p-8">
          <h1 className="text-3xl font-bold text-white mb-6">Create Demo Projects</h1>
          
          <div className="mb-4 p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
            <p className="text-yellow-400 text-sm font-medium">
              ⚠️ Old demo projects will be automatically deleted before creating new ones.
            </p>
          </div>

          <div className="space-y-4 mb-6">
            <div className="bg-white/5 rounded-lg p-4 border border-red-400/20">
              <h3 className="text-lg font-semibold text-white mb-2">Project 1: Low Scoring (Score: 28)</h3>
              <ul className="text-white/70 text-sm space-y-1">
                <li>• Name: BasicSwap DEX</li>
                <li>• RaftAI Score: 28 (Low)</li>
                <li>• Team: 1 member (Founder only)</li>
                <li>• Docs: Basic (whitepaper, pitchdeck, tokenomics)</li>
                <li>• Not doxxed, not audited</li>
                <li>• Sector: DeFi, Stage: Pre-Seed, Chain: Ethereum</li>
                <li>• Logo: Included</li>
              </ul>
            </div>

            <div className="bg-white/5 rounded-lg p-4 border border-yellow-400/20">
              <h3 className="text-lg font-semibold text-white mb-2">Project 2: Medium Scoring (Score: 65)</h3>
              <ul className="text-white/70 text-sm space-y-1">
                <li>• Name: NFT Marketplace Pro</li>
                <li>• RaftAI Score: 65 (Normal)</li>
                <li>• Team: 3 members (CEO, CTO, Designer)</li>
                <li>• Docs: Good (whitepaper, pitchdeck, financials, tokenomics, roadmap)</li>
                <li>• Doxxed, not audited</li>
                <li>• Sector: NFT, Stage: Seed, Chain: Polygon</li>
                <li>• Logo: Included</li>
              </ul>
            </div>

            <div className="bg-white/5 rounded-lg p-4 border border-green-400/20">
              <h3 className="text-lg font-semibold text-white mb-2">Project 3: High Scoring (Score: 94)</h3>
              <ul className="text-white/70 text-sm space-y-1">
                <li>• Name: Enterprise Blockchain Suite</li>
                <li>• RaftAI Score: 94 (High)</li>
                <li>• Team: 6 members (Full executive team)</li>
                <li>• Docs: Complete (all documents including audit, legal, cap table)</li>
                <li>• Doxxed and audited</li>
                <li>• Sector: Infrastructure, Stage: Series A, Chain: Multi-chain</li>
                <li>• Logo: Included</li>
              </ul>
            </div>
          </div>

          <button
            onClick={handleCreateDemoProjects}
            disabled={loading || !user}
            className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-all font-medium flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Creating Demo Projects...</span>
              </>
            ) : (
              <>
                <NeonCyanIcon type="plus" size={20} className="text-current" />
                <span>Create Demo Projects</span>
              </>
            )}
          </button>

          {error && (
            <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {result && (
            <div className="mt-4 p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
              <p className="text-green-400 font-semibold mb-2">✅ Demo projects created successfully!</p>
              {result.deletedCount > 0 && (
                <p className="text-green-300 text-sm mb-3">
                  Deleted {result.deletedCount} old demo project(s)
                </p>
              )}
              <div className="space-y-2 text-white/70 text-sm">
                {result.projects?.map((p: any) => (
                  <div key={p.id} className="flex items-center gap-2">
                    <NeonCyanIcon type="check" size={16} className="text-green-400" />
                    <span>{p.name} - Score: {p.score} ({p.rating})</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!user && (
            <div className="mt-4 p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
              <p className="text-yellow-400">Please log in to create demo projects</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

