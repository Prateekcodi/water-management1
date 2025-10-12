import React, { useState, useRef, Suspense, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Html, Stars, Line } from '@react-three/drei';
import {
  Droplets, Home, Activity, Waves, Shield, Edit3, Plus, Save, Upload, Trash2,
  Settings, Brain, Cpu, Zap, Radio, Satellite, AlertTriangle, TrendingUp,
  Cloud, Database, Lock, Eye, Thermometer, Volume2, Camera, Gauge, Wifi, Wrench
} from 'lucide-react';
import * as THREE from 'three';
import TownVisualization3D from './3D/TownVisualization3D';
import LocationBasedHomeSuggestion from './LocationBasedHomeSuggestion';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const API_BASE_URL = 'http://localhost:8000';

interface HouseData {
  id: string;
  name: string;
  tankLevel: number;
  waterUsage: number;
  waterQuality: 'good' | 'fair' | 'poor';
  rainwaterCollected: number;
  hasLeak: boolean;
  aiPrediction?: number;
  blockchainVerified?: boolean;
  iotSensors?: number;
  quantumEfficiency?: number;
}

const AIService = {
  async predictWaterDemand(houseData: HouseData[], weatherData: any): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          houseData: houseData.map(h => ({
            name: h.name, tankLevel: h.tankLevel, usage: h.waterUsage, quality: h.waterQuality
          })),
          weatherData: weatherData
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        totalDemand: data.totalDemand,
        peakHours: data.peakHours,
        efficiency: data.efficiency,
        recommendations: data.recommendations
      };
    } catch (error) {
      console.error('Prediction API error:', error);
      return {
        totalDemand: 12580 + Math.random() * 2000,
        peakHours: [7, 12, 19],
        efficiency: 87 + Math.random() * 8,
        recommendations: ["System operating optimally", "Monitor for efficiency improvements"]
      };
    }
  }
};

const QuantumFlowLines = ({ houses }: { houses: HouseData[] }) => {
  const linesRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (linesRef.current) linesRef.current.rotation.y = clock.getElapsedTime() * 0.05;
  });

  const points: [number, number, number][] = houses.map((_, i) => {
    const angle = (i / houses.length) * Math.PI * 2;
    return [Math.sin(angle) * 6.5, 0.5, Math.cos(angle) * 6.5];
  });

  return (
    <group ref={linesRef}>
      {points.map((point, i) => {
        const nextPoint = points[(i + 1) % points.length];
        return <Line key={i} points={[[0, 0.5, 0], point, nextPoint]} color="#8B5CF6" lineWidth={2} transparent opacity={0.6} />;
      })}
    </group>
  );
};

const BlockchainNodes = ({ houses }: { houses: HouseData[] }) => {
  const nodesRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (nodesRef.current) {
      nodesRef.current.children.forEach((child, i) => {
        child.position.y = Math.sin(clock.getElapsedTime() * 2 + i) * 0.1 + 2;
        child.scale.setScalar(1 + Math.sin(clock.getElapsedTime() * 3 + i) * 0.1);
      });
    }
  });

  const getHousePosition = (index: number, total: number): [number, number, number] => {
    const radius = 6.5;
    const angle = (index / total) * Math.PI * 2;
    return [Math.sin(angle) * radius, 0, Math.cos(angle) * radius];
  };

  return (
    <group ref={nodesRef}>
      {houses.map((house, i) => {
        const position = getHousePosition(i, houses.length);
        return (
          <mesh key={house.id} position={[position[0], 2, position[2]]}>
            <boxGeometry args={[0.2, 0.2, 0.2]} />
            <meshStandardMaterial color={house.blockchainVerified ? "#10B981" : "#F59E0B"} emissive={house.blockchainVerified ? "#10B981" : "#F59E0B"} emissiveIntensity={1.5} transparent opacity={0.8} />
          </mesh>
        );
      })}
    </group>
  );
};

const IoTSensorNetwork = ({ houses }: { houses: HouseData[] }) => {
  const particlesRef = useRef<THREE.Points>(null);
  const maxParticleCount = 1000; // Fixed maximum size
  const particleCount = Math.min(houses.length * 10, maxParticleCount);

  // Create fixed-size arrays
  const positions = useMemo(() => new Float32Array(maxParticleCount * 3), []);
  const colors = useMemo(() => new Float32Array(maxParticleCount * 3), []);

  // Initialize positions and colors
  useEffect(() => {
    for (let i = 0; i < maxParticleCount; i++) {
      const angle = (i / maxParticleCount) * Math.PI * 2;
      const radius = 5 + Math.random() * 3;
      positions[i * 3] = Math.sin(angle) * radius;
      positions[i * 3 + 1] = Math.random() * 2;
      positions[i * 3 + 2] = Math.cos(angle) * radius;
      colors[i * 3] = 0.5;
      colors[i * 3 + 1] = 0.8;
      colors[i * 3 + 2] = 1;
    }
  }, [positions, colors]);

  useFrame(({ clock }) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = clock.getElapsedTime() * 0.1;
      const posArray = particlesRef.current.geometry.attributes.position.array as Float32Array;

      // Only animate the active particles
      for (let i = 0; i < particleCount; i++) {
        const idx = i * 3;
        posArray[idx + 1] = Math.sin(clock.getElapsedTime() + i) * 0.5 + 1;
      }

      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={maxParticleCount}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={maxParticleCount}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.05} vertexColors transparent opacity={0.8} />
    </points>
  );
};

const SmartHouse = ({ position, scale, color, data, isActive, onClick }: any) => {
  const houseRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const aiNodeRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    if (isActive && houseRef.current) {
      houseRef.current.rotation.y = Math.sin(time * 0.8) * 0.15;
      houseRef.current.position.y = position[1] + Math.sin(time * 2) * 0.05;
    }
    if (glowRef.current) glowRef.current.scale.setScalar(1 + Math.sin(time * 3) * 0.1);
    if (aiNodeRef.current) {
      aiNodeRef.current.rotation.x = time;
      aiNodeRef.current.rotation.z = time * 0.7;
    }
  });

  return (
    <group ref={houseRef} position={position} scale={scale} onClick={onClick}>
      {isActive && (
        <>
          <mesh ref={glowRef} position={[0, 0, 0]}>
            <sphereGeometry args={[2, 32, 32]} />
            <meshBasicMaterial color="#00D9FF" transparent opacity={0.1} />
          </mesh>
          <mesh position={[0, 0, 0]}>
            <ringGeometry args={[1.5, 2, 32]} />
            <meshBasicMaterial color="#FF00FF" transparent opacity={0.3} />
          </mesh>
        </>
      )}

      <mesh castShadow receiveShadow>
        <boxGeometry args={[1, 0.8, 1]} />
        <meshStandardMaterial color={color} transparent opacity={0.9} metalness={0.4} roughness={0.6} />
      </mesh>

      <mesh position={[0, 0.6, 0]} castShadow>
        <coneGeometry args={[0.8, 0.6, 4]} />
        <meshStandardMaterial color="#1F2937" metalness={0.3} roughness={0.7} />
      </mesh>

      <mesh position={[0, 0.75, 0]} rotation={[-Math.PI / 6, 0, 0]}>
        <boxGeometry args={[0.6, 0.02, 0.4]} />
        <meshStandardMaterial color="#00FFFF" emissive="#00FFFF" emissiveIntensity={0.5} metalness={1} roughness={0} />
      </mesh>

      <mesh position={[0, -0.8, 0]} castShadow>
        <cylinderGeometry args={[0.4, 0.4, 0.6 * (data.tankLevel / 100), 16]} />
        <meshStandardMaterial color="#0EA5E9" transparent opacity={0.85} metalness={0.5} roughness={0.2} emissive="#0EA5E9" emissiveIntensity={0.2} />
      </mesh>

      <mesh ref={aiNodeRef} position={[0.5, 1, 0.5]}>
        <octahedronGeometry args={[0.08, 0]} />
        <meshStandardMaterial color="#FF00FF" emissive="#FF00FF" emissiveIntensity={2} wireframe />
      </mesh>
      <pointLight position={[0.5, 1, 0.5]} color="#FF00FF" intensity={1} distance={2} />

      <mesh position={[0, 1.2, 0]}>
        <torusGeometry args={[0.15, 0.02, 16, 32]} />
        <meshStandardMaterial color="#8B5CF6" emissive="#8B5CF6" emissiveIntensity={data.quantumEfficiency ? data.quantumEfficiency / 50 : 1} />
      </mesh>

      {[0, 120, 240].map((angle, i) => (
        <mesh key={i} position={[Math.cos(angle * Math.PI / 180) * 0.6, 0.2, Math.sin(angle * Math.PI / 180) * 0.6]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshStandardMaterial color="#00FF88" emissive="#00FF88" emissiveIntensity={1.5} />
        </mesh>
      ))}

      {data.hasLeak && (
        <group>
          <mesh position={[0.5, -0.8, 0.5]}>
            <sphereGeometry args={[0.15, 16, 16]} />
            <meshStandardMaterial color="#FF0000" emissive="#FF0000" emissiveIntensity={3} transparent opacity={0.8} />
          </mesh>
          <Html position={[0.5, -0.5, 0.5]} center>
            <div className="px-2 py-1 bg-red-600/90 text-white text-xs rounded-lg animate-pulse">
              ⚠️ LEAK: -12L/h
            </div>
          </Html>
        </group>
      )}

      <Html position={[0, 1.8, 0]} center>
        <div className={`px-3 py-2 rounded-xl backdrop-blur-xl transition-all duration-300 ${
          isActive ? 'bg-gradient-to-r from-cyan-500/90 via-purple-500/90 to-pink-500/90 text-white scale-110' : 'bg-black/70 text-cyan-300'
        } border border-cyan-500/50 shadow-2xl`}>
          <div className="font-bold text-sm flex items-center">
            {data.name}
            {data.blockchainVerified && <Lock className="h-3 w-3 ml-1 text-green-400" />}
          </div>
          <div className="text-xs opacity-90 mt-1 grid grid-cols-2 gap-2">
            <span>💧 {data.tankLevel}%</span>
            <span>⚡ {data.quantumEfficiency || 95}%</span>
          </div>
        </div>
      </Html>

      {isActive && (
        <Html position={[0, -2.5, 0]} center>
          <div className="bg-black/90 backdrop-blur-2xl text-cyan-300 p-4 rounded-2xl shadow-2xl border border-cyan-500/50 w-80">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-cyan-500/30">
              <h4 className="font-bold text-lg flex items-center text-white">
                <Home className="h-5 w-5 mr-2 text-cyan-400" />
                {data.name} - Digital Twin
              </h4>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-400">SYNCED</span>
                <Brain className="h-4 w-4 text-purple-400" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="bg-cyan-500/10 rounded-lg p-2 border border-cyan-500/30">
                <Droplets className="h-4 w-4 text-cyan-400 mb-1" />
                <div className="text-lg font-bold text-cyan-300">{data.tankLevel}%</div>
                <div className="text-xs text-gray-400">Tank</div>
              </div>
              <div className="bg-purple-500/10 rounded-lg p-2 border border-purple-500/30">
                <Brain className="h-4 w-4 text-purple-400 mb-1" />
                <div className="text-lg font-bold text-purple-300">{data.aiPrediction || 89}%</div>
                <div className="text-xs text-gray-400">AI Score</div>
              </div>
              <div className="bg-green-500/10 rounded-lg p-2 border border-green-500/30">
                <Shield className="h-4 w-4 text-green-400 mb-1" />
                <div className="text-lg font-bold text-green-300">{data.iotSensors || 12}</div>
                <div className="text-xs text-gray-400">Sensors</div>
              </div>
            </div>

            <div className="space-y-2 mb-3">
              <div className="flex items-center justify-between p-2 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-lg border border-cyan-500/20">
                <span className="text-xs text-gray-300 flex items-center">
                  <Activity className="h-3 w-3 mr-1 text-cyan-400" />
                  Flow Rate
                </span>
                <span className="text-sm font-bold text-cyan-300">{data.waterUsage} L/h</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20">
                <span className="text-xs text-gray-300 flex items-center">
                  <Zap className="h-3 w-3 mr-1 text-purple-400" />
                  Quantum Eff.
                </span>
                <span className="text-sm font-bold text-purple-300">{data.quantumEfficiency || 95}%</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/20">
                <span className="text-xs text-gray-300 flex items-center">
                  <Lock className="h-3 w-3 mr-1 text-green-400" />
                  Blockchain
                </span>
                <span className="text-sm font-bold text-green-300">{data.blockchainVerified ? 'Verified' : 'Pending'}</span>
              </div>
            </div>

            {data.hasLeak && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-2 animate-pulse">
                <div className="text-xs text-red-400 font-bold mb-1">🔧 AR Repair Guide:</div>
                <div className="text-xs text-red-300">
                  1. Check valve B-12 at -0.8m depth<br/>
                  2. Apply sealant code QR-7745<br/>
                  3. Verify with IoT sensor #3
                </div>
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
};

const RainEffect = ({ intensity }: any) => {
  const rainRef = useRef<THREE.Points>(null);
  const maxRainCount = 1000; // Fixed maximum size
  const rainCount = Math.min(Math.floor(intensity * 200), maxRainCount);

  // Create fixed-size arrays
  const rainPositions = useMemo(() => new Float32Array(maxRainCount * 3), []);
  const rainVelocities = useMemo(() => new Float32Array(maxRainCount), []);

  // Initialize positions and velocities
  useEffect(() => {
    for (let i = 0; i < maxRainCount; i++) {
      rainPositions[i * 3] = (Math.random() - 0.5) * 25;
      rainPositions[i * 3 + 1] = Math.random() * 20 - 10;
      rainPositions[i * 3 + 2] = (Math.random() - 0.5) * 25;
      rainVelocities[i] = 0.1 + Math.random() * 0.1;
    }
  }, [rainPositions, rainVelocities]);

  useFrame(() => {
    if (rainRef.current?.geometry.attributes.position) {
      const positions = rainRef.current.geometry.attributes.position.array as Float32Array;

      for (let i = 0; i < rainCount; i++) {
        const idx = i * 3;
        positions[idx + 1] -= rainVelocities[i];

        if (positions[idx + 1] < -10) {
          positions[idx + 1] = 10;
          positions[idx] = (Math.random() - 0.5) * 25;
          positions[idx + 2] = (Math.random() - 0.5) * 25;
        }
      }

      rainRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={rainRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={maxRainCount}
          array={rainPositions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.15} color="#A5F3FC" transparent opacity={0.7} />
    </points>
  );
};

const DigitalTwinPanel = ({ houses, aiPredictions }: any) => (
  <div className="absolute top-20 left-4 w-96 bg-black/85 backdrop-blur-2xl rounded-2xl p-5 shadow-2xl border border-cyan-500/30">
    <div className="flex items-center justify-between mb-4 pb-3 border-b border-cyan-500/30">
      <h4 className="text-xl font-bold text-white flex items-center">
        <Cpu className="h-5 w-5 mr-2 text-cyan-400" />
        Digital Twin Control
      </h4>
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-xs text-green-400">REAL-TIME</span>
      </div>
    </div>

    <div className="mb-4 p-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-500/30">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-purple-300 flex items-center">
          <Brain className="h-4 w-4 mr-2" />
          UNet-ConvLSTM Prediction
        </span>
        <span className="text-xs text-gray-400">R² = 0.89</span>
      </div>
      <div className="text-2xl font-bold text-white mb-1">
        {aiPredictions?.totalDemand?.toFixed(0) || '14,250'} L
      </div>
      <div className="text-xs text-purple-300">Next 24h demand forecast</div>
      <div className="mt-2 h-20 bg-black/50 rounded-lg p-2">
        <div className="text-xs text-cyan-300">
          Peak Hours: {aiPredictions?.peakHours?.join(', ') || '7AM, 12PM, 7PM'}
        </div>
      </div>
    </div>

    <div className="mb-4 p-3 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl border border-cyan-500/30">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-cyan-300 flex items-center">
          <Zap className="h-4 w-4 mr-2" />
          Quantum Network Optimization
        </span>
        <span className="text-xs text-green-400">ACTIVE</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-black/50 rounded-lg p-2">
          <div className="text-xs text-gray-400">Efficiency</div>
          <div className="text-lg font-bold text-cyan-300">
            {aiPredictions?.efficiency?.toFixed(0) || 89}%
          </div>
        </div>
        <div className="bg-black/50 rounded-lg p-2">
          <div className="text-xs text-gray-400">Qubits</div>
          <div className="text-lg font-bold text-purple-300">256</div>
        </div>
      </div>
    </div>

    <div className="p-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl border border-green-500/30">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-green-300 flex items-center">
          <Radio className="h-4 w-4 mr-2" />
          Edge Nodes
        </span>
        <span className="text-xs text-green-400">89/90 ONLINE</span>
      </div>
      <div className="text-xs text-gray-300">
        Latency: <span className="text-green-400 font-bold">1.2ms</span> | 
        Processing: <span className="text-cyan-400 font-bold">47 TOPS</span>
      </div>
    </div>
  </div>
);

const WaterQualityPanel = () => {
  const [rgb, setRgb] = useState({ r: 50, g: 180, b: 220 });
  
  useEffect(() => {
    const interval = setInterval(() => {
      setRgb({
        r: Math.floor(Math.random() * 100),
        g: Math.floor(150 + Math.random() * 105),
        b: Math.floor(200 + Math.random() * 55)
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const quality = rgb.r < 100 && rgb.g > 150 && rgb.b > 200 ? 'CLEAN' : rgb.r < 150 ? 'FAIR' : 'CONTAMINATED';
  const qualityColor = quality === 'CLEAN' ? '#10B981' : quality === 'FAIR' ? '#F59E0B' : '#EF4444';

  return (
    <div className="absolute bottom-4 right-4 w-80 bg-black/85 backdrop-blur-2xl rounded-2xl p-4 shadow-2xl border border-cyan-500/30">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-cyan-500/30">
        <h4 className="text-lg font-bold text-white flex items-center">
          <Eye className="h-5 w-5 mr-2 text-cyan-400" />
          Computer Vision QA
        </h4>
        <Camera className="h-4 w-4 text-green-400 animate-pulse" />
      </div>

      <div className="mb-3 p-3 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl border border-cyan-500/20">
        <div className="text-xs text-gray-400 mb-2">RGB Analysis</div>
        <div className="flex justify-between items-center mb-2">
          <div className="flex space-x-2">
            <div className="text-xs">R:<span className="text-red-400 font-bold ml-1">{rgb.r}</span></div>
            <div className="text-xs">G:<span className="text-green-400 font-bold ml-1">{rgb.g}</span></div>
            <div className="text-xs">B:<span className="text-blue-400 font-bold ml-1">{rgb.b}</span></div>
          </div>
          <div className="w-8 h-8 rounded-lg border-2 border-white/30" style={{ backgroundColor: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` }}></div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">Status:</span>
          <span className="text-sm font-bold" style={{ color: qualityColor }}>{quality}</span>
        </div>
      </div>

      <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
        <div className="flex items-center justify-between">
          <span className="text-xs text-purple-300">AI Confidence</span>
          <span className="text-sm font-bold text-purple-300">89.7%</span>
        </div>
      </div>
    </div>
  );
};

const BlockchainTradingPanel = ({ houses }: any) => {
  const [transactions, setTransactions] = useState<any[]>([]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setTransactions(prev => [
        {
          id: Date.now(),
          from: `House ${String.fromCharCode(65 + Math.floor(Math.random() * houses.length))}`,
          to: `House ${String.fromCharCode(65 + Math.floor(Math.random() * houses.length))}`,
          amount: Math.floor(Math.random() * 100) + 50,
          credits: Math.floor(Math.random() * 10) + 1,
          timestamp: new Date().toLocaleTimeString()
        },
        ...prev.slice(0, 4)
      ]);
    }, 5000);
    return () => clearInterval(interval);
  }, [houses.length]);

  return (
    <div className="absolute bottom-4 left-4 w-96 bg-black/85 backdrop-blur-2xl rounded-2xl p-4 shadow-2xl border border-green-500/30">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-green-500/30">
        <h4 className="text-lg font-bold text-white flex items-center">
          <Lock className="h-5 w-5 mr-2 text-green-400" />
          Blockchain Water Trading
        </h4>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-green-400">CHAIN SYNC</span>
        </div>
      </div>

      <div className="mb-3 p-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg border border-green-500/20">
        <div className="flex items-center justify-between">
          <span className="text-xs text-green-300">Active Contracts</span>
          <span className="text-sm font-bold text-green-400">156</span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-gray-400">Total Value Locked</span>
          <span className="text-sm font-bold text-white">47,890 WTC</span>
        </div>
      </div>

      <div className="space-y-2">
        {transactions.map((tx, i) => (
          <div key={tx.id} className="p-2 bg-gray-800/50 rounded-lg border border-gray-700/30 animate-fadeIn" style={{ animationDelay: `${i * 0.1}s` }}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center">
                <div className="w-6 h-6 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full mr-2"></div>
                <span className="text-xs text-cyan-300">{tx.from} → {tx.to}</span>
              </div>
              <span className="text-xs text-gray-400">{tx.timestamp}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-blue-400">{tx.amount} L</span>
              <span className="text-xs text-green-400">{tx.credits} WTC</span>
            </div>
            <div className="mt-1 text-xs text-purple-400">
              Hash: 0x{Math.random().toString(16).substr(2, 8)}...
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ARTechnicianPanel = ({ activeHouse }: any) => {
  if (!activeHouse) return null;

  return (
    <div className="absolute top-20 right-4 w-80 bg-black/90 backdrop-blur-2xl rounded-2xl p-4 shadow-2xl border border-orange-500/30">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-orange-500/30">
        <h4 className="text-lg font-bold text-white flex items-center">
          <Wrench className="h-5 w-5 mr-2 text-orange-400" />
          AR Maintenance Guide
        </h4>
        <div className="px-2 py-1 bg-orange-500/20 rounded-full">
          <span className="text-xs text-orange-400">LIVE</span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="p-3 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-lg border border-orange-500/30">
          <div className="text-sm text-orange-300 mb-2">Current Task</div>
          <div className="text-xs text-gray-300 space-y-1">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-orange-500 rounded-full mr-2 animate-pulse"></div>
              Locate valve B-12 at depth -0.8m
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-yellow-500 rounded-full mr-2"></div>
              Check pressure reading (expected: 2.5 bar)
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
              Apply sealant QR-7745 if needed
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
            <div className="text-xs text-purple-300">Tools Required</div>
            <div className="text-sm font-bold text-white">3</div>
          </div>
          <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <div className="text-xs text-blue-300">Est. Time</div>
            <div className="text-sm font-bold text-white">12 min</div>
          </div>
        </div>

        <button className="w-full py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-bold rounded-lg hover:from-orange-600 hover:to-red-600 transition-all">
          📸 Scan QR for AR View
        </button>
      </div>
    </div>
  );
};

const WeatherPredictionPanel = ({ rainInput }: any) => {
  const [forecast] = useState({
    tomorrow: Math.random() * 10,
    week: Math.random() * 50 + 20,
    month: Math.random() * 200 + 100
  });

  return (
    <div className="absolute top-1/2 right-4 transform -translate-y-1/2 w-72 bg-black/85 backdrop-blur-2xl rounded-2xl p-4 shadow-2xl border border-blue-500/30">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-blue-500/30">
        <h4 className="text-lg font-bold text-white flex items-center">
          <Cloud className="h-5 w-5 mr-2 text-blue-400" />
          Weather AI
        </h4>
        <Satellite className="h-4 w-4 text-blue-400 animate-pulse" />
      </div>

      <div className="space-y-3">
        <div className="p-3 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg border border-blue-500/20">
          <div className="text-xs text-blue-300 mb-1">Current Rainfall</div>
          <div className="text-2xl font-bold text-cyan-400">{rainInput.toFixed(1)} mm/h</div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="p-2 bg-gray-800/50 rounded-lg">
            <div className="text-xs text-gray-400">24h</div>
            <div className="text-sm font-bold text-blue-300">{forecast.tomorrow.toFixed(1)}mm</div>
          </div>
          <div className="p-2 bg-gray-800/50 rounded-lg">
            <div className="text-xs text-gray-400">7 Days</div>
            <div className="text-sm font-bold text-green-300">{forecast.week.toFixed(0)}mm</div>
          </div>
          <div className="p-2 bg-gray-800/50 rounded-lg">
            <div className="text-xs text-gray-400">30 Days</div>
            <div className="text-sm font-bold text-purple-300">{forecast.month.toFixed(0)}mm</div>
          </div>
        </div>

        <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
          <div className="text-xs text-purple-300 mb-1">AI Irrigation Advice</div>
          <div className="text-xs text-gray-300">
            Reduce irrigation by 40% next 3 days due to expected rainfall
          </div>
        </div>
      </div>
    </div>
  );
};

const SensorFusionPanel = ({ houses }: any) => {
  const [sensorData, setSensorData] = useState({
    acoustic: Math.random() * 100,
    thermal: 20 + Math.random() * 10,
    pressure: 2.3 + Math.random() * 0.4,
    satellite: 'CLEAR'
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setSensorData({
        acoustic: Math.random() * 100,
        thermal: 20 + Math.random() * 10,
        pressure: 2.3 + Math.random() * 0.4,
        satellite: Math.random() > 0.8 ? 'ANOMALY' : 'CLEAR'
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute bottom-1/3 right-4 w-80 bg-black/85 backdrop-blur-2xl rounded-2xl p-4 shadow-2xl border border-purple-500/30">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-purple-500/30">
        <h4 className="text-lg font-bold text-white flex items-center">
          <Radio className="h-5 w-5 mr-2 text-purple-400" />
          Sensor Fusion
        </h4>
        <div className="flex items-center space-x-2">
          <Wifi className="h-4 w-4 text-green-400 animate-pulse" />
          <span className="text-xs text-green-400">STREAMING</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg border border-cyan-500/20">
          <Volume2 className="h-4 w-4 text-cyan-400 mb-1" />
          <div className="text-xs text-cyan-300">Acoustic</div>
          <div className="text-lg font-bold text-white">{sensorData.acoustic.toFixed(0)} Hz</div>
        </div>
        <div className="p-3 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-lg border border-orange-500/20">
          <Thermometer className="h-4 w-4 text-orange-400 mb-1" />
          <div className="text-xs text-orange-300">Thermal</div>
          <div className="text-lg font-bold text-white">{sensorData.thermal.toFixed(1)}°C</div>
        </div>
        <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg border border-purple-500/20">
          <Gauge className="h-4 w-4 text-purple-400 mb-1" />
          <div className="text-xs text-purple-300">Pressure</div>
          <div className="text-lg font-bold text-white">{sensorData.pressure.toFixed(2)} bar</div>
        </div>
        <div className="p-3 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg border border-green-500/20">
          <Satellite className="h-4 w-4 text-green-400 mb-1" />
          <div className="text-xs text-green-300">Satellite</div>
          <div className={`text-lg font-bold ${sensorData.satellite === 'CLEAR' ? 'text-green-400' : 'text-yellow-400'}`}>
            {sensorData.satellite}
          </div>
        </div>
      </div>

      <div className="mt-3 p-2 bg-gray-800/50 rounded-lg">
        <div className="text-xs text-gray-400 mb-1">Fusion Confidence</div>
        <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" style={{ width: '92%' }}></div>
        </div>
        <div className="text-xs text-purple-300 mt-1 text-right">92% Accuracy</div>
      </div>
    </div>
  );
};

const getHousePosition = (index: number, total: number): [number, number, number] => {
  const radius = 6.5;
  const angle = (index / total) * Math.PI * 2;
  return [Math.sin(angle) * radius, 0, Math.cos(angle) * radius];
};

const HomeEditForm = ({ home, onSave, onCancel, isEditing }: any) => {
  const [formData, setFormData] = useState({
    name: home?.name || '',
    tankLevel: home?.tankLevel || 50,
    waterUsage: home?.waterUsage || 30,
    waterQuality: home?.waterQuality || 'good',
    rainwaterCollected: home?.rainwaterCollected || 0,
    hasLeak: home?.hasLeak || false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && home) {
      onSave({ ...home, ...formData });
    } else {
      onSave(formData);
    }
  };

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border border-blue-500/30 shadow-xl">
      <h5 className="text-white font-bold mb-3 flex items-center">
        {isEditing ? <Edit3 className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
        {isEditing ? 'Edit Home' : 'Add New Home'}
      </h5>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-gray-300 text-sm mb-1 font-medium">Home Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            placeholder="e.g., House Omega"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-gray-300 text-sm mb-1 font-medium">Tank Level (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={formData.tankLevel}
              onChange={(e) => setFormData(prev => ({ ...prev, tankLevel: parseInt(e.target.value) || 0 }))}
              className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm mb-1 font-medium">Usage (L/h)</label>
            <input
              type="number"
              min="0"
              value={formData.waterUsage}
              onChange={(e) => setFormData(prev => ({ ...prev, waterUsage: parseInt(e.target.value) || 0 }))}
              className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-gray-300 text-sm mb-1 font-medium">Water Quality</label>
          <select
            value={formData.waterQuality}
            onChange={(e) => setFormData(prev => ({ ...prev, waterQuality: e.target.value as any }))}
            className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
          >
            <option value="good">Good</option>
            <option value="fair">Fair</option>
            <option value="poor">Poor</option>
          </select>
        </div>

        <div>
          <label className="block text-gray-300 text-sm mb-1 font-medium">Rainwater (L)</label>
          <input
            type="number"
            min="0"
            value={formData.rainwaterCollected}
            onChange={(e) => setFormData(prev => ({ ...prev, rainwaterCollected: parseInt(e.target.value) || 0 }))}
            className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>

        <div className="flex items-center bg-gray-700/30 rounded-lg p-3">
          <input
            type="checkbox"
            id="hasLeak"
            checked={formData.hasLeak}
            onChange={(e) => setFormData(prev => ({ ...prev, hasLeak: e.target.checked }))}
            className="w-4 h-4 text-blue-500 rounded focus:ring-2 focus:ring-blue-500"
          />
          <label htmlFor="hasLeak" className="ml-2 text-sm text-gray-300 font-medium">Has Leak</label>
        </div>

        <div className="flex space-x-2 pt-2">
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white text-sm font-medium rounded-lg transition-all shadow-lg"
          >
            {isEditing ? '✓ Update' : '+ Add Home'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-all"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export function TownWaterVisualization() {
  const [houses, setHouses] = useState<HouseData[]>([
    { id: 'house1', name: 'House Alpha', tankLevel: 75, waterUsage: 45, waterQuality: 'good', rainwaterCollected: 120, hasLeak: false, aiPrediction: 92, blockchainVerified: true, iotSensors: 12, quantumEfficiency: 94 },
    { id: 'house2', name: 'House Beta', tankLevel: 60, waterUsage: 38, waterQuality: 'fair', rainwaterCollected: 95, hasLeak: true, aiPrediction: 78, blockchainVerified: true, iotSensors: 11, quantumEfficiency: 87 },
    { id: 'house3', name: 'House Gamma', tankLevel: 85, waterUsage: 52, waterQuality: 'good', rainwaterCollected: 145, hasLeak: false, aiPrediction: 95, blockchainVerified: false, iotSensors: 12, quantumEfficiency: 98 },
    { id: 'house4', name: 'House Delta', tankLevel: 45, waterUsage: 67, waterQuality: 'poor', rainwaterCollected: 80, hasLeak: false, aiPrediction: 71, blockchainVerified: true, iotSensors: 10, quantumEfficiency: 82 },
    { id: 'house5', name: 'House Epsilon', tankLevel: 92, waterUsage: 28, waterQuality: 'good', rainwaterCollected: 165, hasLeak: false, aiPrediction: 98, blockchainVerified: true, iotSensors: 12, quantumEfficiency: 96 },
    { id: 'house6', name: 'House Zeta', tankLevel: 58, waterUsage: 41, waterQuality: 'fair', rainwaterCollected: 110, hasLeak: true, aiPrediction: 76, blockchainVerified: false, iotSensors: 9, quantumEfficiency: 85 }
  ]);

  const [rainInput] = useState(3.5);
  const [activeHouse, setActiveHouse] = useState<string | null>(null);
  const [aiPredictions, setAiPredictions] = useState<any>(null);
  const [weatherData] = useState({ temp: 25, humidity: 65, pressure: 1013 });
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingHouse, setEditingHouse] = useState<HouseData | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showLocationSuggestion, setShowLocationSuggestion] = useState(false);

  useEffect(() => {
    AIService.predictWaterDemand(houses, weatherData).then(setAiPredictions);
    const interval = setInterval(() => {
      AIService.predictWaterDemand(houses, weatherData).then(setAiPredictions);
    }, 30000);
    return () => clearInterval(interval);
  }, [houses, weatherData]);

  const addHome = (homeData: Omit<HouseData, 'id'>) => {
    const newId = `home_${Date.now()}`;
    setHouses(prev => [...prev, { ...homeData, id: newId, aiPrediction: 85, blockchainVerified: false, iotSensors: 10, quantumEfficiency: 90 }]);
    setShowAddForm(false);
  };

  const handleLocationBasedAdd = (homeData: any) => {
    // Convert the home data from the location suggestion to our format
    const newHome: Omit<HouseData, 'id'> = {
      name: homeData.name || 'New Home',
      tankLevel: Math.floor(Math.random() * 40) + 60, // Random level between 60-100
      waterUsage: Math.floor(Math.random() * 20) + 20, // Random usage between 20-40
      waterQuality: 'good' as const,
      rainwaterCollected: Math.floor(Math.random() * 100) + 50, // Random collection between 50-150
      hasLeak: false,
    };
    addHome(newHome);
    setShowLocationSuggestion(false);
  };

  const updateHome = (updatedHome: HouseData) => {
    setHouses(prev => prev.map(h => h.id === updatedHome.id ? updatedHome : h));
    setEditingHouse(null);
  };

  const deleteHome = (homeId: string) => {
    setHouses(prev => prev.filter(h => h.id !== homeId));
    if (activeHouse === homeId) setActiveHouse(null);
    if (editingHouse?.id === homeId) setEditingHouse(null);
  };

  const totalStorage = houses.reduce((sum, h) => sum + (h.tankLevel * 100), 0);

  return (
    <div className="relative w-full h-screen bg-gradient-to-br from-gray-950 via-blue-950 to-purple-950 overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-600/20 via-purple-600/10 to-transparent animate-pulse" style={{ animationDuration: '4s' }}></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-blue-600/10 via-transparent to-transparent"></div>
      </div>
      
      <div className="relative h-full">
        <div className="absolute top-0 left-0 right-0 z-10 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-2xl shadow-2xl flex items-center justify-center animate-pulse" style={{ animationDuration: '3s' }}>
                  <Waves className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-black animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Smart Water Ecosystem
                </h1>
                <div className="flex items-center space-x-3 mt-1">
                  <span className="text-xs text-cyan-400 flex items-center">
                    <Brain className="h-3 w-3 mr-1" />
                    AI-Powered
                  </span>
                  <span className="text-xs text-green-400 flex items-center">
                    <Lock className="h-3 w-3 mr-1" />
                    Blockchain Verified
                  </span>
                  <span className="text-xs text-purple-400 flex items-center">
                    <Zap className="h-3 w-3 mr-1" />
                    Quantum Optimized
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="px-4 py-2 bg-black/50 backdrop-blur-xl rounded-xl border border-cyan-500/30">
                <div className="flex items-center space-x-3">
                  <div className="text-xs text-gray-400">System Status</div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-bold text-green-400">OPTIMAL</span>
                  </div>
                </div>
              </div>
              <div className="px-4 py-2 bg-black/50 backdrop-blur-xl rounded-xl border border-purple-500/30">
                <div className="text-xs text-gray-400">Efficiency</div>
                <div className="text-lg font-bold text-purple-400">{aiPredictions?.efficiency?.toFixed(0) || 89}%</div>
              </div>
              <button
                onClick={() => setIsEditMode(!isEditMode)}
                className={`px-6 py-3 rounded-xl font-bold transition-all shadow-2xl ${
                  isEditMode ? 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600' : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'
                } text-white`}
              >
                {isEditMode ? (
                  <span className="flex items-center">
                    <Settings className="h-5 w-5 mr-2 animate-spin" style={{ animationDuration: '2s' }} />
                    Exit Edit
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Edit3 className="h-5 w-5 mr-2" />
                    Edit Town
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        <Canvas shadows camera={{ position: [15, 15, 15], fov: 45 }}>
          <Suspense fallback={null}>
            <ambientLight intensity={0.3} />
            <directionalLight position={[10, 15, 5]} intensity={1.5} castShadow shadow-mapSize={[4096, 4096]} />
            <pointLight position={[0, 10, 0]} intensity={0.8} color="#00D9FF" />
            <pointLight position={[-10, 5, -10]} intensity={0.5} color="#8B5CF6" />
            <pointLight position={[10, 5, 10]} intensity={0.5} color="#10B981" />

            <fog attach="fog" args={['#030014', 20, 50]} />
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade />

            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
              <planeGeometry args={[50, 50, 50, 50]} />
              <meshStandardMaterial color="#001122" metalness={0.8} roughness={0.2} wireframe transparent opacity={0.3} />
            </mesh>

            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.51, 0]} receiveShadow>
              <planeGeometry args={[50, 50]} />
              <meshStandardMaterial color="#000511" metalness={0.5} roughness={0.5} />
            </mesh>

            <group position={[0, 0, 0]}>
              <mesh position={[0, 0, 0]} receiveShadow castShadow>
                <cylinderGeometry args={[3, 3.2, 2, 32]} />
                <meshStandardMaterial color="#0EA5E9" metalness={0.7} roughness={0.3} transparent opacity={0.9} />
              </mesh>
              <QuantumFlowLines houses={houses} />
            </group>

            <BlockchainNodes houses={houses} />
            <IoTSensorNetwork houses={houses} />

            {houses.map((house, index) => {
              const position = getHousePosition(index, houses.length);
              return (
                <SmartHouse
                  key={house.id}
                  position={position}
                  scale={1}
                  color={house.hasLeak ? "#FCA5A5" : "#60A5FA"}
                  data={house}
                  isActive={activeHouse === house.id}
                  onClick={() => setActiveHouse(house.id === activeHouse ? null : house.id)}
                />
              );
            })}

            <group position={[-10, 0, -10]}>
              <mesh castShadow>
                <boxGeometry args={[4, 3, 3]} />
                <meshStandardMaterial color="#374151" metalness={0.6} roughness={0.4} />
              </mesh>
              <pointLight position={[0, 2, 0]} color="#10B981" intensity={3} distance={8} />
              <Text position={[0, 4, 0]} fontSize={0.4} color="#FFFFFF" anchorX="center">
                Treatment Plant
              </Text>
            </group>

            <group position={[12, -0.4, 10]}>
              <mesh receiveShadow>
                <cylinderGeometry args={[6, 6, 0.2, 32]} />
                <meshStandardMaterial color="#0E4429" metalness={0.4} roughness={0.6} />
              </mesh>
              <mesh position={[0, 0.1, 0]}>
                <cylinderGeometry args={[5.8, 5.8, 0.05, 32]} />
                <meshStandardMaterial color="#0EA5E9" transparent opacity={0.7} metalness={0.9} roughness={0.1} />
              </mesh>
              <Text position={[0, 1, 6]} fontSize={0.4} color="#FFFFFF" anchorX="center">
                Natural Lake
              </Text>
            </group>

            {rainInput > 0 && (
              <group>
                <RainEffect intensity={rainInput / 10} />
                <group position={[0, 12, 0]}>
                  {[[-5, 0, -5], [5, 0, 5], [-5, 0, 5]].map((pos, i) => (
                    <mesh key={i} position={pos as [number, number, number]}>
                      <sphereGeometry args={[1.5, 16, 16]} />
                      <meshStandardMaterial color="#4B5563" transparent opacity={0.8} emissive="#1F2937" emissiveIntensity={0.2} />
                    </mesh>
                  ))}
                </group>
              </group>
            )}

            <OrbitControls
              enablePan
              enableZoom
              enableRotate
              minDistance={10}
              maxDistance={30}
              maxPolarAngle={Math.PI / 2.1}
              autoRotate
              autoRotateSpeed={0.5}
            />
          </Suspense>
        </Canvas>

        <DigitalTwinPanel houses={houses} aiPredictions={aiPredictions} />
        <WaterQualityPanel />
        <BlockchainTradingPanel houses={houses} />
        <ARTechnicianPanel activeHouse={activeHouse} />
        <WeatherPredictionPanel rainInput={rainInput} />
        <SensorFusionPanel houses={houses} />

        <div className="absolute bottom-4 right-1/3 transform -translate-x-1/2 bg-black/90 backdrop-blur-2xl rounded-2xl p-4 shadow-2xl border border-cyan-500/30">
          <div className="flex items-center space-x-8">
            <div className="text-center">
              <div className="text-xs text-cyan-300 mb-1">Total Water Stored</div>
              <div className="text-2xl font-bold text-white">{totalStorage.toLocaleString()} L</div>
            </div>
            <div className="h-10 w-px bg-cyan-500/30"></div>
            <div className="text-center">
              <div className="text-xs text-purple-300 mb-1">Predicted Efficiency</div>
              <div className="text-2xl font-bold text-purple-300">{aiPredictions?.efficiency?.toFixed(0) || 89}%</div>
            </div>
            <div className="h-10 w-px bg-cyan-500/30"></div>
            <div className="text-center">
              <div className="text-xs text-green-300 mb-1">Leak Probability</div>
              <div className="text-2xl font-bold text-green-300">&lt;1.2%</div>
            </div>
          </div>
        </div>

        {isEditMode && (
          <div className="absolute bottom-20 left-4 w-96 max-h-[500px] overflow-y-auto bg-gradient-to-br from-gray-900/98 to-gray-800/98 backdrop-blur-2xl rounded-2xl p-5 shadow-2xl border border-purple-500/30 animate-fadeIn">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-purple-500/20">
              <h4 className="text-xl font-bold text-white flex items-center">
                <Settings className="h-5 w-5 mr-2 text-purple-400" />
                Town Editor
              </h4>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-sm font-bold rounded-xl transition-all shadow-lg"
              >
                <Plus className="h-4 w-4 inline mr-1" />
                Add Home
              </button>
            </div>

            <div className="space-y-2 mb-4">
              {houses.map((home) => (
                <div key={home.id} className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-xl p-3 border border-gray-600/30 hover:border-blue-500/50 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-white font-bold flex items-center">
                        <Home className="h-4 w-4 mr-2 text-blue-400" />
                        {home.name}
                      </div>
                      <div className="text-gray-400 text-xs mt-1 grid grid-cols-2 gap-2">
                        <span>🪣 {home.tankLevel}%</span>
                        <span>💧 {home.waterUsage} L/h</span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setEditingHouse(home);
                          setShowAddForm(false);
                        }}
                        className="p-2 bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 rounded-lg transition-all"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteHome(home.id)}
                        className="p-2 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-lg transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {(showAddForm || editingHouse) && (
              <HomeEditForm
                home={editingHouse}
                onSave={editingHouse ? updateHome : addHome}
                onCancel={() => {
                  setEditingHouse(null);
                  setShowAddForm(false);
                }}
                isEditing={!!editingHouse}
              />
            )}

            <div className="border-t border-purple-500/20 pt-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    const dataStr = JSON.stringify(houses, null, 2);
                    const dataBlob = new Blob([dataStr], { type: 'application/json' });
                    const url = URL.createObjectURL(dataBlob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = 'water_town_config.json';
                    link.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-sm font-bold rounded-xl transition-all shadow-lg flex items-center justify-center"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Config
                </button>
                <label className="px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white text-sm font-bold rounded-xl transition-all shadow-lg cursor-pointer flex items-center justify-center">
                  <Upload className="h-4 w-4 mr-2" />
                  Load Config
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                          try {
                            const loaded = JSON.parse(e.target?.result as string);
                            setHouses(loaded);
                          } catch {
                            alert('Invalid file format');
                          }
                        };
                        reader.readAsText(file);
                      }
                    }}
                  />
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
}