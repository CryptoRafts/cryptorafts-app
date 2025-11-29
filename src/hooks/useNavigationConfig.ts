"use client";

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase.client';
import { doc, onSnapshot } from 'firebase/firestore';
import { useRoleFlags } from '@/lib/guards';

export interface NavItem {
  label: string;
  href: string;
  visible: boolean;
  order: number;
  cta?: boolean;
}

export interface RoleConfig {
  primary: NavItem;
  submenu: NavItem[];
}

export interface GlobalConfig {
  logo: string;
  items: NavItem[];
}

export interface NavigationConfig {
  global: GlobalConfig | null;
  role: RoleConfig | null;
  loading: boolean;
  error: string | null;
}

// Fallback minimal config
const FALLBACK_CONFIG: GlobalConfig = {
  logo: "/cryptorafts.logo.png",
  items: [
    {"label":"Home","href":"/","visible":true,"order":1},
    {"label":"Project Overview","href":"/projects","visible":true,"order":2},
    {"label":"Pitch Your Project","href":"/register","visible":true,"order":3,"cta":true},
    {"label":"Support","href":"/support","visible":true,"order":4},
    {"label":"Contact Us","href":"/contact","visible":true,"order":5}
  ]
};

export function useNavigationConfig(): NavigationConfig {
  const [global, setGlobal] = useState<GlobalConfig | null>(null);
  const [role, setRole] = useState<RoleConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { role: userRole, isAuthed } = useRoleFlags();

  useEffect(() => {
    setLoading(true);
    setError(null);

    if (!db) {
      console.warn('Firestore not initialized, using fallback navigation config');
      setGlobal(FALLBACK_CONFIG);
      setRole(null);
      setLoading(false);
      return () => {};
    }

    // Subscribe to global config
    const globalUnsubscribe = onSnapshot(
      doc(db!, 'navConfig', 'global'),
      (snapshot) => {
        if (snapshot.exists()) {
          setGlobal(snapshot.data() as GlobalConfig);
        } else {
          setGlobal(FALLBACK_CONFIG);
        }
      },
      (err) => {
        console.error('Error loading global nav config:', err);
        setError('Failed to load navigation configuration');
        setGlobal(FALLBACK_CONFIG);
      }
    );

    // Subscribe to role config if user is authenticated and has a role
    let roleUnsubscribe: (() => void) | null = null;
    
    if (isAuthed && userRole && userRole !== 'admin') {
      // Use proper collection structure: navConfig/roleConfigs/{role}
      roleUnsubscribe = onSnapshot(
        doc(db!, 'navConfig', 'roleConfigs', userRole),
        (snapshot) => {
          if (snapshot.exists()) {
            setRole(snapshot.data() as RoleConfig);
          } else {
            setRole(null);
          }
        },
        (err) => {
          console.error(`Error loading ${userRole} nav config:`, err);
          setRole(null);
        }
      );
    } else {
      setRole(null);
    }

    setLoading(false);

    return () => {
      globalUnsubscribe();
      if (roleUnsubscribe) {
        roleUnsubscribe();
      }
    };
  }, [isAuthed, userRole]);

  return {
    global,
    role,
    loading,
    error
  };
}

// Hook for getting filtered navigation items
export function useFilteredNavigation() {
  const { global, role, loading } = useNavigationConfig();
  const { isAuthed, role: userRole, isFounder, kyc } = useRoleFlags();

  const getPublicItems = (): NavItem[] => {
    if (!global) return FALLBACK_CONFIG.items;
    
    return global.items
      .filter(item => item.visible)
      .sort((a, b) => a.order - b.order)
      .map(item => {
        // Special handling for "Pitch Your Project"
        if (item.label === "Pitch Your Project") {
          if (isAuthed && isFounder) {
            if (kyc === "verified") {
              return { ...item, href: "/founder/pitch" };
            } else {
              return { ...item, href: "/kyc" };
            }
          } else if (isAuthed && userRole && userRole !== "founder") {
            return { ...item, href: "/role", label: "Pitch Your Project (Founders Only)" };
          }
        }
        return item;
      });
  };

  const getRoleItems = (): RoleConfig | null => {
    if (!isAuthed || !userRole || userRole === 'admin') {
      return null;
    }
    return role;
  };

  return {
    publicItems: getPublicItems(),
    roleItems: getRoleItems(),
    loading,
    isAuthed,
    userRole
  };
}
