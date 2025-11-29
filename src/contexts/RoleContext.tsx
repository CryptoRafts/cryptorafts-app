"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';

interface RoleContextType {
  role: string | null;
  setRole: (role: string) => void;
  clearRole: () => void;
  isLoading: boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load role from localStorage on mount
    const storedRole = localStorage.getItem('userRole');
    const roleSelected = localStorage.getItem('userRoleSelected');
    
    if (storedRole && roleSelected === 'true') {
      setRoleState(storedRole);
    }
    
    setIsLoading(false);
  }, []);

  const setRole = (newRole: string) => {
    setRoleState(newRole);
    localStorage.setItem('userRole', newRole);
    localStorage.setItem('userRoleSelected', 'true');
  };

  const clearRole = () => {
    setRoleState(null);
    localStorage.removeItem('userRole');
    localStorage.removeItem('userRoleSelected');
  };

  return (
    <RoleContext.Provider value={{ role, setRole, clearRole, isLoading }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}
