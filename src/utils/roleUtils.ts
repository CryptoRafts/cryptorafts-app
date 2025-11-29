"use client";

export function clearAllRoleData(userId?: string) {
  console.log("🧹 Clearing all role data...");
  
  // Clear localStorage
  localStorage.removeItem('userRole');
  localStorage.removeItem('userRoleSelected');
  localStorage.removeItem('userClaims');
  
  // Clear user-specific cache
  if (userId) {
    localStorage.removeItem(`user_claims_${userId}`);
  }
  
  // Clear any other cached data
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith('user_claims_') || key.includes('role')) {
      localStorage.removeItem(key);
    }
  });
  
  console.log("✅ All role data cleared");
}

export function forceRoleSelection() {
  console.log("🔄 Forcing role selection...");
  clearAllRoleData();
  window.location.href = '/role';
}

export function getCurrentRoleData() {
  return {
    userRole: localStorage.getItem('userRole'),
    roleSelected: localStorage.getItem('userRoleSelected'),
    userClaims: localStorage.getItem('userClaims'),
    currentPath: window.location.pathname,
    timestamp: new Date().toISOString()
  };
}
