"use client";
import { useEffect, useState } from "react";
import { useRoleFlags } from "@/lib/guards";
import { db, collection, query, where, onSnapshot, limit } from "@/lib/firebase.client";
import { useAuth } from "@/providers/SimpleAuthProvider";
import Link from "next/link";

export default function NarrativesPage() {
  const { user, isAuthed } = useRoleFlags();
  const { user: authUser } = useAuth();
  const [narratives, setNarratives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only fetch real data if user is authenticated
    if (!authUser || !db) {
      setLoading(false);
      return;
    }

    // Real-time narratives from Firestore
    const q = query(
      collection(db!, "projects"),
      where("pitch.submitted", "==", true),
      limit(12)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const narrativeData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        type: "project_narrative"
      }));
      setNarratives(narrativeData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [authUser]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white/60">Loading narratives...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Market Narratives</h1>
        <p className="text-white/60 mt-2">Explore trending crypto narratives and market insights</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Featured Narratives */}
        <div className="glass p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="font-semibold">DeFi 2.0</h3>
          </div>
          <p className="text-white/60 text-sm">
            Next-generation decentralized finance protocols focusing on sustainable yields and improved user experience.
          </p>
          <div className="flex items-center justify-between text-sm">
            <span className="text-emerald-400">+24.5%</span>
            <span className="text-white/60">This week</span>
          </div>
        </div>

        <div className="glass p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="font-semibold">AI & Crypto</h3>
          </div>
          <p className="text-white/60 text-sm">
            Artificial intelligence integration in blockchain technology, from smart contracts to predictive analytics.
          </p>
          <div className="flex items-center justify-between text-sm">
            <span className="text-blue-400">+18.2%</span>
            <span className="text-white/60">This week</span>
          </div>
        </div>

        <div className="glass p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="font-semibold">Layer 2 Solutions</h3>
          </div>
          <p className="text-white/60 text-sm">
            Scaling solutions and interoperability protocols enabling faster, cheaper blockchain transactions.
          </p>
          <div className="flex items-center justify-between text-sm">
            <span className="text-purple-400">+12.8%</span>
            <span className="text-white/60">This week</span>
          </div>
        </div>

        <div className="glass p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="font-semibold">GameFi</h3>
          </div>
          <p className="text-white/60 text-sm">
            Gaming and finance convergence, creating new economic models in virtual worlds and play-to-earn ecosystems.
          </p>
          <div className="flex items-center justify-between text-sm">
            <span className="text-orange-400">+15.3%</span>
            <span className="text-white/60">This week</span>
          </div>
        </div>

        <div className="glass p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="font-semibold">Web3 Infrastructure</h3>
          </div>
          <p className="text-white/60 text-sm">
            Core infrastructure projects building the foundation for the decentralized web and blockchain adoption.
          </p>
          <div className="flex items-center justify-between text-sm">
            <span className="text-cyan-400">+9.7%</span>
            <span className="text-white/60">This week</span>
          </div>
        </div>

        <div className="glass p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-pink-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="font-semibold">Social Tokens</h3>
          </div>
          <p className="text-white/60 text-sm">
            Creator economy tokens and social media platforms enabling direct monetization and community building.
          </p>
          <div className="flex items-center justify-between text-sm">
            <span className="text-pink-400">+7.2%</span>
            <span className="text-white/60">This week</span>
          </div>
        </div>
      </div>

      {/* Project Narratives */}
      {narratives.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Project Narratives</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {narratives.slice(0, 6).map(narrative => (
              <div key={narrative.id} className="glass p-6 rounded-2xl space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{narrative.title || "Untitled Project"}</h3>
                    <p className="text-white/60 text-sm">{narrative.sector} • {narrative.chain}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    narrative.raftai?.rating === "High" ? "bg-emerald-500/20 text-emerald-400" :
                    narrative.raftai?.rating === "Normal" ? "bg-blue-500/20 text-blue-400" :
                    "bg-orange-500/20 text-orange-400"
                  }`}>
                    {narrative.raftai?.rating || "Normal"}
                  </span>
                </div>
                
                <p className="text-white/60 text-sm line-clamp-3">
                  {narrative.summary || "No description available."}
                </p>
                
                <Link 
                  href={`/projects/${narrative.id}`}
                  className="btn-outline w-full text-center"
                >
                  View Narrative
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
