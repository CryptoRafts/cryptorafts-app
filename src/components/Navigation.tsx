"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/SimpleAuthProvider";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase.client";

export default function Navigation() {
  const { user, isLoading: loading } = useAuth();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      await fetch("/api/session", { method: "DELETE" });
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (loading) {
    return (
      <nav className="bg-white/5 backdrop-blur-lg border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-24">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-white">
                Cryptorafts
              </Link>
            </div>
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-black border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-32">
          {/* Logo */}
          <div className="flex items-center justify-center">
            <Link href="/" className="flex items-center">
              <Image 
                src="/cryptorafts.logo.png" 
                alt="Cryptorafts" 
                width={180}
                height={180}
                sizes="180px"
                className="logo-3x"
                priority
                style={{ width: 'auto', height: 'auto' }}
              />
            </Link>
          </div>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-8">
                <Link href="/" className="relative px-4 py-2 text-white/80 hover:text-white transition-all duration-300 group">
                  <span className="relative z-10">Home</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute inset-0 border border-blue-400/30 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
                </Link>
                <Link href="/about" className="relative px-4 py-2 text-white/80 hover:text-white transition-all duration-300 group">
                  <span className="relative z-10">About</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute inset-0 border border-blue-400/30 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
                </Link>
                <Link href="/features" className="relative px-4 py-2 text-white/80 hover:text-white transition-all duration-300 group">
                  <span className="relative z-10">Features</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute inset-0 border border-blue-400/30 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
                </Link>
                {user && (
                  <Link href="/chat" className="relative px-4 py-2 text-white/80 hover:text-white transition-all duration-300 group">
                    <span className="relative z-10">Chat</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute inset-0 border border-blue-400/30 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
                  </Link>
                )}
                <Link href="/contact" className="relative px-4 py-2 text-white/80 hover:text-white transition-all duration-300 group">
                  <span className="relative z-10">Contact</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute inset-0 border border-blue-400/30 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
                </Link>
              </div>

          {/* Auth Section */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-white/80 text-sm">
                  Welcome, {user.displayName || user.email}
                </span>
                <Link 
                  href="/dashboard" 
                  className="relative px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg transition-all duration-300 group overflow-hidden"
                >
                  <span className="relative z-10">Dashboard</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute inset-0 border border-blue-400/30 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="relative px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg transition-all duration-300 group overflow-hidden"
                >
                  <span className="relative z-10">Sign Out</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-red-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute inset-0 border border-red-400/30 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link 
                  href="/login" 
                  className="relative px-4 py-2 text-white/80 hover:text-white transition-all duration-300 group"
                >
                  <span className="relative z-10">Log In</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute inset-0 border border-blue-400/30 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
                </Link>
                <Link 
                  href="/signup" 
                  className="relative px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg transition-all duration-300 group overflow-hidden"
                >
                  <span className="relative z-10">Sign Up</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute inset-0 border border-blue-400/30 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-white/80 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-white/10 py-4">
            <div className="flex flex-col space-y-4">
              <Link href="/" className="relative px-4 py-2 text-white/80 hover:text-white transition-all duration-300 group">
                <span className="relative z-10">Home</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute inset-0 border border-blue-400/30 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
              </Link>
              <Link href="/about" className="relative px-4 py-2 text-white/80 hover:text-white transition-all duration-300 group">
                <span className="relative z-10">About</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute inset-0 border border-blue-400/30 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
              </Link>
              <Link href="/features" className="relative px-4 py-2 text-white/80 hover:text-white transition-all duration-300 group">
                <span className="relative z-10">Features</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute inset-0 border border-blue-400/30 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
              </Link>
              {user && (
                <Link href="/chat" className="relative px-4 py-2 text-white/80 hover:text-white transition-all duration-300 group">
                  <span className="relative z-10">Chat</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute inset-0 border border-blue-400/30 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
                </Link>
              )}
              <Link href="/contact" className="relative px-4 py-2 text-white/80 hover:text-white transition-all duration-300 group">
                <span className="relative z-10">Contact</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute inset-0 border border-blue-400/30 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
              </Link>
              {user ? (
                <div className="flex flex-col space-y-2">
                  <Link 
                    href="/dashboard" 
                    className="relative px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg transition-all duration-300 group overflow-hidden text-center"
                  >
                    <span className="relative z-10">Dashboard</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute inset-0 border border-blue-400/30 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="relative px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg transition-all duration-300 group overflow-hidden text-center"
                  >
                    <span className="relative z-10">Sign Out</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-red-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute inset-0 border border-red-400/30 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col space-y-2">
                  <Link 
                    href="/login" 
                    className="relative px-4 py-2 text-white/80 hover:text-white transition-all duration-300 group text-center"
                  >
                    <span className="relative z-10">Log In</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute inset-0 border border-blue-400/30 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
                  </Link>
                  <Link 
                    href="/signup" 
                    className="relative px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg transition-all duration-300 group overflow-hidden text-center"
                  >
                    <span className="relative z-10">Sign Up</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute inset-0 border border-blue-400/30 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
