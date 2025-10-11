import React from 'react';

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] py-12">
      {/* Main container with glass effect */}
      <div className="glass p-8 rounded-2xl shadow-2xl flex flex-col items-center space-y-6 relative overflow-hidden">
        {/* Background gradient animation */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 animate-pulse"></div>
        
        {/* Water wave animation at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-10 overflow-hidden">
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-blue-400/20 to-transparent animate-wave-slow"></div>
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-blue-300/10 to-transparent animate-wave-medium" style={{animationDelay: '0.5s'}}></div>
        </div>
        
        {/* Loading icon */}
        <div className="relative">
          {/* Outer spinning circle */}
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600/20 border-t-blue-600 border-r-blue-500 border-b-indigo-600"></div>
          
          {/* Inner pulsing dot */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="h-4 w-4 bg-blue-600 rounded-full animate-pulse"></div>
          </div>
          
          {/* Orbiting dot */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div
              className="h-3 w-3 bg-purple-500 rounded-full"
              style={{
                animation: 'orbit 2s linear infinite'
              }}
            ></div>
          </div>
        </div>
        
        {/* Loading text with dots animation */}
        <div className="text-center">
          <div className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">Loading</div>
          <div className="flex justify-center">
            <div className="loader-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-3">Fetching latest data</div>
        </div>
      </div>
    </div>
  );
};