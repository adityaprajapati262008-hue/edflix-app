"use client";

import React, { useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html, Line, Float } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";

export interface GraphNode {
  id: string;
  label: string;
  level?: string;
}

interface EdFlix3DSceneProps {
  nodes: GraphNode[];
  isGenerating: boolean;
  onSelectNode: (id: string, label: string) => void;
}

const coreVertexShader = `
  uniform float uTime;
  uniform float uIntensity;
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec3 pos = position;
    float wave = sin(pos.x * 4.5 + uTime * 2.4) * cos(pos.y * 4.5 + uTime * 2.0) * sin(pos.z * 4.5 + uTime * 1.8);
    pos += normal * wave * (0.08 + uIntensity * 0.14);
    vPosition = pos;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const coreFragmentShader = `
  uniform float uTime;
  uniform float uIntensity;
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.2);
    vec3 cyan = vec3(0.08, 0.85, 0.98);
    vec3 indigo = vec3(0.38, 0.35, 0.98);
    vec3 amber = vec3(0.98, 0.72, 0.15);

    float mixVal = 0.5 + 0.5 * sin(vPosition.y * 3.0 + uTime * 1.8);
    vec3 baseColor = mix(indigo, cyan, mixVal);
    baseColor = mix(baseColor, amber, uIntensity * 0.55);

    vec3 finalColor = baseColor * (0.65 + fresnel * 1.85);
    gl_FragColor = vec4(finalColor, 0.95);
  }
`;

function AICoreOrb({ isGenerating }: { isGenerating: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uIntensity: { value: 0 },
    }),
    []
  );

  useFrame((state, delta) => {
    uniforms.uTime.value += delta * (isGenerating ? 2.6 : 1.0);
    uniforms.uIntensity.value = THREE.MathUtils.lerp(
      uniforms.uIntensity.value,
      isGenerating ? 1.0 : 0.0,
      0.06
    );
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * (isGenerating ? 1.2 : 0.25);
      meshRef.current.rotation.x += delta * 0.12;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.4} floatIntensity={0.5}>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1.05, 32]} />
        <shaderMaterial
          vertexShader={coreVertexShader}
          fragmentShader={coreFragmentShader}
          uniforms={uniforms}
          transparent
        />
      </mesh>
    </Float>
  );
}

function InstancedGalaxy({ isGenerating }: { isGenerating: boolean }) {
  const count = 1400;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const radius = 2.6 + Math.random() * 9.5;
      const theta = (i / count) * Math.PI * 16 + Math.random() * 0.8;
      const y = (Math.random() - 0.5) * 4.5;
      const speed = 0.12 + Math.random() * 0.35;
      const scale = 0.015 + Math.random() * 0.032;
      return { radius, theta, y, speed, scale };
    });
  }, []);

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const t = state.clock.getElapsedTime();
    const boost = isGenerating ? 3.2 : 1.0;

    for (let i = 0; i < count; i++) {
      const p = particles[i];
      const angle = p.theta + t * p.speed * 0.22 * boost;
      const r = isGenerating ? p.radius * (0.85 + 0.15 * Math.sin(t * 3 + i)) : p.radius;
      dummy.position.set(
        Math.cos(angle) * r,
        p.y + Math.sin(t * 0.6 + i) * 0.18,
        Math.sin(angle) * r
      );
      dummy.scale.setScalar(p.scale * (isGenerating ? 1.35 : 1.0));
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshBasicMaterial color="#38bdf8" transparent opacity={0.75} />
    </instancedMesh>
  );
}

function KnowledgeGraph({
  nodes,
  onSelectNode,
}: {
  nodes: GraphNode[];
  onSelectNode: (id: string, label: string) => void;
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const positioned = useMemo(() => {
    const safeNodes = nodes.slice(0, 8);
    return safeNodes.map((n, idx) => {
      const angle = (idx / Math.max(safeNodes.length, 1)) * Math.PI * 2;
      const radius = 3.2 + (idx % 2) * 0.75;
      const y = Math.sin(idx * 1.4) * 1.1;
      return {
        ...n,
        pos: [Math.cos(angle) * radius, y, Math.sin(angle) * radius] as [number, number, number],
      };
    });
  }, [nodes]);

  return (
    <group>
      {positioned.map((node, idx) => {
        const isHovered = hoveredId === node.id;
        const nextNode = positioned[(idx + 1) % positioned.length];
        return (
          <group key={node.id}>
            {/* Connection to AI Core */}
            <Line
              points={[[0, 0, 0], node.pos]}
              color={isHovered ? "#fbbf24" : "#22d3ee"}
              lineWidth={isHovered ? 1.8 : 0.8}
              transparent
              opacity={isHovered ? 0.85 : 0.28}
            />
            {/* Constellation Link to Next Course */}
            {positioned.length > 2 && nextNode && (
              <Line
                points={[node.pos, nextNode.pos]}
                color="#6366f1"
                lineWidth={0.6}
                transparent
                opacity={0.22}
              />
            )}

            <mesh
              position={node.pos}
              onClick={(e) => {
                e.stopPropagation();
                onSelectNode(node.id, node.label);
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                setHoveredId(node.id);
                document.body.style.cursor = "pointer";
              }}
              onPointerOut={() => {
                setHoveredId(null);
                document.body.style.cursor = "auto";
              }}
              scale={isHovered ? 1.45 : 1}
            >
              <sphereGeometry args={[0.2, 24, 24]} />
              <meshStandardMaterial
                color={isHovered ? "#fbbf24" : "#38bdf8"}
                emissive={isHovered ? "#f59e0b" : "#06b6d4"}
                emissiveIntensity={isHovered ? 2.4 : 1.3}
              />
              <Html distanceFactor={11} center style={{ pointerEvents: "none" }}>
                <div
                  className={`whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[10px] font-semibold backdrop-blur-md transition ${
                    isHovered
                      ? "border-amber-300/60 bg-amber-500/20 text-amber-200 scale-110"
                      : "border-cyan-400/30 bg-[#060913]/80 text-cyan-100"
                  }`}
                >
                  {node.label}
                </div>
              </Html>
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

export default function EdFlix3DScene({
  nodes,
  isGenerating,
  onSelectNode,
}: EdFlix3DSceneProps) {
  return (
    <div className="relative h-[420px] w-full overflow-hidden rounded-[28px] border border-cyan-400/20 bg-[#040711] shadow-[0_25px_80px_rgba(0,0,0,0.7)]">
      <div className="pointer-events-none absolute left-4 top-4 z-10 flex items-center gap-2 rounded-full border border-cyan-400/25 bg-[#060913]/80 px-3 py-1 text-[11px] font-semibold text-cyan-300 backdrop-blur-md">
        <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-400" />
        {isGenerating ? "AI Core Synthesizing Roadmap..." : "3D Knowledge Galaxy · Drag to Orbit · Click a Node"}
      </div>

      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 2.2, 7.2], fov: 46 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
      >
        <color attach="background" args={["#040711"]} />
        <ambientLight intensity={0.4} />
        <pointLight position={[5, 5, 5]} intensity={1.2} color="#38bdf8" />
        <pointLight position={[-5, -3, -5]} intensity={0.8} color="#818cf8" />

        <AICoreOrb isGenerating={isGenerating} />
        <InstancedGalaxy isGenerating={isGenerating} />
        <KnowledgeGraph nodes={nodes} onSelectNode={onSelectNode} />

        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={4.2}
          maxDistance={11}
          autoRotate
          autoRotateSpeed={isGenerating ? 2.4 : 0.55}
        />

        <EffectComposer>
          <Bloom mipmapBlur luminanceThreshold={0.55} intensity={1.1} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}