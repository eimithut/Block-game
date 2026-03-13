import { BLOCKS } from './textures';

export const inputState = {
  showInventory: false,
  _paused: false,
  get paused() { return this._paused; },
  set paused(val: boolean) {
    this._paused = val;
    this.pauseCallbacks.forEach(cb => cb(val));
  },
  pauseCallbacks: new Set<(val: boolean) => void>(),
  chatting: false,
  forward: 0,
  right: 0,
  lookX: 0,
  lookY: 0,
  jump: false,
  actionPlace: false,
  actionBreak: false,
  playerName: 'Player',
  playerSkin: '', // URL or base64
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
