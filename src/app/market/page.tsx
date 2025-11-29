"use client";
import { useEffect, useState } from "react";
import { useRoleFlags } from "@/lib/guards";
import { db, doc, onSnapshot } from "@/lib/firebase.client";
import { useAuth } from "@/providers/SimpleAuthProvider";

export default function MarketPage() {
  const { user, isAuthed } = useRoleFlags();
  const { user: authUser } = useAuth();
  const [marketData, setMarketData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only fetch real data if user is authenticated
    if (!authUser || !db) {
      setLoading(false);
      return;
    }

    // Fetch market data from Firestore
    const unsubscribe = onSnapshot(doc(db!, "market", "overview"), (snapshot) => {
      if (snapshot.exists()) {
        setMarketData(snapshot.data());
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [authUser]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white/60">Loading market data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Market Overview</h1>
        <p className="text-white/60 mt-2">Real-time crypto market data and insights</p>
      </div>

      {/* Market Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass p-6 rounded-2xl">
          <div className="text-2xl font-bold">${marketData?.totalMarketCap?.toLocaleString() || "2.5T"}</div>
          <div className="text-white/60 text-sm">Total Market Cap</div>
          <div className="text-emerald-400 text-sm mt-1">+2.4%</div>
        </div>
        <div className="glass p-6 rounded-2xl">
          <div className="text-2xl font-bold">${marketData?.totalVolume24h?.toLocaleString() || "85B"}</div>
          <div className="text-white/60 text-sm">24h Volume</div>
          <div className="text-emerald-400 text-sm mt-1">+5.7%</div>
        </div>
        <div className="glass p-6 rounded-2xl">
          <div className="text-2xl font-bold">{marketData?.activeProjects || "1,247"}</div>
          <div className="text-white/60 text-sm">Active Projects</div>
          <div className="text-emerald-400 text-sm mt-1">+23</div>
        </div>
        <div className="glass p-6 rounded-2xl">
          <div className="text-2xl font-bold">{marketData?.newListings || "23"}</div>
          <div className="text-white/60 text-sm">New Listings</div>
          <div className="text-blue-400 text-sm mt-1">This week</div>
        </div>
      </div>

      {/* Top Gainers */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Top Gainers</h2>
        <div className="glass p-6 rounded-2xl">
          <div className="space-y-4">
            {marketData?.topGainers?.map((coin: any, index: number) => (
              <div key={coin.symbol} className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                    <span className="text-sm font-bold">{coin.symbol}</span>
                  </div>
                  <div>
                    <div className="font-semibold">{coin.name}</div>
                    <div className="text-white/60 text-sm">{coin.symbol}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">${coin.price?.toLocaleString()}</div>
                  <div className="text-emerald-400 text-sm">+{coin.change}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trending */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Trending</h2>
        <div className="glass p-6 rounded-2xl">
          <div className="space-y-4">
            {marketData?.trending?.map((coin: any, index: number) => (
              <div key={coin.symbol} className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center">
                    <span className="text-sm font-bold">{coin.symbol}</span>
                  </div>
                  <div>
                    <div className="font-semibold">{coin.name}</div>
                    <div className="text-white/60 text-sm">{coin.symbol}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">${coin.price?.toLocaleString()}</div>
                  <div className="text-emerald-400 text-sm">+{coin.change}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Market Insights */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Market Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass p-6 rounded-2xl space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="font-semibold">Bullish Sentiment</h3>
            </div>
            <p className="text-white/60 text-sm">
              Market sentiment remains positive with increased institutional adoption and regulatory clarity.
            </p>
          </div>

          <div className="glass p-6 rounded-2xl space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="font-semibold">DeFi Growth</h3>
            </div>
            <p className="text-white/60 text-sm">
              DeFi protocols continue to see significant growth with new innovative products and higher TVL.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
