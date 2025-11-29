"use client";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/providers/SimpleAuthProvider";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, isLoading: loading } = useAuth();
  const router = useRouter();
  const path = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/login?next=${encodeURIComponent(path)}`);
    }
  }, [loading, user, path, router]);

  if (loading) return null; // or a tiny skeleton
  return <>{children}</>;
}
