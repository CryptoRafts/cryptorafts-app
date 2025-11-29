"use client";

import { useMemo } from 'react';
import { useSimpleAuth } from '@/lib/auth-simple';

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

// Static navigation configuration
const STATIC_GLOBAL_NAV: NavItem[] = [
  {"label":"Home","href":"/","visible":true,"order":1},
  {"label":"Projects","href":"/projects","visible":true,"order":2},
  {"label":"Pitch Your Project","href":"/register","visible":true,"order":3,"cta":true},
  {"label":"Support","href":"/support","visible":true,"order":4},
  {"label":"Contact","href":"/contact","visible":true,"order":5}
];

const STATIC_ROLE_CONFIGS: Record<string, RoleConfig> = {
  founder: {
    primary: {
      label: "Founder Dashboard",
      href: "/founder/dashboard",
      visible: true,
      order: 1
    },
    submenu: [
      {"label":"Pitch Project","href":"/founder/pitch","visible":true,"order":1},
      {"label":"KYC Verification","href":"/founder/kyc","visible":true,"order":2},
      {"label":"Messages","href":"/founder/messages","visible":true,"order":3}
    ]
  },
  vc: {
    primary: {
      label: "VC Dashboard",
      href: "/vc/dashboard",
      visible: true,
      order: 1
    },
    submenu: [
      {"label":"Deal Flow","href":"/vc/dealflow","visible":true,"order":1},
      {"label":"Portfolio","href":"/vc/portfolio","visible":true,"order":2},
      {"label":"Analytics","href":"/vc/analytics","visible":true,"order":3}
    ]
  },
  exchange: {
    primary: {
      label: "Exchange Dashboard",
      href: "/exchange/dashboard",
      visible: true,
      order: 1
    },
    submenu: [
      {"label":"Listing Pipeline","href":"/exchange/listings","visible":true,"order":1},
      {"label":"Due Diligence","href":"/exchange/due-diligence","visible":true,"order":2},
      {"label":"Compliance","href":"/exchange/compliance","visible":true,"order":3}
    ]
  },
  ido: {
    primary: {
      label: "IDO Dashboard",
      href: "/ido/dashboard",
      visible: true,
      order: 1
    },
    submenu: [
      {"label":"Launch Pipeline","href":"/ido/pipeline","visible":true,"order":1},
      {"label":"Token Metrics","href":"/ido/metrics","visible":true,"order":2},
      {"label":"Community","href":"/ido/community","visible":true,"order":3}
    ]
  },
  influencer: {
    primary: {
      label: "Influencer Dashboard",
      href: "/influencer/dashboard",
      visible: true,
      order: 1
    },
    submenu: [
      {"label":"Campaigns","href":"/influencer/campaigns","visible":true,"order":1},
      {"label":"Analytics","href":"/influencer/analytics","visible":true,"order":2},
      {"label":"Content","href":"/influencer/content","visible":true,"order":3}
    ]
  },
  agency: {
    primary: {
      label: "Agency Dashboard",
      href: "/agency/dashboard",
      visible: true,
      order: 1
    },
    submenu: [
      {"label":"Client Management","href":"/agency/clients","visible":true,"order":1},
      {"label":"Campaigns","href":"/agency/campaigns","visible":true,"order":2},
      {"label":"Reports","href":"/agency/reports","visible":true,"order":3}
    ]
  }
};

export function useSimpleNavigation() {
  const { user, profile, isAuthed } = useSimpleAuth();

  const publicItems = useMemo(() => {
    return STATIC_GLOBAL_NAV
      .filter(item => item.visible)
      .sort((a, b) => a.order - b.order)
      .map(item => {
        // Special handling for "Pitch Your Project"
        if (item.label === "Pitch Your Project") {
          if (isAuthed && profile?.role === 'founder') {
            if (profile.kycStatus === 'approved') {
              return { ...item, href: "/founder/pitch" };
            } else {
              return { ...item, href: "/founder/kyc" };
            }
          } else if (isAuthed && profile?.role && profile.role !== "founder") {
            return { ...item, href: "/role", label: "Pitch Your Project (Founders Only)" };
          }
        }
        return item;
      });
  }, [isAuthed, profile]);

  const roleItems = useMemo(() => {
    if (!isAuthed || !profile?.role || profile.role === 'admin') {
      return null;
    }
    return STATIC_ROLE_CONFIGS[profile.role] || null;
  }, [isAuthed, profile]);

  return {
    publicItems,
    roleItems,
    loading: false,
    isAuthed,
    userRole: profile?.role
  };
}
