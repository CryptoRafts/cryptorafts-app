"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface RoleAwareNavigationProps {
  userRole?: string;
  className?: string;
}

export default function RoleAwareNavigation({ userRole, className = '' }: RoleAwareNavigationProps) {
  const pathname = usePathname();

  const navigationItems = [
    { name: 'Dashboard', href: '/dashboard', roles: ['admin', 'vc', 'founder', 'agency', 'influencer', 'ido'] },
    { name: 'Projects', href: '/projects', roles: ['admin', 'vc', 'founder', 'agency', 'influencer', 'ido'] },
    { name: 'Deal Rooms', href: '/deal-rooms', roles: ['vc', 'founder'] },
    { name: 'Portfolio', href: '/portfolio', roles: ['vc', 'founder'] },
    { name: 'Messages', href: '/messages', roles: ['admin', 'vc', 'founder', 'agency', 'influencer', 'ido'] },
  ];

  const filteredItems = navigationItems.filter(item => 
    !userRole || item.roles.includes(userRole)
  );

  return (
    <nav className={`flex space-x-4 ${className}`}>
      {filteredItems.map((item) => (
        <Link
          key={item.name}
          href={item.href}
          className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            pathname === item.href
              ? 'bg-blue-500 text-white'
              : 'text-gray-300 hover:text-white hover:bg-gray-700'
          }`}
        >
          {item.name}
        </Link>
      ))}
    </nav>
  );
}

// Named export for compatibility
export { RoleAwareNavigation };