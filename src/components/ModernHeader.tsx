"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AnimatedMenuButton from './AnimatedMenuButton';
import NavigationMenu from './NavigationMenu';

export default function ModernHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // Handle menu toggle
  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsMenuOpen(false);
    }
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-black/20 backdrop-blur-md' : 'bg-transparent'
      }`}
      onKeyDown={handleKeyDown}
    >
      <div className="mx-auto max-w-[1600px] px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Logo */}
          <Link 
            href="/" 
            className="flex items-center hover:scale-105 transition-transform duration-200"
            aria-label="Cryptorafts Home"
          >
            <div className="relative w-24 h-24 flex items-center justify-center">
              <img 
                src="/cryptorafts_logo.png" 
                alt="Cryptorafts" 
                className="w-18 h-18 select-none"
                style={{ 
                  filter: 'drop-shadow(0 0 12px rgba(59, 130, 246, 0.5))',
                  transform: 'scale(3.2)',
                  transformOrigin: 'center'
                }}
              />
            </div>
          </Link>

          {/* Center: Branding Text */}
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <div className="text-xs font-bold text-white/90 tracking-widest">
              PITCH.INVEST.BUILD.VERIFY.
            </div>
            <div className="text-sm font-semibold text-white">
              Cryptorafts: AI-powered crypto ecosystem
            </div>
          </div>

          {/* Right: Action Buttons and Menu */}
          <div className="flex items-center gap-4">
            {/* Action Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <Link
                href="/register"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Get Started
              </Link>
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-white/80 hover:text-white transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 text-sm font-medium text-white/80 hover:text-white transition-colors"
              >
                Sign up
              </Link>
            </div>

            {/* Menu Button */}
            <div className="flex items-center">
              <AnimatedMenuButton 
                onClick={handleMenuToggle}
                isOpen={isMenuOpen}
                className=""
              />
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (
          <div className="absolute top-full right-4 mt-2 w-80 bg-black/90 backdrop-blur-md border border-white/10 rounded-lg shadow-xl">
            <div className="p-4">
              <NavigationMenu mobile={true} />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
