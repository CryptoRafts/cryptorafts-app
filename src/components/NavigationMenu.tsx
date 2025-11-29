"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavigationMenuProps {
  className?: string;
  mobile?: boolean;
}

export default function NavigationMenu({ className = '', mobile = false }: NavigationMenuProps) {
  const pathname = usePathname();

  // Direct navigation items - always visible
  const publicItems = [
    {"label":"Home","href":"/","visible":true,"order":1},
    {"label":"Project Overview","href":"/projects","visible":true,"order":2},
    {"label":"Blog","href":"/blog","visible":true,"order":3},
    {"label":"Pitch Your Project","href":"/register","visible":true,"order":4,"cta":true},
    {"label":"Support","href":"/support","visible":true,"order":5},
    {"label":"Contact Us","href":"/contact","visible":true,"order":6}
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  const renderNavItem = (item: any, index: number) => {
    const active = isActive(item.href);
    
    if (mobile) {
      return (
        <Link
          key={`${item.href}-${index}`}
          href={item.href}
          className={`block px-4 py-3 text-sm font-medium transition-all duration-300 rounded-lg ${
            active 
              ? 'text-white font-semibold bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-l-4 border-blue-400' 
              : 'text-white/80 hover:text-white hover:bg-white/5'
          } ${item.cta ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30' : ''}`}
          aria-current={active ? 'page' : undefined}
        >
          <div className="flex items-center justify-between">
            <span>{item.label}</span>
            {item.cta && (
              <span className="text-lg">✨</span>
            )}
          </div>
        </Link>
      );
    }
    
    return (
      <Link
        key={`${item.href}-${index}`}
        href={item.href}
        className={`relative px-3 py-2 text-sm font-medium transition-all duration-200 hover:scale-105 hover:-translate-y-0.5 ${
          active 
            ? 'text-white font-semibold' 
            : 'text-white/80 hover:text-white'
        } ${item.cta ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg border border-blue-500/30' : ''}`}
        aria-current={active ? 'page' : undefined}
      >
        {item.label}
        {active && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full" />
        )}
        {item.cta && (
          <span className="ml-1 text-xs text-blue-300">✨</span>
        )}
      </Link>
    );
  };

  if (mobile) {
    return (
      <div className={`space-y-4 ${className}`}>
        <nav className="space-y-3">
          {publicItems.map((item, index) => renderNavItem(item, index))}
        </nav>
      </div>
    );
  }

  return (
    <nav className={`flex items-center space-x-1 ${className}`}>
      {/* Public Items */}
      {publicItems.map((item, index) => renderNavItem(item, index))}
    </nav>
  );
}
