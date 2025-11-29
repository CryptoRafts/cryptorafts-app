// Central role definitions and utilities
export type Role = "founder" | "vc" | "exchange" | "ido" | "influencer" | "agency" | "admin";

// Role home routes
export const ROLE_HOMES: Record<Role, string> = {
  founder: "/founder",
  vc: "/vc", 
  exchange: "/exchange",
  ido: "/ido",
  influencer: "/influencer",
  agency: "/agency",
  admin: "/admin"
};

// Role verification paths
export const ROLE_VERIFY_PATHS: Record<Role, string> = {
  founder: "/founder/kyc",
  vc: "/vc/kyb",
  exchange: "/exchange/kyb", 
  ido: "/ido/kyb",
  influencer: "/influencer/kyc",
  agency: "/agency/kyb",
  admin: "/admin"
};

// Verification requirements
export const NEEDS_KYC: Set<Role> = new Set(["founder", "influencer"]);
export const NEEDS_KYB: Set<Role> = new Set(["vc", "exchange", "ido", "agency"]);

// Utility functions
export function roleHome(role?: Role): string {
  return role ? ROLE_HOMES[role] : "/role";
}

export function roleVerifyPath(role?: Role): string {
  return role ? ROLE_VERIFY_PATHS[role] : "/role";
}

export function needsKyc(role: Role): boolean {
  return NEEDS_KYC.has(role);
}

export function needsKyb(role: Role): boolean {
  return NEEDS_KYB.has(role);
}

export function isValidRole(role: string): role is Role {
  return Object.keys(ROLE_HOMES).includes(role);
}
