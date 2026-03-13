import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { NameTag } from '../components/NameTag';

interface PlayerModelProps {
  position: [number, number, number];
  yaw: number;
  pitch: number;
  skinColor: string;
  name: string;
  skinUrl?: string;
}

function createMinecraftUVs(u: number, v: number, w: number, h: number, d: number, texW = 64, texH = 64) {
  const uvs = new Float32Array(48);
  
  const setFaceUVs = (faceIdx: number, x: number, y: number, width: number, height: number) => {
    const x1 = x / texW;
    const x2 = (x + width) / texW;
    const y1 = 1 - (y + height) / texH;
    const y2 = 1 - y / texH;
    
    const offset = faceIdx * 8;
    uvs[offset] = x1; uvs[offset + 1] = y2;
    uvs[offset + 2] = x2; uvs[offset + 3] = y2;
    uvs[offset + 4] = x1; uvs[offset + 5] = y1;
    uvs[offset + 6] = x2; uvs[offset + 7] = y1;
  };

  // Order in Three.js BoxGeometry: Right, Left, Top, Bottom, Front, Back
  setFaceUVs(0, u + d + w, v + d, d, h); // Right
  setFaceUVs(1, u, v + d, d, h);         // Left
  setFaceUVs(2, u + d, v, w, d);         // Top
  setFaceUVs(3, u + d + w, v, w, d);     // Bottom
  setFaceUVs(4, u + d, v + d, w, h);     // Front
  setFaceUVs(5, u + d + w + d, v + d, w, h); // Back
  
  return uvs;
}

function MinecraftPart({ args, uvPos, texture, color, position, rotation, partRef, isOuter = false }: any) {
  const geometry = useMemo(() => {
    const s = isOuter ? 1.05 : 1;
    const geo = new THREE.BoxGeometry(args[0] * s, args[1] * s, args[2] * s);
    const [u, v] = uvPos;
    
    const uvs = createMinecraftUVs(u, v, args[0] * 16, args[1] * 16, args[2] * 16);
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    return geo;
  }, [args, uvPos, isOuter]);

  return (
    <group position={position} rotation={rotation} ref={isOuter ? null : partRef}>
      <mesh geometry={geometry} castShadow position={[0, -args[1]/2, 0]}>
        {texture ? <meshLambertMaterial map={texture} transparent alphaTest={0.5} side={isOuter ? THREE.DoubleSide : THREE.FrontSide} /> : <meshLambertMaterial color={color} />}
      </mesh>
    </group>
  );
}

export function PlayerModel({ position, yaw, pitch, skinColor, name, skinUrl }: PlayerModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Mesh>(null);

  const prevPos = useRef(new THREE.Vector3(...position));
  const walkTime = useRef(0);
  const isFirstFrame = useRef(true);

  const skinTexture = useMemo(() => {
    if (!skinUrl) return null;
    const loader = new THREE.TextureLoader();
    const tex = loader.load(skinUrl);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    return tex;
  }, [skinUrl]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const targetPos = new THREE.Vector3(...position);
    if (isFirstFrame.current) {
      groupRef.current.position.copy(targetPos);
      isFirstFrame.current = false;
    }
    groupRef.current.position.lerp(targetPos, 0.2);
    const targetQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, 0));
    groupRef.current.quaternion.slerp(targetQuat, 0.2);
    if (headRef.current) headRef.current.rotation.x = pitch;

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
      <MinecraftPart 
        partRef={headRef}
        args={[0.5, 0.5, 0.5]} 
        uvPos={[0, 0]} 
        texture={skinTexture} 
        color={skinColor} 
        position={[0, 1.5, 0]} 
      />
      <MinecraftPart 
        args={[0.5, 0.5, 0.5]} 
        uvPos={[32, 0]} 
        texture={skinTexture} 
        color={skinColor} 
        position={[0, 1.5, 0]} 
        isOuter
      />

      {/* Body */}
      <MinecraftPart 
        args={[0.5, 0.75, 0.25]} 
        uvPos={[16, 16]} 
        texture={skinTexture} 
        color={skinColor} 
        position={[0, 1.5, 0]} 
      />
      <MinecraftPart 
        args={[0.5, 0.75, 0.25]} 
        uvPos={[16, 32]} 
        texture={skinTexture} 
        color={skinColor} 
        position={[0, 1.5, 0]} 
        isOuter
      />

      {/* Left Arm */}
      <MinecraftPart 
        partRef={leftArmRef}
        args={[0.25, 0.75, 0.25]} 
        uvPos={[32, 48]} 
        texture={skinTexture} 
        color={skinColor} 
        position={[0.375, 1.5, 0]} 
      />
      <MinecraftPart 
        args={[0.25, 0.75, 0.25]} 
        uvPos={[48, 48]} 
        texture={skinTexture} 
        color={skinColor} 
        position={[0.375, 1.5, 0]} 
        isOuter
      />

      {/* Right Arm */}
      <MinecraftPart 
        partRef={rightArmRef}
        args={[0.25, 0.75, 0.25]} 
        uvPos={[40, 16]} 
        texture={skinTexture} 
        color={skinColor} 
        position={[-0.375, 1.5, 0]} 
      />
      <MinecraftPart 
        args={[0.25, 0.75, 0.25]} 
        uvPos={[40, 32]} 
        texture={skinTexture} 
        color={skinColor} 
        position={[-0.375, 1.5, 0]} 
        isOuter
      />

      {/* Left Leg */}
      <MinecraftPart 
        partRef={leftLegRef}
        args={[0.25, 0.75, 0.25]} 
        uvPos={[16, 48]} 
        texture={skinTexture} 
        color={skinColor} 
        position={[0.125, 0.75, 0]} 
      />
      <MinecraftPart 
        args={[0.25, 0.75, 0.25]} 
        uvPos={[0, 48]} 
        texture={skinTexture} 
        color={skinColor} 
        position={[0.125, 0.75, 0]} 
        isOuter
      />

      {/* Right Leg */}
      <MinecraftPart 
        partRef={rightLegRef}
        args={[0.25, 0.75, 0.25]} 
        uvPos={[0, 16]} 
        texture={skinTexture} 
        color={skinColor} 
        position={[-0.125, 0.75, 0]} 
      />
      <MinecraftPart 
        args={[0.25, 0.75, 0.25]} 
        uvPos={[0, 32]} 
        texture={skinTexture} 
        color={skinColor} 
        position={[-0.125, 0.75, 0]} 
        isOuter
      />
    </group>
  );
}
