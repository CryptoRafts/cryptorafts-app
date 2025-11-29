// Safe Firestore hook with listener management

import { useEffect, useRef, useState } from 'react';
import { doc, query, collection, DocumentReference, Query } from 'firebase/firestore';
import { db } from './firebase.client';
import { listenerManager } from './firestore-listener-manager';

/**
 * Hook for listening to a Firestore document
 */
export function useDocument<T = any>(
  collectionPath: string,
  docId: string | undefined,
  options?: { enabled?: boolean }
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const keyRef = useRef<string>('');

  useEffect(() => {
    if (!docId || options?.enabled === false) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    const key = `doc_${collectionPath}_${docId}`;
    keyRef.current = key;

    console.log('useDocument: Setting up listener', { collectionPath, docId, key });

    const docRef = doc(db!, collectionPath, docId);

    const unsubscribe = listenerManager.attachListener(
      key,
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setData({ id: snapshot.id, ...snapshot.data() } as T);
        } else {
          setData(null);
        }
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('useDocument: Error', { collectionPath, docId, error: err.message });
        setError(err);
        setLoading(false);
      }
    );

    return () => {
      console.log('useDocument: Cleaning up listener', { key });
      listenerManager.detachListener(key);
    };
  }, [collectionPath, docId, options?.enabled]);

  return { data, loading, error };
}

/**
 * Hook for listening to a Firestore collection
 */
export function useCollection<T = any>(
  collectionPath: string,
  queryFn?: (collection: any) => Query,
  options?: { enabled?: boolean }
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const keyRef = useRef<string>('');

  useEffect(() => {
    if (options?.enabled === false) {
      setData([]);
      setLoading(false);
      setError(null);
      return;
    }

    const key = `collection_${collectionPath}_${queryFn ? 'query' : 'all'}`;
    keyRef.current = key;

    console.log('useCollection: Setting up listener', { collectionPath, key });

    const collectionRef = collection(db!, collectionPath);
    const queryRef = queryFn ? queryFn(collectionRef) : collectionRef;

    const unsubscribe = listenerManager.attachListener(
      key,
      queryRef,
      (snapshot) => {
        const docs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as T[];
        setData(docs);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('useCollection: Error', { collectionPath, error: err.message });
        setError(err);
        setLoading(false);
      }
    );

    return () => {
      console.log('useCollection: Cleaning up listener', { key });
      listenerManager.detachListener(key);
    };
  }, [collectionPath, queryFn, options?.enabled]);

  return { data, loading, error };
}

/**
 * Hook for getting user document
 */
export function useUserDocument(userId?: string) {
  return useDocument('users', userId, { enabled: !!userId });
}

/**
 * Hook for getting user projects
 */
export function useUserProjects(userId?: string) {
  return useCollection(
    'projects',
    userId ? (collection) => query(collection, where('founderId', '==', userId)) : undefined,
    { enabled: !!userId }
  );
}
