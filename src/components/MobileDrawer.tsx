"use client";

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import NavigationMenu from './NavigationMenu';
import NotificationsBell from './NotificationsBell';
import AIChatButton from './AIChatButton';
import ProfileDropdown from './ProfileDropdown';
// Fallback SVG icon
const XMarkIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
  const pathname = usePathname();

  // Close drawer when route changes
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-dropdown bg-black/50 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-black/95 backdrop-blur-xl border-r border-white/10 transform transition-transform duration-300 ease-in-out md:hidden ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Cryptorafts</h2>
              <p className="text-xs text-white/60">Crypto Ecosystem</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/60 hover:text-white transition-colors"
            aria-label="Close menu"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-4">
          <NavigationMenu mobile />
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/10 space-y-3">
          {/* Utility Actions */}
          <div className="flex items-center justify-between">
            <NotificationsBell />
            <AIChatButton />
          </div>

          {/* Profile */}
          <div className="pt-2">
            <ProfileDropdown />
          </div>

          {/* Quick Actions */}
          <div className="pt-2 space-y-2">
            <button className="w-full text-left px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
              <span className="flex items-center gap-2">
                <span>🔍</span>
                Search (⌘K)
              </span>
            </button>
            <button className="w-full text-left px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
              <span className="flex items-center gap-2">
                <span>❓</span>
                Help & Support
              </span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10">
          <div className="text-xs text-white/40 text-center">
            <p>© 2025 Cryptorafts</p>
            <p className="mt-1">Pitch. Invest. Build. Verify.</p>
          </div>
        </div>
      </div>
    </>
  );
}
