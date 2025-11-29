"use client";
import { useEffect, useState } from "react";
import { useRoleFlags } from "@/lib/guards";
import { db, collection, query, where, onSnapshot, limit } from "@/lib/firebase.client";
import Link from "next/link";

export default function ProjectsPage() {
  const { user, isAuthed } = useRoleFlags();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) return;
    const q = query(
      collection(db!, "projects"),
      where("pitch.submitted", "==", true),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projectData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProjects(projectData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white/60">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Featured Projects</h1>
        <p className="text-white/60 mt-2">Discover verified crypto projects on our platform</p>
      </div>

      {projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => (
            <div key={project.id} className="glass p-6 rounded-2xl space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{project.title || "Untitled Project"}</h3>
                  <p className="text-white/60 text-sm">{project.sector} • {project.chain}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  project.raftai?.rating === "High" ? "bg-emerald-500/20 text-emerald-400" :
                  project.raftai?.rating === "Normal" ? "bg-blue-500/20 text-blue-400" :
                  "bg-orange-500/20 text-orange-400"
                }`}>
                  {project.raftai?.rating || "Normal"}
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white/60">AI Score:</span>
                  <span className="font-medium">{project.raftai?.score || 0}/100</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white/60">Stage:</span>
                  <span className="text-sm">{project.stage || "Unknown"}</span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Link 
                  href={`/projects/${project.id}`}
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="font-semibold mb-2">No projects yet</h3>
          <p className="text-white/60 text-sm mb-4">Be the first to submit a project</p>
          {isAuthed ? (
            <Link href="/role" className="btn-primary">
              Choose Your Role
            </Link>
          ) : (
            <Link href="/login" className="btn-primary">
              Sign In
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
