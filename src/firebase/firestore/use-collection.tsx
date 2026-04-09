'use client';

import { useState, useEffect } from 'react';
import { onSnapshot, Query, DocumentData, QuerySnapshot } from 'firebase/firestore';

interface UseCollectionReturn<T> {
  data: T[] | null;
  loading: boolean;
  error: Error | null;
}

// Global cache to prevent loading flashes across page navigation
const globalQueryCache: Record<string, any[]> = {};

export function useCollection<T>(query: Query<DocumentData> | null, cacheKey?: string): UseCollectionReturn<T> {
  const [data, setData] = useState<T[] | null>(() => {
    if (cacheKey && globalQueryCache[cacheKey]) return globalQueryCache[cacheKey];
    return null;
  });
  const [loading, setLoading] = useState<boolean>(() => {
    if (cacheKey && globalQueryCache[cacheKey]) return false;
    return true;
  });
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!query) {
      setData([]);
      setLoading(false);
      return;
    }

    if (!cacheKey || !globalQueryCache[cacheKey]) {
      setLoading(true);
    }
    
    const unsubscribe = onSnapshot(
      query,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
        if (cacheKey) globalQueryCache[cacheKey] = docs;
        setData(docs);
        setLoading(false);
        setError(null);
      },
      (err: Error) => {
        console.error("Error fetching collection: ", err);
        setError(err);
        setLoading(false);
      }
    );

    // Clean up the listener on unmount
    return () => unsubscribe();
  }, [query, cacheKey]);

  return { data, loading, error };
}
