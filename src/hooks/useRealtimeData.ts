"use client";
import { useEffect, useState, useCallback } from "react";
import { onSnapshot, doc, collection, query, where, orderBy, DocumentSnapshot, QuerySnapshot, Query } from "firebase/firestore";
import { db } from "@/lib/firebase.client";

interface UseRealtimeDataOptions {
  enabled?: boolean;
  onError?: (error: Error) => void;
}

export function useRealtimeDocument<T>(
  path: string,
  options: UseRealtimeDataOptions = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const handleError = useCallback((err: Error) => {
    console.error(`Error in useRealtimeDocument(${path}):`, err);
    setError(err);
    setLoading(false);
    options.onError?.(err);
  }, [path, options]);

  useEffect(() => {
    if (!options.enabled) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    if (!db) {
      console.warn('Firestore not initialized, skipping realtime document subscription');
      setLoading(false);
      return () => {};
    }

    const unsubscribe = onSnapshot(
      doc(db!, path),
      (snapshot: DocumentSnapshot) => {
        if (snapshot.exists()) {
          setData(snapshot.data() as T);
        } else {
          setData(null);
        }
        setLoading(false);
      },
      (err) => {
        handleError(err);
      }
    );

    return () => unsubscribe();
  }, [path, options.enabled, handleError]);

  return { data, loading, error };
}

export function useRealtimeCollection<T>(
  path: string,
  options: UseRealtimeDataOptions & {
    query?: any;
    orderBy?: [string, "asc" | "desc"];
    where?: [string, any, any];
  } = {}
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const handleError = useCallback((err: Error) => {
    console.error(`Error in useRealtimeCollection(${path}):`, err);
    setError(err);
    setLoading(false);
    options.onError?.(err);
  }, [path, options]);

  useEffect(() => {
    if (!options.enabled) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    if (!db) {
      console.warn('Firestore not initialized, skipping realtime collection subscription');
      setLoading(false);
      return () => {};
    }

    let queryRef: Query = collection(db!, path);
    
    if (options.where) {
      queryRef = query(queryRef, where(...options.where));
    }
    
    if (options.orderBy) {
      queryRef = query(queryRef, orderBy(...options.orderBy));
    }

    const unsubscribe = onSnapshot(
      queryRef,
      (snapshot: QuerySnapshot) => {
        const items = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as T[];
        setData(items);
        setLoading(false);
      },
      (err) => {
        handleError(err);
      }
    );

    return () => unsubscribe();
  }, [path, options.enabled, options.where, options.orderBy, handleError]);

  return { data, loading, error };
}
