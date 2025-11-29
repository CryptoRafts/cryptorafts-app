"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '@/lib/firebase.client';

interface SafeFirestoreProviderProps {
  children: React.ReactNode;
}

interface FirestoreContextType {
  isConnected: boolean;
  error: string | null;
}

const FirestoreContext = createContext<FirestoreContextType>({
  isConnected: false,
  error: null,
});

export default function SafeFirestoreProvider({ children }: SafeFirestoreProviderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simple connection test
    const testConnection = async () => {
      try {
        // Try to access Firestore
        if (db) {
          setIsConnected(true);
          setError(null);
        } else {
          setError('Firestore not initialized');
        }
      } catch (err) {
        setError('Failed to connect to Firestore');
        setIsConnected(false);
      }
    };

    testConnection();
  }, []);

  return (
    <FirestoreContext.Provider value={{ isConnected, error }}>
      {children}
    </FirestoreContext.Provider>
  );
}

// Named export for compatibility
export { SafeFirestoreProvider };

export const useFirestore = () => useContext(FirestoreContext);