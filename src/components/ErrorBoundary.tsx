"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    // CRITICAL: Don't set hasError for React insertBefore errors - they're non-critical
    if (error.message.includes("Failed to execute 'insertBefore' on 'Node'") || 
        error.name === 'NotFoundError' && error.message.includes('insertBefore')) {
      // Return no error state - suppress this error
      return { hasError: false };
    }
    
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // CRITICAL: Suppress React insertBefore errors - these are React reconciliation issues
    // that don't affect functionality but cause console spam
    if (error.message.includes("Failed to execute 'insertBefore' on 'Node'") || 
        error.name === 'NotFoundError' && error.message.includes('insertBefore')) {
      // This is a React reconciliation error that doesn't affect functionality
      // Suppress it to prevent console spam
      console.warn('⚠️ [React] Suppressed insertBefore reconciliation error (non-critical)', {
        message: error.message,
        componentStack: errorInfo.componentStack?.substring(0, 200)
      });
      // Don't set hasError for this - it's not a real error
      return;
    }
    
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Handle specific React errors
    if (error.message.includes('Minified React error #482')) {
      console.error("React error #482: Multiple React instances detected");
    } else if (error.message.includes('Minified React error #310')) {
      console.error("React error #310: useEffect dependency issue");
    }
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Something went wrong</h1>
            <p className="text-white/60 mb-6">Please refresh the page to try again.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;