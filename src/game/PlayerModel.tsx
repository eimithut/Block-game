import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { NameTag } from '../components/NameTag';

interface PlayerModelProps {
  position: [number, number, number];
  yaw: number;
  pitch: number;
  skinColor: string;
  name: string;
}

export function PlayerModel({ position, yaw, pitch, skinColor, name }: PlayerModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Mesh>(null);

  const prevPos = useRef(new THREE.Vector3(...position));
  const walkTime = useRef(0);
  const isFirstFrame = useRef(true);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const targetPos = new THREE.Vector3(...position);
    
    if (isFirstFrame.current) {
      groupRef.current.position.copy(targetPos);
      isFirstFrame.current = false;
    }

    // Smooth position interpolation
    groupRef.current.position.lerp(targetPos, 0.2);

    // Smooth rotation interpolation
    const targetQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, 0));
    groupRef.current.quaternion.slerp(targetQuat, 0.2);

    if (headRef.current) {
      headRef.current.rotation.x = pitch;
    }

    // Calculate movement speed for animation
    const currentPos = groupRef.current.position.clone();
    const dist = prevPos.current.distanceTo(currentPos);
    const speed = dist / delta;
    prevPos.current.copy(currentPos);

    if (speed > 0.1) {
      walkTime.current += delta * 10;
      const swing = Math.sin(walkTime.current) * 0.5;
      if (leftArmRef.current) leftArmRef.current.rotation.x = swing;
      if (rightArmRef.current) rightArmRef.current.rotation.x = -swing;
      if (leftLegRef.current) leftLegRef.current.rotation.x = -swing;
      if (rightLegRef.current) rightLegRef.current.rotation.x = swing;
    } else {
      // Return to idle
      walkTime.current = 0;
      if (leftArmRef.current) leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, 0, 0.1);
      if (rightArmRef.current) rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, 0, 0.1);
      if (leftLegRef.current) leftLegRef.current.rotation.x = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, 0, 0.1);
      if (rightLegRef.current) rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, 0, 0.1);
    }
  });

  return (
    <group ref={groupRef}>
      <NameTag name={name} />

      {/* Head */}
      <mesh ref={headRef} position={[0, 1.5, 0]} castShadow>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshLambertMaterial color={skinColor} />
      </mesh>

      {/* Body */}
      <mesh position={[0, 0.9, 0]} castShadow>
        <boxGeometry args={[0.5, 0.7, 0.25]} />
        <meshLambertMaterial color={skinColor} />
      </mesh>

      {/* Left Arm */}
      <group ref={leftArmRef} position={[0.35, 1.25, 0]}>
        <mesh position={[0, -0.35, 0]} castShadow>
          <boxGeometry args={[0.2, 0.7, 0.2]} />
          <meshLambertMaterial color={skinColor} />
        </mesh>
      </group>

      {/* Right Arm */}
      <group ref={rightArmRef} position={[-0.35, 1.25, 0]}>
        <mesh position={[0, -0.35, 0]} castShadow>
          <boxGeometry args={[0.2, 0.7, 0.2]} />
          <meshLambertMaterial color={skinColor} />
        </mesh>
      </group>

      {/* Left Leg */}
      <group ref={leftLegRef} position={[0.15, 0.7, 0]}>
        <mesh position={[0, -0.35, 0]} castShadow>
          <boxGeometry args={[0.2, 0.7, 0.2]} />
          <meshLambertMaterial color={skinColor} />
        </mesh>
      </group>

      {/* Right Leg */}
      <group ref={rightLegRef} position={[-0.15, 0.7, 0]}>
        <mesh position={[0, -0.35, 0]} castShadow>
          <boxGeometry args={[0.2, 0.7, 0.2]} />
          <meshLambertMaterial color={skinColor} />
        </mesh>
      </group>
    </group>
  );
}
