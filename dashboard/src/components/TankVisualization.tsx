import React from 'react';
import { Droplets, Zap, Thermometer, Beaker, Activity, Waves } from 'lucide-react';

interface TankVisualizationProps {
  currentLevel: number;
  percentFull: number;
  flowRate: number;
  pumpState: boolean;
  temperature: number;
  tds: number;
}

export const TankVisualization: React.FC<TankVisualizationProps> = React.memo(({
  currentLevel,
  percentFull,
  flowRate,
  pumpState,
  temperature,
  tds,
}) => {
  const getWaterGradient = () => {
    if (percentFull >= 80) return 'from-cyan-400 via-blue-500 to-blue-600';
    if (percentFull >= 50) return 'from-emerald-400 via-green-500 to-green-600';
    if (percentFull >= 20) return 'from-amber-400 via-yellow-500 to-orange-500';
    return 'from-red-400 via-red-500 to-red-600';
  };

  const getGlowColor = () => {
    if (percentFull >= 80) return 'shadow-cyan-500/50';
    if (percentFull >= 50) return 'shadow-green-500/50';
    if (percentFull >= 20) return 'shadow-yellow-500/50';
    return 'shadow-red-500/50';
  };

  return (
    <div className="relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-purple-50/30 dark:from-blue-900/10 dark:to-purple-900/10 rounded-3xl"></div>

      <div className="relative glass-card p-8 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-white/20 dark:border-gray-700/50">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent flex items-center">
            <Waves className="h-8 w-8 mr-3 text-blue-500" />
            Smart Tank Monitor
          </h3>
          <div className="flex items-center space-x-2 bg-green-100 dark:bg-green-900/30 px-4 py-2 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-semibold text-green-700 dark:text-green-300">LIVE</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Main Tank Visualization */}
          <div className="lg:col-span-2">
            <div className="relative">
              {/* Tank Container */}
              <div className="relative w-full h-64 sm:h-80 lg:h-96 bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-2xl border border-gray-300 dark:border-gray-600 overflow-hidden">
                {/* Tank Walls with Metallic Effect */}
                <div className="absolute inset-2 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-600">
                  {/* Water Level */}
                  <div
                    className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t ${getWaterGradient()} transition-all duration-1000 ease-out rounded-b-xl shadow-lg ${getGlowColor()}`}
                    style={{ height: `${percentFull}%` }}
                  >
                    {/* Enhanced Water Surface Effect with Realistic Waves */}
                    <div className="absolute top-0 left-0 right-0 h-4 overflow-hidden">
                      <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-white/50 to-transparent animate-wave-slow"></div>
                      <div className="absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-white/30 to-transparent animate-wave-medium" style={{animationDelay: '0.5s'}}></div>
                      <div className="absolute inset-x-0 top-0 h-3 bg-gradient-to-b from-white/20 to-transparent animate-wave-fast" style={{animationDelay: '0.7s'}}></div>
                    </div>

                    {/* Water Ripples */}
                    <div className="absolute inset-0">
                      <div className="absolute w-full h-full">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <div
                            key={i}
                            className="absolute rounded-full border-2 border-white/20 animate-ripple"
                            style={{
                              width: `${20 + i * 15}%`,
                              height: `${20 + i * 15}%`,
                              left: `${40 - (i * 7.5)}%`,
                              top: `${40 - (i * 7.5)}%`,
                              animationDelay: `${i * 0.5}s`,
                              animationDuration: '4s'
                            }}
                          ></div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Dynamic Bubbles */}
                    {percentFull > 20 && (
                      <div className="absolute inset-0 overflow-hidden">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <div
                            key={i}
                            className="absolute w-2 h-2 rounded-full bg-white/30 animate-bubble"
                            style={{
                              left: `${15 + (i * 12)}%`,
                              bottom: `${5 + Math.random() * 50}%`,
                              animationDuration: `${3 + Math.random() * 3}s`,
                              animationDelay: `${i * 0.5}s`
                            }}
                          ></div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Level Markers */}
                  {[25, 50, 75].map((level) => (
                    <div key={level} className="absolute left-0 right-0 flex items-center" style={{ bottom: `${level}%` }}>
                      <div className="w-3 h-px bg-gray-400 dark:bg-gray-500"></div>
                      <span className="ml-2 text-xs font-semibold text-gray-600 dark:text-gray-400">{level}%</span>
                    </div>
                  ))}

                  {/* Current Level Indicator */}
                  <div
                    className="absolute left-0 flex items-center transition-all duration-1000"
                    style={{ bottom: `${percentFull}%` }}
                  >
                    <div className="w-4 h-1 bg-red-500 rounded-r-full shadow-lg"></div>
                    <div className="ml-2 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded shadow-lg">
                      {percentFull.toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* Enhanced Flow Animation */}
                {pumpState && (
                  <div className="absolute top-4 right-4 flex items-center space-x-2">
                    <div className="relative flex space-x-1">
                      <div className="w-2 h-8 bg-gradient-to-b from-blue-300 to-blue-500 rounded-full animate-flow" style={{ animationDelay: '0s', animationDuration: '1.5s' }}></div>
                      <div className="w-2 h-6 bg-gradient-to-b from-blue-300 to-blue-500 rounded-full animate-flow" style={{ animationDelay: '0.3s', animationDuration: '1.5s' }}></div>
                      <div className="w-2 h-7 bg-gradient-to-b from-blue-300 to-blue-500 rounded-full animate-flow" style={{ animationDelay: '0.6s', animationDuration: '1.5s' }}></div>
                      
                      {/* Flow glow effect */}
                      <div className="absolute inset-0 blur-md bg-blue-400/30 rounded-full animate-pulse"></div>
                    </div>
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 rounded-lg text-sm font-semibold shadow-lg hover-glow">
                      <span className="animate-pulse inline-block mr-1">💧</span>
                      {flowRate.toFixed(2)} L/min
                    </div>
                  </div>
                )}

                {/* Animated Sensor Indicators */}
                <div className="absolute top-4 left-4 space-y-2">
                  <div className="flex items-center space-x-2 bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1 rounded-lg shadow-lg hover-scale transition-all">
                    <Thermometer className="h-4 w-4 animate-pulse" />
                    <span className="text-sm font-semibold">{temperature.toFixed(1)}°C</span>
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-red-400/0 via-red-300/10 to-red-400/0 animate-shine"></div>
                  </div>
                  <div className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-3 py-1 rounded-lg shadow-lg hover-scale transition-all">
                    <Beaker className="h-4 w-4 animate-pulse" />
                    <span className="text-sm font-semibold">{tds} ppm</span>
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-400/0 via-purple-300/10 to-purple-400/0 animate-shine"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Panel */}
          <div className="space-y-4">
            {/* Main Stats */}
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center space-x-3 mb-4">
                <Droplets className="h-8 w-8" />
                <div>
                  <div className="text-3xl font-bold">{currentLevel.toFixed(1)} cm</div>
                  <div className="text-blue-100">Water Level</div>
                </div>
              </div>
              <div className="w-full bg-white/20 rounded-full h-3 mb-2">
                <div
                  className="bg-white rounded-full h-3 transition-all duration-1000"
                  style={{ width: `${percentFull}%` }}
                ></div>
              </div>
              <div className="text-sm text-blue-100">{percentFull.toFixed(1)}% Capacity</div>
            </div>

            {/* Pump Status */}
            <div className={`relative rounded-2xl p-6 shadow-xl transition-all duration-300 overflow-hidden ${pumpState ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white' : 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 text-gray-700 dark:text-gray-300'}`}>
              {/* Background patterns */}
              {pumpState && (
                <div className="absolute inset-0 overflow-hidden opacity-20">
                  <div className="absolute top-0 left-0 w-full h-full">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div
                        key={i}
                        className="absolute rounded-full border border-white animate-ping-slow"
                        style={{
                          width: `${150 - i * 30}%`,
                          height: `${150 - i * 30}%`,
                          top: `${(i * 15) - 25}%`,
                          left: `${(i * 15) - 25}%`,
                          animationDelay: `${i * 0.5}s`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex items-center space-x-3 mb-4 relative z-10">
                <Zap className={`h-8 w-8 ${pumpState ? 'text-white animate-pulse' : 'text-gray-500'}`} />
                <div>
                  <div className="text-2xl font-bold">{pumpState ? 'ACTIVE' : 'STANDBY'}</div>
                  <div className={pumpState ? 'text-green-100' : 'text-gray-500'}>Pump Status</div>
                </div>
              </div>
              {pumpState && (
                <div className="flex items-center space-x-2 relative z-10">
                  <Activity className="h-5 w-5 animate-pulse" />
                  <span className="text-sm font-semibold">{flowRate.toFixed(2)} L/min flow</span>
                  {/* Visual indicator for flow rate */}
                  <div className="ml-2 h-1.5 flex items-center bg-white/30 rounded-full w-24">
                    <div
                      className="h-1.5 rounded-full bg-white transition-all duration-700 ease-in-out"
                      style={{ width: `${Math.min(100, (flowRate / 5) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Status Alert */}
            <div className={`relative rounded-2xl p-6 shadow-xl overflow-hidden ${
              percentFull >= 80 ? 'bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-800/20 border-green-200 dark:border-green-700' :
              percentFull >= 50 ? 'bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-800/20 border-blue-200 dark:border-blue-700' :
              percentFull >= 20 ? 'bg-gradient-to-br from-yellow-50 to-orange-100 dark:from-yellow-900/20 dark:to-orange-800/20 border-yellow-200 dark:border-yellow-700' :
              'bg-gradient-to-br from-red-50 to-pink-100 dark:from-red-900/20 dark:to-pink-800/20 border-red-200 dark:border-red-700'
            } border hover-lift transition-all duration-300`}>
              {/* Animated background pattern */}
              <div className="absolute inset-0 overflow-hidden opacity-5">
                <div
                  className="absolute w-full h-full bg-grid-pattern transform animate-pan-pattern"
                  style={{
                    backgroundSize: '30px 30px',
                    backgroundImage: `linear-gradient(to right, ${
                      percentFull >= 80 ? '#10B981' :
                      percentFull >= 50 ? '#3B82F6' :
                      percentFull >= 20 ? '#F59E0B' :
                      '#EF4444'
                    } 1px, transparent 1px),
                    linear-gradient(to bottom, ${
                      percentFull >= 80 ? '#10B981' :
                      percentFull >= 50 ? '#3B82F6' :
                      percentFull >= 20 ? '#F59E0B' :
                      '#EF4444'
                    } 1px, transparent 1px)`
                  }}
                />
              </div>
              
              <div className="flex items-center space-x-3 mb-3 relative z-10">
                <div className={`w-4 h-4 rounded-full animate-pulse ${
                  percentFull >= 80 ? 'bg-green-500' :
                  percentFull >= 50 ? 'bg-blue-500' :
                  percentFull >= 20 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}>
                  {/* Animated pulse ring */}
                  <div className={`absolute inset-0 rounded-full animate-ping opacity-75 ${
                    percentFull >= 80 ? 'bg-green-500' :
                    percentFull >= 50 ? 'bg-blue-500' :
                    percentFull >= 20 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}></div>
                </div>
                <span className="font-bold text-gray-800 dark:text-gray-200">System Status</span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed relative z-10">
                {percentFull >= 80 ? (
                  <span className="inline-flex items-center">
                    <span className="animate-bounce inline-block mr-1">✅</span>
                    Tank is optimally filled and fully operational.
                  </span>
                ) : percentFull >= 50 ? (
                  <span className="inline-flex items-center">
                    <span className="inline-block mr-1">ℹ️</span>
                    Tank level is within normal operating range.
                  </span>
                ) : percentFull >= 20 ? (
                  <span className="inline-flex items-center">
                    <span className="animate-pulse inline-block mr-1">⚠️</span>
                    Tank level is below recommended threshold.
                  </span>
                ) : (
                  <span className="inline-flex items-center">
                    <span className="animate-ping inline-block mr-1">🚨</span>
                    <span className="font-bold text-red-600 dark:text-red-400">CRITICAL: Tank level is dangerously low!</span>
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});