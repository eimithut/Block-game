import { useRef, useMemo, useState, useEffect } from 'react';
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
  frozen?: boolean;
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
  setFaceUVs(0, u, v + d, d, h);         // Right (Standard Minecraft: Right is at u)
  setFaceUVs(1, u + d + w, v + d, d, h); // Left (Standard Minecraft: Left is at u + d + w)
  setFaceUVs(2, u + d, v, w, d);         // Top
  setFaceUVs(3, u + d + w, v, w, d);     // Bottom
  setFaceUVs(4, u + d, v + d, w, h);     // Front
  setFaceUVs(5, u + d + w + d, v + d, w, h); // Back
  
  return uvs;
}

function MinecraftPart({ args, uvPos, texture, color, position, rotation, partRef, isOuter = false, texH = 64, pivot = 'top' }: any) {
  const geometry = useMemo(() => {
    const s = isOuter ? 1.05 : 1;
    const geo = new THREE.BoxGeometry(args[0] * s, args[1] * s, args[2] * s);
    const [u, v] = uvPos;
    
    const uvs = createMinecraftUVs(u, v, args[0] * 16, args[1] * 16, args[2] * 16, 64, texH);
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    return geo;
  }, [args, uvPos, isOuter, texH]);

  return (
    <group position={position} rotation={rotation} ref={isOuter ? null : partRef}>
      <mesh geometry={geometry} castShadow position={[0, pivot === 'top' ? -args[1]/2 : args[1]/2, 0]}>
        <meshStandardMaterial 
          map={texture || null} 
          color={texture ? 'white' : color}
          transparent 
          alphaTest={0.5} 
          side={isOuter ? THREE.DoubleSide : THREE.FrontSide}
          roughness={1}
          metalness={0}
        />
      </mesh>
    </group>
  );
}

export function PlayerModel({ position, yaw, pitch, skinColor, name, skinUrl, frozen = false }: PlayerModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Mesh>(null);

  const prevPos = useRef(new THREE.Vector3(...position));
  const walkTime = useRef(0);
  const isFirstFrame = useRef(true);

  const [skinTexture, setSkinTexture] = useState<THREE.Texture | null>(null);
  const [isLegacy, setIsLegacy] = useState(false);

  useEffect(() => {
    if (!skinUrl) {
      setSkinTexture(null);
      setIsLegacy(false);
      return;
    }
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    loader.load(
      skinUrl,
      (tex) => {
        tex.magFilter = THREE.NearestFilter;
        tex.minFilter = THREE.NearestFilter;
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.needsUpdate = true;
        
        // Detect legacy 64x32 skins
        const legacy = tex.image.height === tex.image.width / 2;
        setIsLegacy(legacy);
        
        setSkinTexture(tex);
      },
      undefined,
      (err) => {
        console.error('Error loading skin texture:', err);
        setSkinTexture(null);
        setIsLegacy(false);
      }
    );
  }, [skinUrl]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const targetPos = new THREE.Vector3(...position);
    
    if (frozen) {
      groupRef.current.position.copy(targetPos);
      groupRef.current.rotation.set(0, yaw, 0);
      if (headRef.current) headRef.current.rotation.x = -pitch;
      
      // Reset limb rotations
      if (leftArmRef.current) leftArmRef.current.rotation.x = 0;
      if (rightArmRef.current) rightArmRef.current.rotation.x = 0;
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
      return;
    }

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
        texH={isLegacy ? 32 : 64}
        pivot="bottom"
      />
      <MinecraftPart 
        args={[0.5, 0.5, 0.5]} 
        uvPos={[32, 0]} 
        texture={skinTexture} 
        color={skinColor} 
        position={[0, 1.5, 0]} 
        isOuter
        texH={isLegacy ? 32 : 64}
        pivot="bottom"
      />

      {/* Body */}
      <MinecraftPart 
        args={[0.5, 0.75, 0.25]} 
        uvPos={[16, 16]} 
        texture={skinTexture} 
        color={skinColor} 
        position={[0, 1.5, 0]} 
        texH={isLegacy ? 32 : 64}
      />
      {!isLegacy && (
        <MinecraftPart 
          args={[0.5, 0.75, 0.25]} 
          uvPos={[16, 32]} 
          texture={skinTexture} 
          color={skinColor} 
          position={[0, 1.5, 0]} 
          isOuter
          texH={64}
        />
      )}

      {/* Left Arm */}
      <MinecraftPart 
        partRef={leftArmRef}
        args={[0.25, 0.75, 0.25]} 
        uvPos={isLegacy ? [40, 16] : [32, 48]} 
        texture={skinTexture} 
        color={skinColor} 
        position={[0.375, 1.5, 0]} 
        texH={isLegacy ? 32 : 64}
      />
      {!isLegacy && (
        <MinecraftPart 
          args={[0.25, 0.75, 0.25]} 
          uvPos={[48, 48]} 
          texture={skinTexture} 
          color={skinColor} 
          position={[0.375, 1.5, 0]} 
          isOuter
          texH={64}
        />
      )}

      {/* Right Arm */}
      <MinecraftPart 
        partRef={rightArmRef}
        args={[0.25, 0.75, 0.25]} 
        uvPos={[40, 16]} 
        texture={skinTexture} 
        color={skinColor} 
        position={[-0.375, 1.5, 0]} 
        texH={isLegacy ? 32 : 64}
      />
      {!isLegacy && (
        <MinecraftPart 
          args={[0.25, 0.75, 0.25]} 
          uvPos={[40, 32]} 
          texture={skinTexture} 
          color={skinColor} 
          position={[-0.375, 1.5, 0]} 
          isOuter
          texH={64}
        />
      )}

      {/* Left Leg */}
      <MinecraftPart 
        partRef={leftLegRef}
        args={[0.25, 0.75, 0.25]} 
        uvPos={isLegacy ? [0, 16] : [16, 48]} 
        texture={skinTexture} 
        color={skinColor} 
        position={[0.125, 0.75, 0]} 
        texH={isLegacy ? 32 : 64}
      />
      {!isLegacy && (
        <MinecraftPart 
          args={[0.25, 0.75, 0.25]} 
          uvPos={[0, 48]} 
          texture={skinTexture} 
          color={skinColor} 
          position={[0.125, 0.75, 0]} 
          isOuter
          texH={64}
        />
      )}

      {/* Right Leg */}
      <MinecraftPart 
        partRef={rightLegRef}
        args={[0.25, 0.75, 0.25]} 
        uvPos={[0, 16]} 
        texture={skinTexture} 
        color={skinColor} 
        position={[-0.125, 0.75, 0]} 
        texH={isLegacy ? 32 : 64}
      />
      {!isLegacy && (
        <MinecraftPart 
          args={[0.25, 0.75, 0.25]} 
          uvPos={[0, 32]} 
          texture={skinTexture} 
          color={skinColor} 
          position={[-0.125, 0.75, 0]} 
          isOuter
          texH={64}
        />
      )}
    </group>
  );
}
