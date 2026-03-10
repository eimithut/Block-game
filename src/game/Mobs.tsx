import { useFrame } from '@react-three/fiber';
import { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { world, MobData } from './WorldManager';
import { BLOCKS, isWater, isLava } from './textures';

function MobEntity({ data }: { data: MobData }) {
  const group = useRef<THREE.Group>(null);
  const velocity = useRef(new THREE.Vector3(0, 0, 0));
  const direction = useRef(Math.random() * Math.PI * 2);
  const state = useRef<'idle' | 'walking'>('idle');
  const stateTimer = useRef(0);

  useFrame((_, delta) => {
    if (!group.current) return;
    
    stateTimer.current -= delta;
    if (stateTimer.current <= 0) {
      if (state.current === 'idle') {
        state.current = 'walking';
        direction.current = Math.random() * Math.PI * 2;
        stateTimer.current = 2 + Math.random() * 3;
      } else {
        state.current = 'idle';
        stateTimer.current = 1 + Math.random() * 4;
      }
    }

    velocity.current.y -= 30 * delta; // Gravity

    if (state.current === 'walking') {
      velocity.current.x = Math.sin(direction.current) * 2;
      velocity.current.z = Math.cos(direction.current) * 2;
      
      // Simple instant rotation for now
      group.current.rotation.y = Math.atan2(velocity.current.x, velocity.current.z);
    } else {
      velocity.current.x = 0;
      velocity.current.z = 0;
    }

    const pos = group.current.position;
    const nextPos = pos.clone();
    
    // Y collision
    nextPos.y += velocity.current.y * delta;
    const blockY = world.getBlock(Math.floor(nextPos.x), Math.floor(nextPos.y), Math.floor(nextPos.z));
    if (blockY !== 0 && !isWater(blockY) && !isLava(blockY)) {
      velocity.current.y = 0;
      nextPos.y = Math.floor(nextPos.y) + 1;
      
      // Jump if walking into a block
      if (state.current === 'walking' && Math.random() < 0.05) {
        velocity.current.y = 6;
      }
    }

    // X collision
    nextPos.x += velocity.current.x * delta;
    const blockX = world.getBlock(Math.floor(nextPos.x), Math.floor(pos.y), Math.floor(pos.z));
    if (blockX !== 0 && !isWater(blockX) && !isLava(blockX)) {
      nextPos.x = pos.x;
      direction.current = Math.random() * Math.PI * 2;
    }

    // Z collision
    nextPos.z += velocity.current.z * delta;
    const blockZ = world.getBlock(Math.floor(pos.x), Math.floor(pos.y), Math.floor(nextPos.z));
    if (blockZ !== 0 && !isWater(blockZ) && !isLava(blockZ)) {
      nextPos.z = pos.z;
      direction.current = Math.random() * Math.PI * 2;
    }

    group.current.position.copy(nextPos);
  });

  const isCow = data.type === 'cow';
  const color = isCow ? '#8B4513' : '#FFFFFF';
  const size = isCow ? [0.8, 1.2, 1.5] : [0.6, 0.9, 1.2];

  return (
    <group ref={group} position={[data.x, data.y, data.z]}>
      <mesh castShadow position={[0, size[1]/2, 0]}>
        <boxGeometry args={size as any} />
        <meshLambertMaterial color={color} />
      </mesh>
      <mesh castShadow position={[0, size[1], size[2]/2]}>
        <boxGeometry args={[size[0]*0.8, size[0]*0.8, size[0]*0.8]} />
        <meshLambertMaterial color={isCow ? '#5C4033' : '#E0E0E0'} />
      </mesh>
    </group>
  );
}

export function Mobs() {
  const [mobs, setMobs] = useState<MobData[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setMobs([...world.mobs]);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {mobs.map(m => <MobEntity key={m.id} data={m} />)}
    </>
  );
}
