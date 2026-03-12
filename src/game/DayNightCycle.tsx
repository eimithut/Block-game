import { useFrame } from '@react-three/fiber';
import { Sky } from '@react-three/drei';
import { useRef } from 'react';
import * as THREE from 'three';

export function DayNightCycle() {
  const time = useRef(12000); // Start at noon (12000 ticks)
  const skyRef = useRef<any>(null);
  const ambientLightRef = useRef<THREE.AmbientLight>(null);
  const dirLightRef = useRef<THREE.DirectionalLight>(null);

  useFrame((state, delta) => {
    // Slower cycle: 50 ticks per second = 480 seconds (8 minutes) per day
    time.current = (time.current + delta * 50) % 24000;
    
    const theta = (time.current / 24000) * Math.PI * 2 - Math.PI / 2;
    const sunX = Math.cos(theta) * 100;
    const sunY = Math.sin(theta) * 100;
    const sunZ = 0;

    const intensity = Math.max(0, Math.sin(theta));
    const ambientIntensity = Math.max(0.1, Math.sin(theta) * 0.5 + 0.1);

    if (skyRef.current) {
      skyRef.current.material.uniforms.sunPosition.value.set(sunX, sunY, sunZ);
    }
    if (ambientLightRef.current) {
      ambientLightRef.current.intensity = ambientIntensity;
    }
    if (dirLightRef.current) {
      dirLightRef.current.position.set(sunX, sunY, sunZ);
      dirLightRef.current.intensity = intensity * 1.5;
    }
  });

  return (
    <>
      <Sky ref={skyRef} />
      <ambientLight ref={ambientLightRef} />
      <directionalLight ref={dirLightRef} />
    </>
  );
}
