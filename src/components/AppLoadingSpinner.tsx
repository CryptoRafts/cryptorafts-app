import React from 'react';

const AppLoadingSpinner: React.FC = () => {
  return (
    <div className="min-h-screen neo-blue-background flex items-center justify-center">
      <div className="text-center">
        {/* Main Spinner */}
        <div className="relative mb-8">
          <div className="w-20 h-20 border-4 border-white/20 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full animate-pulse"></div>
          </div>
        </div>
        
        {/* App Logo/Title */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Cryptorafts</h1>
          <p className="text-white/60">Loading your experience...</p>
        </div>
        
        {/* Progress Indicators */}
        <div className="flex justify-center space-x-2 mb-6">
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
        
        {/* Loading Steps */}
        <div className="space-y-2 text-sm text-white/50">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Initializing platform...</span>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
            <span>Connecting to services...</span>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
            <span>Loading your dashboard...</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppLoadingSpinner;
