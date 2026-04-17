import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Environment } from '@react-three/drei';
import * as THREE from 'three';

const Crystal = ({ position, color, scale, speed, floatIntensity }) => {
    const meshRef = useRef();
    const [hovered, setHover] = useState(false);
    
    // Generate random initial rotation
    const rotation = useMemo(() => [Math.random() * Math.PI, Math.random() * Math.PI, 0], []);

    useFrame((state, delta) => {
        meshRef.current.rotation.x += delta * speed;
        meshRef.current.rotation.y += delta * speed * 1.5;
        
        // Dynamic hover animation using lerp for smoothness
        const targetScale = hovered ? scale * 1.3 : scale;
        meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    });

    return (
        <Float speed={speed * 2} rotationIntensity={1.5} floatIntensity={floatIntensity}>
            <mesh 
                ref={meshRef} 
                position={position} 
                rotation={rotation}
                onPointerOver={() => setHover(true)}
                onPointerOut={() => setHover(false)}
            >
                <icosahedronGeometry args={[1, 0]} />
                <meshStandardMaterial 
                    color={color} 
                    roughness={0.1} 
                    metalness={0.9} 
                    emissive={color}
                    emissiveIntensity={hovered ? 0.8 : 0.2}
                    wireframe={hovered}
                    transparent
                    opacity={0.9}
                />
            </mesh>
        </Float>
    );
};

// Scene wrapper to respond to mouse movement across the entire canvas
const Scene = () => {
    const groupRef = useRef();

    useFrame((state) => {
        // Parallax effect based on mouse position
        const { x, y } = state.pointer;
        groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, -y * 0.2, 0.1);
        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, x * 0.2, 0.1);
    });

    return (
        <group ref={groupRef}>
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 10]} intensity={2} color="#ffffff" />
            <pointLight position={[-10, -10, -10]} intensity={1} color="#6366f1" />
            
            <Crystal position={[-3, 1, -2]} color="#6366f1" scale={0.8} speed={0.2} floatIntensity={2} />
            <Crystal position={[3, -1, -3]} color="#ec4899" scale={1.2} speed={0.15} floatIntensity={3} />
            <Crystal position={[0, -2, -1]} color="#8b5cf6" scale={0.6} speed={0.3} floatIntensity={1.5} />
            <Crystal position={[4, 2, -4]} color="#06b6d4" scale={1} speed={0.1} floatIntensity={2.5} />
            <Crystal position={[-4, -2, -5]} color="#10b981" scale={0.9} speed={0.25} floatIntensity={2} />
            
            <Environment preset="city" />
        </group>
    );
};

const ThreeBackground = () => {
    return (
        <div className="absolute inset-0 z-0">
            <Canvas 
                camera={{ position: [0, 0, 6], fov: 45 }}
                dpr={[1, 2]} // Support high-dpi displays but cap for performance
                gl={{ antialias: false, alpha: true }} // Turn off heavy AA, use alpha for transparent bg
            >
                <Scene />
            </Canvas>
        </div>
    );
};

export default ThreeBackground;
