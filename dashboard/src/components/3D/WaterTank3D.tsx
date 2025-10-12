import React, { useRef, useState, useEffect } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { OrbitControls, Text, Environment, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { motion } from 'framer-motion'

interface WaterTank3DProps {
  waterLevel: number
  temperature: number
  phLevel: number
  turbidity: number
  isLeaking?: boolean
  className?: string
}

const TankMesh: React.FC<{ waterLevel: number; isLeaking: boolean }> = ({ waterLevel, isLeaking }) => {
  const meshRef = useRef<THREE.Mesh>(null)
  const waterRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1
    }
    if (waterRef.current) {
      waterRef.current.position.y = (waterLevel / 100) * 2 - 1
      waterRef.current.scale.y = waterLevel / 100
    }
  })

  const waterColor = new THREE.Color()
  waterColor.setHSL(0.6, 0.8, 0.5) // Blue color

  return (
    <group>
      {/* Tank Body */}
      <mesh
        ref={meshRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        scale={hovered ? 1.05 : 1}
      >
        <cylinderGeometry args={[1, 1, 2, 32]} />
        <meshStandardMaterial
          color={isLeaking ? '#ff6b6b' : '#4a90e2'}
          metalness={0.3}
          roughness={0.2}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Water Level */}
      <mesh ref={waterRef} position={[0, (waterLevel / 100) * 2 - 1, 0]}>
        <cylinderGeometry args={[0.95, 0.95, (waterLevel / 100) * 2, 32]} />
        <meshStandardMaterial
          color={waterColor}
          transparent
          opacity={0.7}
          roughness={0.1}
        />
      </mesh>

      {/* Tank Top */}
      <mesh position={[0, 1, 0]}>
        <cylinderGeometry args={[1.1, 1.1, 0.1, 32]} />
        <meshStandardMaterial color="#2c3e50" metalness={0.5} roughness={0.3} />
      </mesh>

      {/* Leak Effect */}
      {isLeaking && (
        <group>
          {[...Array(5)].map((_, i) => (
            <mesh
              key={i}
              position={[
                Math.cos(i * 1.2) * 0.8,
                -0.8 + Math.sin(Date.now() * 0.001 + i) * 0.1,
                Math.sin(i * 1.2) * 0.8
              ]}
            >
              <sphereGeometry args={[0.02, 8, 8]} />
              <meshBasicMaterial color="#ff6b6b" transparent opacity={0.6} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  )
}

const FloatingParticles: React.FC = () => {
  const particlesRef = useRef<THREE.Points>(null)
  const particleCount = 100

  const positions = new Float32Array(particleCount * 3)
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 10
    positions[i * 3 + 1] = Math.random() * 5
    positions[i * 3 + 2] = (Math.random() - 0.5) * 10
  }

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.1
      particlesRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.1
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
      <pointsMaterial size={0.02} color="#4a90e2" transparent opacity={0.6} />
    </points>
  )
}

const WaterTank3D: React.FC<WaterTank3DProps> = ({
  waterLevel,
  temperature,
  phLevel,
  turbidity,
  isLeaking = false,
  className = ''
}) => {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <motion.div
      className={`relative w-full h-96 ${className}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <Canvas
        camera={{ position: [3, 2, 3], fov: 50 }}
        style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <pointLight position={[-5, 5, -5]} intensity={0.5} color="#4a90e2" />

        <Environment preset="sunset" />

        <TankMesh waterLevel={waterLevel} isLeaking={isLeaking} />
        <FloatingParticles />

        {/* Data Labels */}
        <Text
          position={[0, 2.5, 0]}
          fontSize={0.3}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          {`${waterLevel.toFixed(1)}%`}
        </Text>

        <Text
          position={[0, -2.5, 0]}
          fontSize={0.2}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          {`Temp: ${temperature}°C | pH: ${phLevel} | Turb: ${turbidity}`}
        </Text>

        <OrbitControls
          enablePan={false}
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
        <h3 className="text-lg font-bold mb-2">Water Tank Status</h3>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Level:</span>
            <span className="font-mono">{waterLevel.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between">
            <span>Temperature:</span>
            <span className="font-mono">{temperature}°C</span>
          </div>
          <div className="flex justify-between">
            <span>pH Level:</span>
            <span className="font-mono">{phLevel}</span>
          </div>
          <div className="flex justify-between">
            <span>Turbidity:</span>
            <span className="font-mono">{turbidity} NTU</span>
          </div>
          {isLeaking && (
            <div className="flex justify-between text-red-400">
              <span>Status:</span>
              <span className="font-mono">LEAK DETECTED</span>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default WaterTank3D