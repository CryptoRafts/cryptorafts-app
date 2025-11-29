"use client";
import { useState, useEffect } from "react";
import { useRoleFlags } from "@/lib/guards";
import { db, collection, query, where, onSnapshot, limit } from "@/lib/firebase.client";
import Link from "next/link";

export default function SearchPage() {
  const { user, isAuthed } = useRoleFlags();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    setHasSearched(true);
    
    if (!db) return;
    
    // In a real implementation, this would use a proper search API
    // For now, we'll search through projects collection
    const q = query(
      collection(db!, "projects"),
      where("title", ">=", searchTerm),
      where("title", "<=", searchTerm + "\uf8ff"),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const results = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSearchResults(results);
      setLoading(false);
    });

    return () => unsubscribe();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Search</h1>
        <p className="text-white/60 mt-2">Find projects, narratives, and market insights</p>
      </div>

      {/* Search Bar */}
      <div className="max-w-2xl mx-auto">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Search for projects, sectors, or keywords..."
            className="w-full px-4 py-3 pl-12 rounded-2xl bg-white/5 border border-white/10 focus:border-white/30 focus:outline-none text-white placeholder-white/50"
          />
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
            <svg className="w-5 h-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !searchTerm.trim()}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 btn-primary px-4 py-2 text-sm"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>
      </div>

      {/* Search Results */}
      {hasSearched && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              Search Results {searchResults.length > 0 && `(${searchResults.length})`}
            </h2>
            {searchTerm && (
              <span className="text-white/60 text-sm">
                Results for "{searchTerm}"
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-white/60">Searching...</div>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchResults.map(result => (
                <div key={result.id} className="glass p-6 rounded-2xl space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{result.title || "Untitled Project"}</h3>
                      <p className="text-white/60 text-sm">{result.sector} • {result.chain}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      result.raftai?.rating === "High" ? "bg-emerald-500/20 text-emerald-400" :
                      result.raftai?.rating === "Normal" ? "bg-blue-500/20 text-blue-400" :
                      "bg-orange-500/20 text-orange-400"
                    }`}>
                      {result.raftai?.rating || "Normal"}
                    </span>
                  </div>
                  
                  <p className="text-white/60 text-sm line-clamp-3">
                    {result.summary || "No description available."}
                  </p>
                  
                  <div className="flex gap-2">
                    <Link 
                      href={`/projects/${result.id}`}
                      className="btn-outline flex-1 text-center"
                    >
                      View Details
                    </Link>
                    {isAuthed && (
                      <button className="btn-primary flex-1">
                        Express Interest
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass p-8 rounded-2xl text-center">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">No results found</h3>
              <p className="text-white/60 text-sm mb-4">
                Try different keywords or check your spelling
              </p>
            </div>
          )}
        </div>
      )}

      {/* Popular Searches */}
      {!hasSearched && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Popular Searches</h2>
          <div className="flex flex-wrap gap-2">
            {["DeFi", "NFT", "Gaming", "Layer 2", "AI", "Web3", "Infrastructure", "Social Tokens"].map(term => (
              <button
                key={term}
                onClick={() => {
                  setSearchTerm(term);
                  handleSearch();
                }}
                className="px-3 py-1 rounded-full bg-white/10 border border-white/20 hover:bg-white/20 text-sm transition-colors"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
