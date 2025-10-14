import React, { useState, useRef, Suspense, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Stars, Line } from '@react-three/drei';
import {
  Droplets, Activity, Waves, Shield, Edit3, Plus, Save, Upload, Trash2,
  Settings, Brain, Cpu, Zap, Radio, AlertTriangle, TrendingUp, Coins,
  Cloud, Database, Lock, Eye, Gauge, Wifi, MapPin, Building2, Factory,
  Thermometer, Users, Battery, Wind, Sun, Navigation, Smartphone, Glasses
} from 'lucide-react';
import * as THREE from 'three';

interface MicroReservoir {
  id: string;
  capacity: number;
  currentLevel: number;
  status: 'active' | 'standby' | 'backup';
}

interface WaterQualityMetrics {
  ph: number;
  turbidity: number;
  hardness: number;
  chlorine: number;
}

interface ZoneData {
  id: string;
  name: string;
  population: number;
  waterDemand: number;
  supplyStatus: 'active' | 'scheduled' | 'off';
  scheduleTime?: string;
  pressure: number;
  flowRate: number;
  leakDetected: boolean;
  type: 'residential' | 'commercial' | 'industrial';
  microReservoir?: MicroReservoir;
  waterQuality: WaterQualityMetrics;
  waterCredits: number;
  energySource: 'grid' | 'solar' | 'gravity';
  boundaryFlexible: boolean;
}

interface CentralTankData {
  currentLevel: number;
  capacity: number;
  inflow: number;
  outflow: number;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  pressure: number;
  temperature: number;
  solarPower: number;
}

interface DroneData {
  id: string;
  position: [number, number, number];
  status: 'scanning' | 'idle' | 'alert';
  lastScan: string;
  anomalyDetected: boolean;
}

const CentralWaterTank = ({ data, onClick }: any) => {
  const tankRef = useRef<THREE.Group>(null);
  const waterRef = useRef<THREE.Mesh>(null);
  const solarPanelRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    if (tankRef.current) {
      tankRef.current.position.y = Math.sin(time * 0.5) * 0.05;
    }
    if (waterRef.current && waterRef.current.material) {
      const material = waterRef.current.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = 0.3 + Math.sin(time * 2) * 0.1;
    }
    if (solarPanelRef.current) {
      solarPanelRef.current.rotation.y = time * 0.2;
    }
  });

  const waterHeight = (data.currentLevel / 100) * 4;

  return (
    <group ref={tankRef} position={[0, 0, 0]} onClick={onClick}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[3, 3.5, 6, 32]} />
        <meshStandardMaterial color="#2C5282" transparent opacity={0.3} metalness={0.8} roughness={0.2} />
      </mesh>

      <mesh ref={waterRef} position={[0, -3 + waterHeight / 2, 0]}>
        <cylinderGeometry args={[2.8, 3.3, waterHeight, 32]} />
        <meshStandardMaterial color="#0EA5E9" transparent opacity={0.8} metalness={0.6} roughness={0.1} emissive="#0EA5E9" emissiveIntensity={0.3} />
      </mesh>

      <mesh position={[0, 3, 0]} castShadow>
        <coneGeometry args={[3.5, 1.5, 32]} />
        <meshStandardMaterial color="#1F2937" metalness={0.7} roughness={0.3} />
      </mesh>

      <mesh ref={solarPanelRef} position={[0, 4, 0]} rotation={[Math.PI / 6, 0, 0]}>
        <boxGeometry args={[4, 0.1, 3]} />
        <meshStandardMaterial color="#1E40AF" metalness={0.9} roughness={0.1} emissive="#3B82F6" emissiveIntensity={0.5} />
      </mesh>

      <pointLight position={[0, 0, 0]} color="#0EA5E9" intensity={2} distance={10} />

      {[0, 90, 180, 270].map((angle, i) => (
        <group key={i} position={[Math.cos(angle * Math.PI / 180) * 3.2, 1, Math.sin(angle * Math.PI / 180) * 3.2]}>
          <mesh>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshStandardMaterial color="#00FF88" emissive="#00FF88" emissiveIntensity={2} />
          </mesh>
          <mesh position={[0, 0.2, 0]}>
            <boxGeometry args={[0.15, 0.05, 0.15]} />
            <meshStandardMaterial color="#FCD34D" metalness={0.9} roughness={0.1} />
          </mesh>
        </group>
      ))}

      <Html position={[0, 5, 0]} center>
        <div className="px-4 py-3 rounded-xl backdrop-blur-xl bg-gradient-to-r from-blue-600/90 to-cyan-600/90 text-white border border-cyan-400/50 shadow-2xl">
          <div className="font-bold text-lg mb-2 text-center flex items-center justify-center">
            <Waves className="h-5 w-5 mr-2" />
            CENTRAL TANK
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-cyan-200 text-xs">Level</div>
              <div className="font-bold text-xl">{data.currentLevel}%</div>
            </div>
            <div>
              <div className="text-cyan-200 text-xs">Capacity</div>
              <div className="font-bold text-xl">{(data.capacity / 1000).toFixed(0)}k L</div>
            </div>
            <div>
              <div className="text-cyan-200 text-xs flex items-center">
                <Sun className="h-3 w-3 mr-1" />
                Solar
              </div>
              <div className="font-bold text-yellow-300">{data.solarPower}kW</div>
            </div>
            <div>
              <div className="text-cyan-200 text-xs">Quality</div>
              <div className="font-bold text-green-300">{data.quality.toUpperCase()}</div>
            </div>
          </div>
        </div>
      </Html>
    </group>
  );
};

const MicroReservoirNode = ({ position, data }: any) => {
  const reservoirRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (reservoirRef.current) {
      reservoirRef.current.position.y = position[1] + Math.sin(clock.getElapsedTime() * 2) * 0.05;
    }
  });

  return (
    <group position={position}>
      <mesh ref={reservoirRef} castShadow>
        <cylinderGeometry args={[0.5, 0.6, 1, 16]} />
        <meshStandardMaterial 
          color={data.status === 'active' ? '#10B981' : data.status === 'backup' ? '#F59E0B' : '#6B7280'}
          metalness={0.7}
          roughness={0.3}
          transparent
          opacity={0.8}
        />
      </mesh>
      <mesh position={[0, -0.5 + (data.currentLevel / 100) * 0.5, 0]}>
        <cylinderGeometry args={[0.45, 0.55, (data.currentLevel / 100), 16]} />
        <meshStandardMaterial color="#0EA5E9" transparent opacity={0.9} emissive="#0EA5E9" emissiveIntensity={0.2} />
      </mesh>
      <Html position={[0, 1, 0]} center>
        <div className="px-2 py-1 bg-black/80 rounded text-white text-xs">
          Micro: {data.currentLevel}%
        </div>
      </Html>
    </group>
  );
};

const DroneScanner = ({ data }: any) => {
  const droneRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (droneRef.current && data.status === 'scanning') {
      droneRef.current.rotation.y = clock.getElapsedTime() * 2;
    }
  });

  return (
    <group ref={droneRef} position={data.position}>
      <mesh>
        <boxGeometry args={[0.3, 0.1, 0.3]} />
        <meshStandardMaterial color="#EF4444" metalness={0.8} roughness={0.2} />
      </mesh>
      {[[-0.2, 0.1, -0.2], [0.2, 0.1, -0.2], [-0.2, 0.1, 0.2], [0.2, 0.1, 0.2]].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]}>
          <cylinderGeometry args={[0.05, 0.05, 0.02, 8]} />
          <meshStandardMaterial color="#374151" />
        </mesh>
      ))}
      {data.anomalyDetected && (
        <pointLight color="#FF0000" intensity={2} distance={3} />
      )}
      <Html position={[0, 0.5, 0]} center>
        <div className={`px-2 py-1 rounded text-xs ${data.anomalyDetected ? 'bg-red-600 animate-pulse' : 'bg-blue-600'} text-white`}>
          🚁 {data.status.toUpperCase()}
        </div>
      </Html>
    </group>
  );
};

const DistributionPipeline = ({ start, end, isActive, flowRate, energySource }: any) => {
  const lineRef = useRef<any>(null);

  useFrame(({ clock }) => {
    if (lineRef.current && isActive) {
      const material = lineRef.current.material;
      material.opacity = 0.6 + Math.sin(clock.getElapsedTime() * 3) * 0.2;
    }
  });

  const getColor = () => {
    if (!isActive) return "#4B5563";
    switch (energySource) {
      case 'solar': return "#FCD34D";
      case 'gravity': return "#10B981";
      default: return "#00FF88";
    }
  };

  return (
    <Line ref={lineRef} points={[start, end]} color={getColor()} lineWidth={isActive ? 4 : 2} transparent opacity={isActive ? 0.8 : 0.3} />
  );
};

const ZoneArea = ({ position, data, isActive, onClick }: any) => {
  const zoneRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (isActive && zoneRef.current) {
      zoneRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.8) * 0.1;
    }
  });

  const getZoneColor = () => {
    switch (data.type) {
      case 'residential': return '#60A5FA';
      case 'commercial': return '#F59E0B';
      case 'industrial': return '#8B5CF6';
      default: return '#60A5FA';
    }
  };

  return (
    <group ref={zoneRef} position={position} onClick={onClick}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[data.boundaryFlexible ? 2.3 : 2, 0.5, data.boundaryFlexible ? 2.3 : 2]} />
        <meshStandardMaterial 
          color={getZoneColor()} 
          metalness={0.5} 
          roughness={0.5}
          transparent
          opacity={data.boundaryFlexible ? 0.6 : 0.8}
        />
      </mesh>

      {data.boundaryFlexible && (
        <mesh position={[0, 0.5, 0]}>
          <ringGeometry args={[1.8, 2, 32]} />
          <meshBasicMaterial color="#00FFFF" transparent opacity={0.3} />
        </mesh>
      )}

      <mesh position={[0, 0.8, 0]} castShadow>
        <boxGeometry args={[1.5, 1.2, 1.5]} />
        <meshStandardMaterial color={getZoneColor()} metalness={0.3} roughness={0.7} />
      </mesh>

      {data.microReservoir && (
        <MicroReservoirNode position={[1.2, 0.8, 0]} data={data.microReservoir} />
      )}

      <mesh position={[0, 2.5, 0]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial 
          color={data.supplyStatus === 'active' ? '#10B981' : '#6B7280'}
          emissive={data.supplyStatus === 'active' ? '#10B981' : '#6B7280'}
          emissiveIntensity={2}
        />
      </mesh>

      {data.energySource === 'solar' && (
        <mesh position={[0, 2, 0]} rotation={[Math.PI / 4, 0, 0]}>
          <boxGeometry args={[0.6, 0.05, 0.4]} />
          <meshStandardMaterial color="#FCD34D" metalness={0.9} emissive="#FCD34D" emissiveIntensity={0.5} />
        </mesh>
      )}

      {data.leakDetected && (
        <Html position={[0, 3, 0]} center>
          <div className="px-2 py-1 bg-red-600/90 text-white text-xs rounded-lg animate-pulse">
            ⚠️ LEAK
          </div>
        </Html>
      )}

      <Html position={[0, -1.5, 0]} center>
        <div className={`px-3 py-2 rounded-xl backdrop-blur-xl transition-all ${
          isActive ? 'bg-gradient-to-r from-cyan-500/90 to-purple-500/90 text-white scale-110' : 'bg-black/70 text-cyan-300'
        } border border-cyan-500/50 shadow-2xl`}>
          <div className="font-bold text-sm flex items-center justify-center">
            {data.name}
          </div>
          <div className="text-xs opacity-90 mt-1 grid grid-cols-2 gap-2">
            <span>💰 {data.waterCredits} WC</span>
            <span className={data.supplyStatus === 'active' ? 'text-green-300' : 'text-gray-400'}>
              {data.supplyStatus === 'active' ? '● ON' : '○ OFF'}
            </span>
          </div>
        </div>
      </Html>

      {isActive && (
        <Html position={[0, -4.5, 0]} center>
          <div className="bg-black/90 backdrop-blur-2xl text-cyan-300 p-4 rounded-2xl shadow-2xl border border-cyan-500/50 w-96">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-cyan-500/30">
              <h4 className="font-bold text-lg text-white">{data.name}</h4>
              <div className={`w-2 h-2 rounded-full animate-pulse ${data.supplyStatus === 'active' ? 'bg-green-500' : 'bg-gray-500'}`}></div>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-3">
              <div className="bg-blue-500/10 rounded-lg p-2 border border-blue-500/30">
                <Activity className="h-3 w-3 text-blue-400 mb-1" />
                <div className="text-sm font-bold text-blue-300">{data.flowRate}</div>
                <div className="text-xs text-gray-400">L/min</div>
              </div>
              <div className="bg-purple-500/10 rounded-lg p-2 border border-purple-500/30">
                <Gauge className="h-3 w-3 text-purple-400 mb-1" />
                <div className="text-sm font-bold text-purple-300">{data.pressure}</div>
                <div className="text-xs text-gray-400">bar</div>
              </div>
              <div className="bg-green-500/10 rounded-lg p-2 border border-green-500/30">
                <Coins className="h-3 w-3 text-green-400 mb-1" />
                <div className="text-sm font-bold text-green-300">{data.waterCredits}</div>
                <div className="text-xs text-gray-400">Credits</div>
              </div>
              <div className="bg-yellow-500/10 rounded-lg p-2 border border-yellow-500/30">
                {data.energySource === 'solar' ? <Sun className="h-3 w-3 text-yellow-400 mb-1" /> : <Zap className="h-3 w-3 text-cyan-400 mb-1" />}
                <div className="text-xs font-bold text-yellow-300 uppercase">{data.energySource}</div>
              </div>
            </div>

            <div className="space-y-2 mb-3">
              <div className="p-2 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-lg border border-cyan-500/20">
                <div className="text-xs text-cyan-300 mb-1">Water Quality Profile</div>
                <div className="grid grid-cols-4 gap-1 text-xs">
                  <div><span className="text-gray-400">pH:</span> <span className="text-white font-bold">{data.waterQuality.ph}</span></div>
                  <div><span className="text-gray-400">Turb:</span> <span className="text-white font-bold">{data.waterQuality.turbidity}</span></div>
                  <div><span className="text-gray-400">Hard:</span> <span className="text-white font-bold">{data.waterQuality.hardness}</span></div>
                  <div><span className="text-gray-400">Cl:</span> <span className="text-white font-bold">{data.waterQuality.chlorine}</span></div>
                </div>
              </div>

              {data.microReservoir && (
                <div className="p-2 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/20">
                  <div className="text-xs text-green-300 mb-1">Micro-Reservoir Status</div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Level: {data.microReservoir.currentLevel}%</span>
                    <span className="text-xs font-bold text-green-400 uppercase">{data.microReservoir.status}</span>
                  </div>
                </div>
              )}

              {data.boundaryFlexible && (
                <div className="p-2 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-lg border border-cyan-500/20">
                  <div className="text-xs text-cyan-300">🔄 Dynamic Zone - Boundaries adjust based on demand</div>
                </div>
              )}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
};

export default function TownWaterVisualization() {
  console.log('TownWaterVisualization: Component rendering');

  const [centralTank, setCentralTank] = useState<CentralTankData>({
    currentLevel: 78,
    capacity: 500000,
    inflow: 8500,
    outflow: 7200,
    quality: 'good',
    pressure: 3.2,
    temperature: 24,
    solarPower: 45
  });

  const [zones, setZones] = useState<ZoneData[]>([
    { 
      id: 'zone1', name: 'Sector A (North)', population: 5000, waterDemand: 2100, supplyStatus: 'active', 
      pressure: 2.8, flowRate: 120, leakDetected: false, type: 'residential',
      microReservoir: { id: 'mr1', capacity: 50000, currentLevel: 85, status: 'active' },
      waterQuality: { ph: 7.2, turbidity: 2, hardness: 120, chlorine: 0.8 },
      waterCredits: 450, energySource: 'solar', boundaryFlexible: true
    },
    { 
      id: 'zone2', name: 'Commercial Hub', population: 2000, waterDemand: 1800, supplyStatus: 'active',
      pressure: 3.1, flowRate: 95, leakDetected: false, type: 'commercial',
      microReservoir: { id: 'mr2', capacity: 30000, currentLevel: 72, status: 'backup' },
      waterQuality: { ph: 7.4, turbidity: 1.5, hardness: 115, chlorine: 0.9 },
      waterCredits: 380, energySource: 'grid', boundaryFlexible: false
    },
    { 
      id: 'zone3', name: 'Sector B (East)', population: 6500, waterDemand: 2500, supplyStatus: 'active',
      pressure: 2.6, flowRate: 140, leakDetected: true, type: 'residential',
      microReservoir: { id: 'mr3', capacity: 60000, currentLevel: 45, status: 'active' },
      waterQuality: { ph: 7.0, turbidity: 3, hardness: 135, chlorine: 0.7 },
      waterCredits: 290, energySource: 'gravity', boundaryFlexible: true
    },
    { 
      id: 'zone4', name: 'Industrial Area', population: 1500, waterDemand: 3200, supplyStatus: 'scheduled',
      scheduleTime: '6:00 AM', pressure: 2.2, flowRate: 0, leakDetected: false, type: 'industrial',
      waterQuality: { ph: 7.1, turbidity: 2.5, hardness: 125, chlorine: 0.85 },
      waterCredits: 520, energySource: 'grid', boundaryFlexible: false
    },
    { 
      id: 'zone5', name: 'Sector C (South)', population: 4800, waterDemand: 1950, supplyStatus: 'active',
      pressure: 2.9, flowRate: 110, leakDetected: false, type: 'residential',
      microReservoir: { id: 'mr5', capacity: 45000, currentLevel: 90, status: 'standby' },
      waterQuality: { ph: 7.3, turbidity: 1.8, hardness: 118, chlorine: 0.82 },
      waterCredits: 410, energySource: 'solar', boundaryFlexible: true
    },
    { 
      id: 'zone6', name: 'Sector D (West)', population: 5500, waterDemand: 2200, supplyStatus: 'scheduled',
      scheduleTime: '8:00 PM', pressure: 0, flowRate: 0, leakDetected: false, type: 'residential',
      waterQuality: { ph: 7.2, turbidity: 2.2, hardness: 122, chlorine: 0.78 },
      waterCredits: 360, energySource: 'gravity', boundaryFlexible: true
    }
  ]);

  const [drones, setDrones] = useState<DroneData[]>([
    { id: 'drone1', position: [8, 8, 8], status: 'scanning', lastScan: '2 min ago', anomalyDetected: false },
    { id: 'drone2', position: [-8, 10, -8], status: 'idle', lastScan: '5 min ago', anomalyDetected: false }
  ]);

  const [activeZone, setActiveZone] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showBlockchain, setShowBlockchain] = useState(false);
  const [showARPanel, setShowARPanel] = useState(false);

  const getZonePosition = (index: number, total: number): [number, number, number] => {
    const radius = 8;
    const angle = (index / total) * Math.PI * 2;
    return [Math.sin(angle) * radius, 0, Math.cos(angle) * radius];
  };

  const totalPopulation = zones.reduce((sum, z) => sum + z.population, 0);
  const totalCredits = zones.reduce((sum, z) => sum + z.waterCredits, 0);
  const activeZones = zones.filter(z => z.supplyStatus === 'active').length;
  const solarZones = zones.filter(z => z.energySource === 'solar').length;

  console.log('TownWaterVisualization: Rendering JSX');

  return (
    <div className="relative w-full h-screen bg-gradient-to-br from-gray-950 via-blue-950 to-purple-950 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-600/20 via-purple-600/10 to-transparent animate-pulse" style={{ animationDuration: '4s' }}></div>

      <div className="relative h-full">
        <div className="absolute top-0 left-0 right-0 z-10 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-2xl shadow-2xl flex items-center justify-center">
                <Waves className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Next-Gen Water Distribution
                </h1>
                <div className="flex items-center space-x-3 mt-1">
                  <span className="text-xs text-cyan-400 flex items-center"><Brain className="h-3 w-3 mr-1" />AI Dynamic Zones</span>
                  <span className="text-xs text-green-400 flex items-center"><Lock className="h-3 w-3 mr-1" />Blockchain Credits</span>
                  <span className="text-xs text-yellow-400 flex items-center"><Sun className="h-3 w-3 mr-1" />Solar + Gravity</span>
                  <span className="text-xs text-purple-400 flex items-center"><Navigation className="h-3 w-3 mr-1" />Drone Patrol</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button onClick={() => setShowBlockchain(!showBlockchain)} className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-xl text-white text-sm font-bold transition-all">
                <Coins className="h-4 w-4 inline mr-1" />Credits
              </button>
              <button onClick={() => setShowARPanel(!showARPanel)} className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-xl text-white text-sm font-bold transition-all">
                <Glasses className="h-4 w-4 inline mr-1" />AR View
              </button>
              <button onClick={() => setIsEditMode(!isEditMode)} className={`px-6 py-3 rounded-xl font-bold transition-all shadow-2xl ${isEditMode ? 'bg-gradient-to-r from-red-500 to-pink-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'} text-white`}>
                {isEditMode ? 'Exit Edit' : 'Control Panel'}
              </button>
            </div>
          </div>
        </div>

        <Canvas shadows camera={{ position: [20, 15, 20], fov: 45 }}>
          <Suspense fallback={null}>
            <ambientLight intensity={0.3} />
            <directionalLight position={[10, 15, 5]} intensity={1.5} castShadow />
            <pointLight position={[0, 10, 0]} intensity={0.8} color="#00D9FF" />

            <fog attach="fog" args={['#030014', 25, 60]} />
            <Stars radius={100} depth={50} count={5000} factor={4} />

            {/* Ground grid */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
              <planeGeometry args={[60, 60, 60, 60]} />
              <meshStandardMaterial color="#001122" metalness={0.8} roughness={0.2} wireframe transparent opacity={0.25} />
            </mesh>

            {/* Solid ground base */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.52, 0]} receiveShadow>
              <planeGeometry args={[60, 60]} />
              <meshStandardMaterial color="#000511" metalness={0.4} roughness={0.6} />
            </mesh>

            {/* Central tank */}
            <CentralWaterTank
              data={centralTank}
              onClick={() => setActiveZone(null)}
            />

            {/* Zones + pipelines */}
            {zones.map((zone, index) => {
              const position = getZonePosition(index, zones.length);
              const isActive = activeZone === zone.id;
              return (
                <React.Fragment key={zone.id}>
                  <ZoneArea
                    position={position}
                    data={zone}
                    isActive={isActive}
                    onClick={() => setActiveZone(isActive ? null : zone.id)}
                  />
                  <DistributionPipeline
                    start={[0, 1, 0]}
                    end={[position[0], position[1] + 0.5, position[2]]}
                    isActive={zone.supplyStatus === 'active'}
                    flowRate={zone.flowRate}
                    energySource={zone.energySource}
                  />
                </React.Fragment>
              );
            })}

            {/* Drones */}
            {drones.map((d) => (
              <DroneScanner key={d.id} data={d} />
            ))}

            {/* Example treatment plant */}
            <group position={[-14, 0, -12]}>
              <mesh castShadow>
                <boxGeometry args={[5, 3.5, 4]} />
                <meshStandardMaterial color="#374151" metalness={0.6} roughness={0.4} />
              </mesh>
              <mesh position={[0, 2.5, 0]}>
                <cylinderGeometry args={[1.4, 1.4, 0.8, 16]} />
                <meshStandardMaterial color="#10B981" emissive="#10B981" emissiveIntensity={0.5} />
              </mesh>
              <pointLight position={[0, 3, 0]} color="#10B981" intensity={2.5} distance={8} />
              <Html position={[0, 4.6, 0]} center>
                <div className="px-3 py-2 bg-gradient-to-r from-green-600/90 to-emerald-600/90 text-white text-xs font-bold rounded-xl border border-green-400/50">
                  Treatment Plant
                </div>
              </Html>
            </group>

            {/* Example natural reservoir */}
            <group position={[14, -0.4, 14]}>
              <mesh receiveShadow>
                <cylinderGeometry args={[7, 7, 0.3, 32]} />
                <meshStandardMaterial color="#0E4429" metalness={0.4} roughness={0.6} />
              </mesh>
              <mesh position={[0, 0.15, 0]}>
                <cylinderGeometry args={[6.7, 6.7, 0.1, 32]} />
                <meshStandardMaterial color="#0EA5E9" transparent opacity={0.7} metalness={0.85} roughness={0.15} />
              </mesh>
              <Html position={[0, 1, 7]} center>
                <div className="px-3 py-2 bg-gradient-to-r from-blue-600/90 to-cyan-600/90 text-white text-xs font-bold rounded-xl border border-cyan-400/50">
                  Natural Lake
                </div>
              </Html>
            </group>

            <OrbitControls
              enablePan
              enableZoom
              enableRotate
              minDistance={15}
              maxDistance={42}
              maxPolarAngle={Math.PI / 2.1}
              autoRotate
              autoRotateSpeed={0.5}
            />
          </Suspense>
        </Canvas>

        {showBlockchain && (
          <div className="absolute top-20 right-4 w-96 bg-black/90 backdrop-blur-2xl rounded-2xl p-5 shadow-2xl border border-green-500/30">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-green-500/30">
              <h4 className="text-xl font-bold text-white flex items-center">
                <Lock className="h-5 w-5 mr-2 text-green-400" />
                Blockchain Credits
              </h4>
              <button onClick={() => setShowBlockchain(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <div className="space-y-3">
              {zones.map((z) => (
                <div key={z.id} className="p-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/20">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white font-bold">{z.name}</span>
                    <span className="text-lg font-bold text-green-400">{z.waterCredits} WC</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Pop: {z.population.toLocaleString()} | Type: {z.type}
                  </div>
                </div>
              ))}
              <div className="mt-4 p-3 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-lg border border-cyan-500/30">
                <div className="text-xs text-cyan-300 mb-1">Total System Credits</div>
                <div className="text-3xl font-bold text-white">{totalCredits} WC</div>
              </div>
            </div>
          </div>
        )}

        {/* AR panel */}
        {showARPanel && (
          <div className="absolute top-20 right-4 w-96 bg-black/90 backdrop-blur-2xl rounded-2xl p-5 shadow-2xl border border-orange-500/30">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-orange-500/30">
              <h4 className="text-xl font-bold text-white flex items-center">
                <Glasses className="h-5 w-5 mr-2 text-orange-400" />
                AR Field View
              </h4>
              <button onClick={() => setShowARPanel(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-xl border border-orange-500/30">
                <div className="text-sm text-orange-300 mb-2">🎯 AR Scan Mode Active</div>
                <div className="text-xs text-gray-300 space-y-2">
                  <div>• Point device at water infrastructure</div>
                  <div>• View real-time sensor overlays</div>
                  <div>• Access maintenance guides</div>
                  <div>• Report issues instantly</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <Smartphone className="h-4 w-4 text-blue-400 mb-1" />
                  <div className="text-xs text-blue-300">Mobile App</div>
                  <div className="text-sm font-bold text-white">Ready</div>
                </div>
                <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                  <Eye className="h-4 w-4 text-purple-400 mb-1" />
                  <div className="text-xs text-purple-300">Devices</div>
                  <div className="text-sm font-bold text-white">12 Active</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom status bar */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/90 backdrop-blur-2xl rounded-2xl p-4 shadow-2xl border border-cyan-500/30">
          <div className="flex items-center space-x-8">
            <div className="text-center">
              <div className="text-xs text-gray-400 mb-1">Total Population</div>
              <div className="text-2xl font-bold text-white">{totalPopulation.toLocaleString()}</div>
            </div>
            <div className="h-10 w-px bg-cyan-500/30"></div>
            <div className="text-center">
              <div className="text-xs text-cyan-300 mb-1 flex items-center justify-center">
                <Zap className="h-3 w-3 mr-1" />
                Active Zones
              </div>
              <div className="text-2xl font-bold text-cyan-300">{activeZones}/{zones.length}</div>
            </div>
            <div className="h-10 w-px bg-cyan-500/30"></div>
            <div className="text-center">
              <div className="text-xs text-yellow-300 mb-1 flex items-center justify-center">
                <Sun className="h-3 w-3 mr-1" />
                Solar Zones
              </div>
              <div className="text-2xl font-bold text-yellow-300">{solarZones}</div>
            </div>
            <div className="h-10 w-px bg-cyan-500/30"></div>
            <div className="text-center">
              <div className="text-xs text-green-300 mb-1">Total Credits</div>
              <div className="text-2xl font-bold text-green-300">{totalCredits} WC</div>
            </div>
          </div>
        </div>

        {/* Edit mode inspector */}
        {isEditMode && (
          <div className="absolute bottom-20 left-4 w-96 max-h-[500px] overflow-y-auto bg-gradient-to-br from-gray-900/98 to-gray-800/98 backdrop-blur-2xl rounded-2xl p-5 shadow-2xl border border-purple-500/30">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-purple-500/20">
              <h4 className="text-xl font-bold text-white flex items-center">
                <Settings className="h-5 w-5 mr-2 text-purple-400" />
                Zone Controls
              </h4>
            </div>
            <div className="space-y-2">
              {zones.map((z) => (
                <div key={z.id} className="p-3 bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-xl border border-gray-600/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-bold flex items-center">
                      {z.type === 'residential' && <Building2 className="h-4 w-4 mr-2 text-blue-400" />}
                      {z.type === 'commercial' && <Factory className="h-4 w-4 mr-2 text-yellow-400" />}
                      {z.type === 'industrial' && <Factory className="h-4 w-4 mr-2 text-purple-400" />}
                      {z.name}
                    </span>
                    <div className={`w-2 h-2 rounded-full ${z.supplyStatus === 'active' ? 'bg-green-500' : 'bg-gray-500'} animate-pulse`}></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                    <div>Demand: {z.waterDemand} L/h</div>
                    <div>Flow: {z.flowRate} L/min</div>
                    <div>Credits: {z.waterCredits} WC</div>
                    <div className="flex items-center">
                      {z.energySource === 'solar' && <Sun className="h-3 w-3 mr-1 text-yellow-400" />}
                      {z.energySource === 'gravity' && <Wind className="h-3 w-3 mr-1 text-green-400" />}
                      {z.energySource === 'grid' && <Zap className="h-3 w-3 mr-1 text-cyan-400" />}
                      {z.energySource}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
