import { useEffect, useState } from 'react';
import { useThree } from '@react-three/fiber';
import { buildChunkMesh } from './ChunkMesh';
import { world } from './WorldManager';
import { materialOpaque, materialTransparent } from './textures';
import { inputState } from './inputState';

const RENDER_DISTANCE = 2;

function Chunk({ cx, cz }: { cx: number, cz: number }) {
  const [geometry, setGeometry] = useState(() => {
    world.getOrGenerateChunk(cx, cz);
    return buildChunkMesh(cx, cz);
  });

  useEffect(() => {
    const onRoomChange = () => {
      world.getOrGenerateChunk(cx, cz);
      setGeometry(buildChunkMesh(cx, cz));
    };
    world.roomChangeCallbacks.add(onRoomChange);
    
    const onUpdate = (ucx: number, ucz: number) => {
      if (ucx === cx && ucz === cz) {
        setGeometry(buildChunkMesh(cx, cz));
      }
    };
    const onTexturePackLoaded = () => {
      setGeometry(buildChunkMesh(cx, cz));
    };
    inputState.chunkUpdateCallbacks.add(onUpdate);
    window.addEventListener('texture-pack-loaded', onTexturePackLoaded);
    return () => {
      world.roomChangeCallbacks.delete(onRoomChange);
      inputState.chunkUpdateCallbacks.delete(onUpdate);
      window.removeEventListener('texture-pack-loaded', onTexturePackLoaded);
    };
  }, [cx, cz]);

  return (
    <mesh geometry={geometry} material={[materialOpaque, materialTransparent]} />
  );
}

export function WorldRenderer() {
  const { camera } = useThree();
  const [chunks, setChunks] = useState<{cx: number, cz: number}[]>([]);
  const [, setRoomId] = useState(world.roomId);

  useEffect(() => {
    const onRoomChange = () => setRoomId(world.roomId);
    world.roomChangeCallbacks.add(onRoomChange);
    return () => world.roomChangeCallbacks.delete(onRoomChange);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const cx = Math.floor(camera.position.x / 16);
      const cz = Math.floor(camera.position.z / 16);
      
      const newChunks = [];
      for (let x = -RENDER_DISTANCE; x <= RENDER_DISTANCE; x++) {
        for (let z = -RENDER_DISTANCE; z <= RENDER_DISTANCE; z++) {
          newChunks.push({ cx: cx + x, cz: cz + z });
        }
      }
      
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
  }, [camera]);

  return (
    <>
      {chunks.map(c => (
        <Chunk key={`${c.cx},${c.cz}`} cx={c.cx} cz={c.cz} />
      ))}
    </>
  );
}
