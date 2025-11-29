import { useState, useEffect, useRef } from 'react';
import { Query, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { logger } from '@/lib/logger';

export function useFirestoreQuery<T>(query: Query | null) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const unsubscribeRef = useRef<Unsubscribe | null>(null);

  useEffect(() => {
    if (!query) {
      setData([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    // Clean up previous subscription
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    // Set up new subscription
    unsubscribeRef.current = onSnapshot(
      query,
      (snapshot) => {
        const docs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as T));
        
        setData(docs);
        setLoading(false);
        setError(null);
      },
      (err) => {
        logger.error('Firestore query error', { error: err.message });
        setError(err);
        setLoading(false);
      }
    );

    // Cleanup function
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [query]);

  return { data, loading, error };
}
