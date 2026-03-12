import { useEffect, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { buildChunkMesh } from './ChunkMesh';
import { world } from './WorldManager';
import { materialOpaque, materialTransparent } from './textures';
import { inputState } from './inputState';
import * as THREE from 'three';

function Chunk({ cx, cz }: { cx: number, cz: number }) {
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);

  useEffect(() => {
    let isMounted = true;

    const generate = async () => {
      // Yield to main thread to prevent freezing
      await new Promise(resolve => setTimeout(resolve, 0));
      if (!isMounted) return;
      
      world.getOrGenerateChunk(cx, cz);
      const geo = buildChunkMesh(cx, cz);
      
      if (isMounted) {
        setGeometry(geo);
      }
    };

    generate();

    const onRoomChange = () => {
      generate();
    };
    world.roomChangeCallbacks.add(onRoomChange);
    
    let updateTimeout: any = null;
    const onUpdate = (ucx: number, ucz: number) => {
      if (ucx === cx && ucz === cz) {
        if (updateTimeout) clearTimeout(updateTimeout);
        updateTimeout = setTimeout(() => {
          generate();
        }, 50);
      }
    };
    const onTexturePackLoaded = () => {
      generate();
    };
    inputState.chunkUpdateCallbacks.add(onUpdate);
    window.addEventListener('texture-pack-loaded', onTexturePackLoaded);
    return () => {
      isMounted = false;
      if (updateTimeout) clearTimeout(updateTimeout);
      world.roomChangeCallbacks.delete(onRoomChange);
      inputState.chunkUpdateCallbacks.delete(onUpdate);
      window.removeEventListener('texture-pack-loaded', onTexturePackLoaded);
    };
  }, [cx, cz]);

  if (!geometry) return null;

  return (
    <mesh geometry={geometry} material={[materialOpaque, materialTransparent]} />
  );
}

export function WorldRenderer() {
  const { camera } = useThree();
  const [chunks, setChunks] = useState<{cx: number, cz: number}[]>([]);
  const [, setRoomId] = useState(world.roomId);
  const [rd, setRd] = useState(world.renderDistance);

  useEffect(() => {
    const onRoomChange = () => setRoomId(world.roomId);
    world.roomChangeCallbacks.add(onRoomChange);
    
    // Check for render distance changes
    const rdInterval = setInterval(() => {
      if (world.renderDistance !== rd) {
        setRd(world.renderDistance);
      }
    }, 1000);

    return () => {
      world.roomChangeCallbacks.delete(onRoomChange);
      clearInterval(rdInterval);
    };
  }, [rd]);

  useEffect(() => {
    const interval = setInterval(() => {
      const cx = Math.floor(camera.position.x / 16);
      const cz = Math.floor(camera.position.z / 16);
      
      const newChunks = [];
      for (let x = -rd; x <= rd; x++) {
        for (let z = -rd; z <= rd; z++) {
          newChunks.push({ cx: cx + x, cz: cz + z, dist: x*x + z*z });
        }
      }
      
      newChunks.sort((a, b) => a.dist - b.dist);
      
      setChunks(prev => {
        if (prev.length !== newChunks.length) return newChunks;
        for (let i = 0; i < prev.length; i++) {
          if (prev[i].cx !== newChunks[i].cx || prev[i].cz !== newChunks[i].cz) {
            return newChunks;
          }
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [camera, rd]);

  return (
    <>
      {chunks.map(c => (
        <Chunk key={`${c.cx},${c.cz}`} cx={c.cx} cz={c.cz} />
      ))}
    </>
  );
}
