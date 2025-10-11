import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatusCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'yellow' | 'orange' | 'red' | 'purple' | 'gray';
}

const colorClasses = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-green-50 text-green-600',
  yellow: 'bg-yellow-50 text-yellow-600',
  orange: 'bg-orange-50 text-orange-600',
  red: 'bg-red-50 text-red-600',
  purple: 'bg-purple-50 text-purple-600',
  gray: 'bg-gray-50 text-gray-600',
};

export const StatusCard: React.FC<StatusCardProps> = React.memo(({
  title,
  value,
  subtitle,
  icon,
  color,
}) => {
  return (
    <div className="modern-card p-4 sm:p-6 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border-gray-200 dark:border-gray-700 hover-lift cursor-pointer group relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 via-white/30 to-gray-50/50 dark:from-gray-900/50 dark:via-gray-800/30 dark:to-gray-900/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      {/* Animated corner accent */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-gray-100/0 via-gray-200/0 to-gray-300/0 group-hover:from-gray-100/10 group-hover:via-gray-200/20 group-hover:to-gray-300/30 dark:group-hover:from-gray-700/10 dark:group-hover:via-gray-600/20 dark:group-hover:to-gray-500/30 rounded-full transition-all duration-500 transform rotate-45"></div>
      
      {/* Animated bottom accent line */}
      <div className={`absolute bottom-0 left-0 h-1 w-0 group-hover:w-full transition-all duration-700 ease-out bg-gradient-to-r ${
        color === 'blue' ? 'from-blue-400 to-blue-600' :
        color === 'green' ? 'from-green-400 to-green-600' :
        color === 'yellow' ? 'from-yellow-400 to-yellow-600' :
        color === 'orange' ? 'from-orange-400 to-orange-600' :
        color === 'red' ? 'from-red-400 to-red-600' :
        color === 'purple' ? 'from-purple-400 to-purple-600' :
        'from-gray-400 to-gray-600'
      }`}></div>

      <div className="flex items-center justify-between relative z-10">
        <div className="flex-1">
          <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors duration-300">{title}</p>
          <p className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-1 group-hover:scale-105 transition-transform duration-300 text-shadow-sm">{value}</p>
          {subtitle && (
            <div className="overflow-hidden">
              <p className="text-sm text-gray-600 dark:text-gray-300 font-semibold group-hover:text-gray-800 dark:group-hover:text-gray-100 transition-colors duration-300 transform group-hover:translate-y-0 translate-y-0">{subtitle}</p>
            </div>
          )}
        </div>
        <div className={`relative p-3 sm:p-4 rounded-3xl ${colorClasses[color]} shadow-xl transform hover-scale transition-all duration-300 group-hover:rotate-12 group-hover:scale-110`}>
          {/* Pulsing ring effect */}
          <div className="absolute inset-0 rounded-3xl animate-ping-slow opacity-0 group-hover:opacity-60" style={{
            background: `radial-gradient(circle, ${
              color === 'blue' ? 'rgba(59, 130, 246, 0.3)' :
              color === 'green' ? 'rgba(16, 185, 129, 0.3)' :
              color === 'yellow' ? 'rgba(245, 158, 11, 0.3)' :
              color === 'orange' ? 'rgba(249, 115, 22, 0.3)' :
              color === 'red' ? 'rgba(239, 68, 68, 0.3)' :
              color === 'purple' ? 'rgba(139, 92, 246, 0.3)' :
              'rgba(156, 163, 175, 0.3)'
            } 0%, transparent 70%)`
          }}></div>
          
          {icon}
          
          {/* Shine effect overlay */}
          <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-white/0 via-white/30 to-white/0 animate-shine"></div>
          </div>
        </div>
      </div>
    </div>
  );
});