// Performance Optimization Utilities
import { useMemo, useCallback, useEffect, useRef } from 'react';

// Memoization utilities
export const memoize = <T extends (...args: any[]) => any>(fn: T): T => {
  const cache = new Map();
  
  return ((...args: any[]) => {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn(...args);
    cache.set(key, result);
    
    // Limit cache size to prevent memory leaks
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    
    return result;
  }) as T;
};

// Debounce utility for search and input handling
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Throttle utility for scroll and resize events
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
};

// Custom hook for memoized selectors
export const useMemoizedSelector = <T>(
  selector: () => T,
  deps: any[]
): T => {
  return useMemo(selector, deps);
};

// Custom hook for stable callbacks
export const useStableCallback = <T extends (...args: any[]) => any>(
  callback: T
): T => {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;
  
  return useCallback(
    ((...args: any[]) => callbackRef.current(...args)) as T,
    []
  );
};

// Custom hook for intersection observer (virtual scrolling)
export const useIntersectionObserver = (
  callback: IntersectionObserverCallback,
  options?: IntersectionObserverInit
) => {
  const targetRef = useRef<Element | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  
  useEffect(() => {
    if (!targetRef.current) return;
    
    observerRef.current = new IntersectionObserver(callback, options);
    observerRef.current.observe(targetRef.current);
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [callback, options]);
  
  return targetRef;
};

// Virtual scrolling utilities
export interface VirtualScrollItem {
  id: string;
  height: number;
}

export const useVirtualScroll = (
  items: VirtualScrollItem[],
  containerHeight: number,
  itemHeight: number = 50
) => {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );
    
    return items.slice(startIndex, endIndex).map((item, index) => ({
      ...item,
      index: startIndex + index,
      offset: (startIndex + index) * itemHeight
    }));
  }, [items, scrollTop, containerHeight, itemHeight]);
  
  const totalHeight = items.length * itemHeight;
  
  return {
    visibleItems,
    totalHeight,
    setScrollTop
  };
};

// Network request deduplication
class RequestDeduplicator {
  private pendingRequests = new Map<string, Promise<any>>();
  
  async dedupe<T>(
    key: string,
    requestFn: () => Promise<T>
  ): Promise<T> {
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!;
    }
    
    const promise = requestFn().finally(() => {
      this.pendingRequests.delete(key);
    });
    
    this.pendingRequests.set(key, promise);
    return promise;
  }
  
  clear() {
    this.pendingRequests.clear();
  }
}

export const requestDeduplicator = new RequestDeduplicator();

// Image optimization utilities
export const optimizeImage = (
  src: string,
  width: number,
  height: number,
  quality: number = 85
): string => {
  // In a real implementation, this would use a service like Cloudinary or ImageKit
  const params = new URLSearchParams({
    w: width.toString(),
    h: height.toString(),
    q: quality.toString(),
    f: 'auto'
  });
  
  return `${src}?${params.toString()}`;
};

// Bundle size optimization
export const lazyImport = <T>(
  importFn: () => Promise<{ default: T }>
): T => {
  return React.lazy(importFn) as T;
};

// Memory management utilities
export const cleanupMemory = () => {
  // Clear any global caches
  if (typeof window !== 'undefined' && 'caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => {
        caches.delete(name);
      });
    });
  }
  
  // Force garbage collection in development
  if (process.env.NODE_ENV === 'development' && 'gc' in window) {
    (window as any).gc();
  }
};

// Performance monitoring
export const measurePerformance = <T>(
  name: string,
  fn: () => T
): T => {
  if (typeof performance !== 'undefined' && performance.mark) {
    performance.mark(`${name}-start`);
  }
  
  const start = Date.now();
  const result = fn();
  
  if (typeof performance !== 'undefined' && performance.mark) {
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
  }
  
  const duration = Date.now() - start;
  
  if (duration > 100) {
    console.warn(`Performance warning: ${name} took ${duration}ms`);
  }
  
  return result;
};

// Component performance utilities
export const usePerformanceMonitor = (componentName: string) => {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(Date.now());
  
  useEffect(() => {
    renderCount.current += 1;
    const now = Date.now();
    const timeSinceLastRender = now - lastRenderTime.current;
    
    if (timeSinceLastRender < 16) { // Less than 60fps
      console.warn(`${componentName} is rendering too frequently`);
    }
    
    lastRenderTime.current = now;
  });
  
  return {
    renderCount: renderCount.current,
    measureRender: (fn: () => void) => measurePerformance(`${componentName}-render`, fn)
  };
};

// Data fetching optimization
export const useOptimizedFetch = <T>(
  url: string,
  options?: RequestInit
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await requestDeduplicator.dedupe(
        url,
        () => fetch(url, options).then(res => res.json())
      );
      
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [url, options]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  return { data, loading, error, refetch: fetchData };
};

// State management optimization
export const useOptimizedState = <T>(
  initialState: T,
  equalityFn?: (a: T, b: T) => boolean
) => {
  const [state, setState] = useState(initialState);
  const prevStateRef = useRef<T>(initialState);
  
  const setOptimizedState = useCallback((newState: T | ((prev: T) => T)) => {
    setState(prevState => {
      const nextState = typeof newState === 'function' ? (newState as (prev: T) => T)(prevState) : newState;
      
      if (equalityFn ? !equalityFn(prevState, nextState) : prevState !== nextState) {
        prevStateRef.current = nextState;
        return nextState;
      }
      
      return prevState;
    });
  }, [equalityFn]);
  
  return [state, setOptimizedState] as const;
};

// Import React for lazy loading
import React, { useState } from 'react';
