"use client";

import { useEffect } from 'react';
import '@/lib/error-handler';

/**
 * Client component to initialize error handler early
 * This suppresses harmless ERR_BLOCKED_BY_CLIENT errors from ad blockers
 */
export default function ErrorHandlerInitializer() {
  useEffect(() => {
    // Error handler is already initialized via the import above
    // This component just ensures it's loaded on the client side
  }, []);

  return null; // This component doesn't render anything
}

