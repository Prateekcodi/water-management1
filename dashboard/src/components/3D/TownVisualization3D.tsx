import React, { useRef, useState, useMemo } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { OrbitControls, Text, Environment, useTexture, Html } from '@react-three/drei'
import * as THREE from 'three'
import { motion } from 'framer-motion'

interface House {
  id: string
  name: string
  tankLevel: number
  waterUsage: number
  waterQuality: 'excellent' | 'good' | 'fair' | 'poor'
  rainwaterCollected: number
  hasLeak: boolean
  position: [number, number, number]
}

interface TownVisualization3DProps {
  houses: House[]
  totalWaterStorage: number
  rainInput: number
  className?: string
}

const Building: React.FC<{
  house: House
  index: number
  onClick: (house: House) => void
}> = ({ house, index, onClick }) => {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5 + index) * 0.05
      if (hovered) {
        meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.1
      }
    }
  })

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return '#2ecc71'
      case 'good': return '#3498db'
      case 'fair': return '#f39c12'
      case 'poor': return '#e74c3c'
      default: return '#95a5a6'
    }
  }

  const getTankColor = (level: number) => {
    if (level > 80) return '#2ecc71'
    if (level > 50) return '#f39c12'
    return '#e74c3c'
  }

  return (
    <group position={house.position}>
      {/* Building Base */}
      <mesh
        ref={meshRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={() => onClick(house)}
        scale={hovered ? 1.1 : 1}
      >
        <boxGeometry args={[1, 1.5, 1]} />
        <meshStandardMaterial
          color={getQualityColor(house.waterQuality)}
          metalness={0.3}
          roughness={0.4}
        />
      </mesh>

      {/* Roof */}
      <mesh position={[0, 1.2, 0]}>
        <coneGeometry args={[0.8, 0.5, 4]} />
        <meshStandardMaterial color="#8b4513" />
      </mesh>

      {/* Water Tank */}
      <mesh position={[0, 2, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.6, 8]} />
        <meshStandardMaterial
          color={getTankColor(house.tankLevel)}
          metalness={0.5}
          roughness={0.2}
        />
      </mesh>

      {/* Water Level in Tank */}
      <mesh position={[0, 2 + (house.tankLevel / 100) * 0.3 - 0.3, 0]}>
        <cylinderGeometry args={[0.28, 0.28, (house.tankLevel / 100) * 0.6, 8]} />
        <meshStandardMaterial
          color="#3498db"
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* Leak Indicator */}
      {house.hasLeak && (
        <mesh position={[0, 1.5, 0]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshBasicMaterial color="#e74c3c" />
        </mesh>
      )}

      {/* House Label */}
      <Text
        position={[0, -1, 0]}
        fontSize={0.2}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        maxWidth={2}
      >
        {house.name}
      </Text>

      {/* Water Level Percentage */}
      <Text
        position={[0, 2.5, 0]}
        fontSize={0.15}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        {`${house.tankLevel}%`}
      </Text>
    </group>
  )
}

const WaterParticles: React.FC<{ rainInput: number }> = ({ rainInput }) => {
  const particlesRef = useRef<THREE.Points>(null)
  const particleCount = Math.floor(rainInput * 20)

  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20
      pos[i * 3 + 1] = Math.random() * 10 + 5
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20
    }
    return pos
  }, [particleCount])

  useFrame((state) => {
    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3 + 1] -= 0.1
        if (positions[i * 3 + 1] < -5) {
          positions[i * 3 + 1] = 10
        }
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true
    }
  })

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.05} color="#4a90e2" transparent opacity={0.6} />
    </points>
  )
}

const TownVisualization3D: React.FC<TownVisualization3DProps> = ({
  houses,
  totalWaterStorage,
  rainInput,
  className = ''
}) => {
  const [selectedHouse, setSelectedHouse] = useState<House | null>(null)
  const [hoveredHouse, setHoveredHouse] = useState<House | null>(null)

  const handleHouseClick = (house: House) => {
    setSelectedHouse(house)
  }

  return (
    <motion.div
      className={`relative w-full h-96 ${className}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <Canvas
        camera={{ position: [8, 6, 8], fov: 50 }}
        style={{ background: 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)' }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-5, 5, -5]} intensity={0.3} color="#74b9ff" />

        <Environment preset="sunset" />

        {/* Ground */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color="#27ae60" />
        </mesh>

        {/* Buildings */}
        {houses.map((house, index) => (
          <Building
            key={house.id}
            house={house}
            index={index}
            onClick={handleHouseClick}
          />
        ))}

        {/* Water Particles (Rain) */}
        <WaterParticles rainInput={rainInput} />

        {/* Central Water Tower */}
        <group position={[0, 0, 0]}>
          <mesh position={[0, 3, 0]}>
            <cylinderGeometry args={[0.5, 0.5, 6, 16]} />
            <meshStandardMaterial color="#34495e" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[0, 6.5, 0]}>
            <cylinderGeometry args={[2, 2, 1, 16]} />
            <meshStandardMaterial color="#3498db" metalness={0.5} roughness={0.2} />
          </mesh>
          <Text
            position={[0, 8, 0]}
            fontSize={0.5}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
          >
            Water Tower
          </Text>
        </group>

        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI - Math.PI / 6}
        />
      </Canvas>

      {/* Overlay Information */}
      <motion.div
        className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg p-4 text-white"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h3 className="text-lg font-bold mb-2">Town Overview</h3>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Total Storage:</span>
            <span className="font-mono">{totalWaterStorage.toLocaleString()}L</span>
          </div>
          <div className="flex justify-between">
            <span>Rain Input:</span>
            <span className="font-mono">{rainInput}mm/h</span>
          </div>
          <div className="flex justify-between">
            <span>Houses:</span>
            <span className="font-mono">{houses.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Avg Level:</span>
            <span className="font-mono">
              {(houses.reduce((sum, h) => sum + h.tankLevel, 0) / houses.length).toFixed(1)}%
            </span>
          </div>
        </div>
      </motion.div>

      {/* Selected House Details */}
      {selectedHouse && (
        <motion.div
          className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg p-4 text-white max-w-xs"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
        >
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-lg font-bold">{selectedHouse.name}</h4>
            <button
              onClick={() => setSelectedHouse(null)}
              className="text-gray-400 hover:text-white"
            >
              ×
            </button>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Tank Level:</span>
              <span className="font-mono">{selectedHouse.tankLevel}%</span>
            </div>
            <div className="flex justify-between">
              <span>Water Usage:</span>
              <span className="font-mono">{selectedHouse.waterUsage}L/day</span>
            </div>
            <div className="flex justify-between">
              <span>Quality:</span>
              <span className="font-mono capitalize">{selectedHouse.waterQuality}</span>
            </div>
            <div className="flex justify-between">
              <span>Rain Collected:</span>
              <span className="font-mono">{selectedHouse.rainwaterCollected}L</span>
            </div>
            {selectedHouse.hasLeak && (
              <div className="flex justify-between text-red-400">
                <span>Status:</span>
                <span className="font-mono">LEAK DETECTED</span>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

export default TownVisualization3D