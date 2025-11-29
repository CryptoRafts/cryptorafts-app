"use client";
import { useEffect, useState } from "react";
import { db, collection, query, orderBy, onSnapshot, updateDoc, doc } from "@/lib/firebase.client";
import { Card, Section } from "@/components/Section";

interface KycItem {
  id: string;
  userId: string;
  userEmail: string;
  status: "queued" | "in_review" | "approved" | "rejected";
  documents: any[];
  riskScore: number;
  createdAt: number;
  updatedAt: number;
  reviewedBy?: string;
}

export default function KycDepartmentPage() {
  const [kycItems, setKycItems] = useState<KycItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "queued" | "in_review" | "approved" | "rejected">("all");

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }
    const q = query(
      collection(db!, "kycQueue"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as KycItem[];
      setKycItems(items);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredItems = kycItems.filter(item => 
    filter === "all" || item.status === filter
  );

  const handleStatusChange = async (itemId: string, status: string) => {
    try {
      if (!db) return;
      await updateDoc(doc(db!, "kycQueue", itemId), {
        status,
        reviewedBy: "kyc-agent", // In real app, this would be the current user's UID
        updatedAt: Date.now()
      });
    } catch (error) {
      console.error("Failed to update KYC status:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "queued": return "text-yellow-400";
      case "in_review": return "text-blue-400";
      case "approved": return "text-emerald-400";
      case "rejected": return "text-red-400";
      default: return "text-white";
    }
  };

  const getRiskColor = (score: number) => {
    if (score < 30) return "text-emerald-400";
    if (score < 70) return "text-yellow-400";
    return "text-red-400";
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">KYC Department</h1>
          <p className="text-white/60 mt-2">Loading KYC queue...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">KYC Department</h1>
        <p className="text-white/60 mt-2">Review and verify user identity documents</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-400">{kycItems.filter(i => i.status === "queued").length}</p>
            <p className="text-sm text-white/60">Queued</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-400">{kycItems.filter(i => i.status === "in_review").length}</p>
            <p className="text-sm text-white/60">In Review</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-400">{kycItems.filter(i => i.status === "approved").length}</p>
            <p className="text-sm text-white/60">Approved</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-400">{kycItems.filter(i => i.status === "rejected").length}</p>
            <p className="text-sm text-white/60">Rejected</p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex gap-4">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === "all" ? "bg-blue-500 text-white" : "bg-white/10 text-white/60 hover:bg-white/20"
            }`}
          >
            All ({kycItems.length})
          </button>
          <button
            onClick={() => setFilter("queued")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === "queued" ? "bg-yellow-500 text-white" : "bg-white/10 text-white/60 hover:bg-white/20"
            }`}
          >
            Queued ({kycItems.filter(i => i.status === "queued").length})
          </button>
          <button
            onClick={() => setFilter("in_review")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === "in_review" ? "bg-blue-500 text-white" : "bg-white/10 text-white/60 hover:bg-white/20"
            }`}
          >
            In Review ({kycItems.filter(i => i.status === "in_review").length})
          </button>
          <button
            onClick={() => setFilter("approved")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === "approved" ? "bg-emerald-500 text-white" : "bg-white/10 text-white/60 hover:bg-white/20"
            }`}
          >
            Approved ({kycItems.filter(i => i.status === "approved").length})
          </button>
          <button
            onClick={() => setFilter("rejected")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === "rejected" ? "bg-red-500 text-white" : "bg-white/10 text-white/60 hover:bg-white/20"
            }`}
          >
            Rejected ({kycItems.filter(i => i.status === "rejected").length})
          </button>
        </div>
      </Card>

      {/* KYC Queue */}
      <Section title="KYC Queue" subtitle="Review and process identity verification requests">
        <Card>
          {filteredItems.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">No KYC Items</h3>
              <p className="text-white/60">No items match your current filter.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredItems.map((item) => (
                <div key={item.id} className="p-4 border border-white/10 rounded-lg">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-medium text-lg">{item.userEmail}</h4>
                      <p className="text-sm text-white/60">
                        User ID: {item.userId} • Risk Score: 
                        <span className={`ml-1 ${getRiskColor(item.riskScore)}`}>
                          {item.riskScore}%
                        </span>
                      </p>
                      <p className="text-sm text-white/60">
                        Submitted: {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        item.status === "queued" ? "bg-yellow-500/20 text-yellow-400" :
                        item.status === "in_review" ? "bg-blue-500/20 text-blue-400" :
                        item.status === "approved" ? "bg-emerald-500/20 text-emerald-400" :
                        "bg-red-500/20 text-red-400"
                      }`}>
                        {item.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h5 className="text-sm font-medium text-white/80 mb-2">Documents:</h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {item.documents.map((doc, index) => (
                        <div key={index} className="p-2 bg-white/5 rounded border border-white/10">
                          <p className="text-xs text-white/60">{doc.type}</p>
                          <p className="text-xs font-medium">{doc.status}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {item.status === "queued" && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleStatusChange(item.id, "in_review")}
                        className="btn-primary px-4 py-2 text-sm"
                      >
                        Start Review
                      </button>
                      <button
                        onClick={() => handleStatusChange(item.id, "approved")}
                        className="px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm hover:bg-emerald-500/30 transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleStatusChange(item.id, "rejected")}
                        className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  )}

                  {item.status === "in_review" && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleStatusChange(item.id, "approved")}
                        className="btn-primary px-4 py-2 text-sm"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleStatusChange(item.id, "rejected")}
                        className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-colors"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleStatusChange(item.id, "queued")}
                        className="px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-lg text-sm hover:bg-yellow-500/30 transition-colors"
                      >
                        Return to Queue
                      </button>
                    </div>
                  )}

                  {item.reviewedBy && (
                    <p className="text-sm text-white/60 mt-2">
                      Reviewed by: {item.reviewedBy}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </Section>
    </div>
  );
}
