import { useFrame } from '@react-three/fiber';
import { Sky } from '@react-three/drei';
import { useState, useRef } from 'react';
import * as THREE from 'three';

export function DayNightCycle() {
  const [time, setTime] = useState(0);

  useFrame((state, delta) => {
    // 24000 ticks per day, let's say a day is 10 minutes (600 seconds)
    // 24000 / 600 = 40 ticks per second
    setTime((prev) => (prev + delta * 400) % 24000);
  });

  const theta = (time / 24000) * Math.PI * 2 - Math.PI / 2;
  const sunX = Math.cos(theta) * 100;
  const sunY = Math.sin(theta) * 100;
  const sunZ = 0;

  const intensity = Math.max(0, Math.sin(theta));
  const ambientIntensity = Math.max(0.1, Math.sin(theta) * 0.5 + 0.1);

  return (
    <>
      <Sky sunPosition={[sunX, sunY, sunZ]} />
      <ambientLight intensity={ambientIntensity} />
      <directionalLight position={[sunX, sunY, sunZ]} intensity={intensity * 1.5} />
    </>
  );
}
