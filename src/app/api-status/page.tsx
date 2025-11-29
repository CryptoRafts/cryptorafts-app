"use client";

import { useState, useEffect } from "react";

export default function APIStatusPage() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAPIs = async () => {
      const apis = [
        { name: "Health", url: "/api/health" },
        { name: "Simple Test", url: "/api/simple-test" },
        { name: "Firebase Simple", url: "/api/firebase-simple" },
        { name: "Firebase Debug", url: "/api/debug-firebase" },
        { name: "Role API", url: "/api/onboarding/role", method: "POST", body: { role: "founder" }, headers: { "x-user-id": "test-user" } }
      ];

      const results = await Promise.allSettled(
        apis.map(async (api) => {
          try {
            const options: RequestInit = {
              method: api.method || "GET",
              headers: {
                "Content-Type": "application/json",
                ...api.headers
              }
            };

            if (api.body) {
              options.body = JSON.stringify(api.body);
            }

            const response = await fetch(api.url, options);
            const data = await response.json();
            
            return {
              name: api.name,
              status: response.ok ? "success" : "error",
              statusCode: response.status,
              data: data
            };
          } catch (error) {
            return {
              name: api.name,
              status: "error",
              error: error instanceof Error ? error.message : "Unknown error"
            };
          }
        })
      );

      setStatus({
        timestamp: new Date().toISOString(),
        apis: results.map((result, index) => ({
          ...apis[index],
          result: result.status === "fulfilled" ? result.value : { status: "error", error: result.reason }
        }))
      });
      setLoading(false);
    };

    checkAPIs();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#05070B] to-[#0A1117] flex items-center justify-center">
        <div className="text-white">Loading API status...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#05070B] to-[#0A1117] p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">API Status Dashboard</h1>
        
        <div className="grid gap-6">
          {status?.apis.map((api: any, index: number) => (
            <div key={index} className="bg-white/5 p-6 rounded-lg border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">{api.name}</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  api.result.status === "success" 
                    ? "bg-green-500/20 text-green-400" 
                    : "bg-red-500/20 text-red-400"
                }`}>
                  {api.result.status}
                </span>
              </div>
              
              <div className="space-y-2 text-sm text-white/80">
                <p><strong>URL:</strong> {api.url}</p>
                {api.method && <p><strong>Method:</strong> {api.method}</p>}
                {api.result.statusCode && <p><strong>Status Code:</strong> {api.result.statusCode}</p>}
                {api.result.error && <p><strong>Error:</strong> {api.result.error}</p>}
              </div>
              
              {api.result.data && (
                <details className="mt-4">
                  <summary className="text-white/60 cursor-pointer">Response Data</summary>
                  <pre className="mt-2 p-4 bg-black/20 rounded text-white/80 text-xs overflow-x-auto">
                    {JSON.stringify(api.result.data, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-8 text-white/60 text-sm">
          Last updated: {status?.timestamp}
        </div>
      </div>
    </div>
  );
}
