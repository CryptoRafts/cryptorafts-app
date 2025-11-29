"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase.client";
import Link from "next/link";

export default function DepartmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [department, setDepartment] = useState<string>("");

  useEffect(() => {
    // Extract department from pathname
    const pathParts = pathname.split("/");
    const dept = pathParts[2];

    if (!auth) {
      router.push(`/dept/${dept}/login`);
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (pathname.includes("/login")) {
        setLoading(false);
        return;
      }

      if (!user) {
        router.push(`/dept/${dept}/login`);
        setLoading(false);
        return;
      }

      try {
        const token = await user.getIdToken();
        const response = await fetch("/api/dept/guard/complete", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ department: dept })
        });

        if (response.ok) {
          setHasAccess(true);
          setDepartment(dept);
        } else {
          router.push(`/dept/${dept}/login`);
        }
      } catch (error) {
        console.error("Department access verification failed:", error);
        router.push(`/dept/${dept}/login`);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [router, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white/60">Loading department portal...</div>
      </div>
    );
  }

  if (pathname.includes("/login")) {
    return <>{children}</>;
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass p-8 rounded-2xl text-center">
          <h1 className="text-2xl font-bold mb-4 text-red-400">Access Denied</h1>
          <p className="text-white/60 mb-6">You don't have access to this department.</p>
          <button
            onClick={() => auth && signOut(auth)}
            className="btn btn-outline px-6 py-3"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent">
      {/* Department Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href={`/dept/${department}`} className="text-xl font-bold">
                {department.toUpperCase()} Department
              </Link>
              <div className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 rounded text-xs text-blue-400">
                <span>DEPT</span>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-6">
              <Link 
                href={`/dept/${department}`} 
                className={`text-sm hover:text-white transition-colors ${pathname === `/dept/${department}` ? "text-white" : "text-white/60"}`}
              >
                Dashboard
              </Link>
              <Link 
                href={`/dept/${department}/queue`} 
                className={`text-sm hover:text-white transition-colors ${pathname.includes("/queue") ? "text-white" : "text-white/60"}`}
              >
                Queue
              </Link>
              <Link 
                href={`/dept/${department}/reports`} 
                className={`text-sm hover:text-white transition-colors ${pathname.includes("/reports") ? "text-white" : "text-white/60"}`}
              >
                Reports
              </Link>
            </nav>

            <button
              onClick={() => auth && signOut(auth)}
              className="text-sm text-white/60 hover:text-white transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
