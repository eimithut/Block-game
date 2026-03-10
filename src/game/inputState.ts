import { BLOCKS } from './textures';

export const inputState = {
  showInventory: false,
  forward: 0,
  right: 0,
  lookX: 0,
  lookY: 0,
  jump: false,
  actionPlace: false,
  actionBreak: false,
  selectedBlock: BLOCKS.GRASS_BLOCK, // Default grass
  chunkUpdateCallbacks: new Set<(cx: number, cz: number) => void>(),
  triggerChunkUpdate(x: number, z: number) {
    const cx = Math.floor(x / 16);
    const cz = Math.floor(z / 16);
    this.chunkUpdateCallbacks.forEach(cb => cb(cx, cz));
    // Also trigger neighbors if on edge
    const lx = x - cx * 16;
    const lz = z - cz * 16;
    if (lx === 0) this.chunkUpdateCallbacks.forEach(cb => cb(cx - 1, cz));
    if (lx === 15) this.chunkUpdateCallbacks.forEach(cb => cb(cx + 1, cz));
    if (lz === 0) this.chunkUpdateCallbacks.forEach(cb => cb(cx, cz - 1));
    if (lz === 15) this.chunkUpdateCallbacks.forEach(cb => cb(cx, cz + 1));
  }
};
