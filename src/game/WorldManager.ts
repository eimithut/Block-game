import { createNoise2D } from 'simplex-noise';
import { inputState } from './inputState';
import { BLOCKS, BLOCK_FACES, isWater, isLava } from './textures';

const noise2D = createNoise2D();

export const CHUNK_SIZE = 16;
export const WORLD_HEIGHT = 64;
export const WATER_LEVEL = 24;

export type MobData = { id: string, type: 'cow' | 'sheep', x: number, y: number, z: number };

export class WorldManager {
  chunks: Map<string, Uint16Array> = new Map();
  mobs: MobData[] = [];
  fluidQueue: Set<string> = new Set();
  fluidInterval: any;
  worldType: 'normal' | 'debug' = 'normal';
  roomId: string | null = null;
  roomChangeCallbacks: Set<() => void> = new Set();

  constructor() {
    this.fluidInterval = setInterval(() => this.updateFluids(), 200);
  }

  setRoom(roomId: string | null) {
    this.roomId = roomId;
    this.chunks.clear();
    this.roomChangeCallbacks.forEach(cb => cb());
  }

  scheduleFluidUpdate(x: number, y: number, z: number) {
    this.fluidQueue.add(`${x},${y},${z}`);
  }

  getChunkKey(cx: number, cz: number) {
    return `${cx},${cz}`;
  }

  getOrGenerateChunk(cx: number, cz: number) {
    const key = this.getChunkKey(cx, cz);
    if (!this.chunks.has(key)) {
      this.generateChunk(cx, cz);
    }
    return this.chunks.get(key)!;
  }

  generateChunk(cx: number, cz: number) {
    const chunk = new Uint16Array(CHUNK_SIZE * WORLD_HEIGHT * CHUNK_SIZE);
    
    if (this.worldType === 'debug') {
      const allIds = Object.keys(BLOCK_FACES).map(Number).filter(id => id > 0);
      
      for (let x = 0; x < CHUNK_SIZE; x++) {
        for (let z = 0; z < CHUNK_SIZE; z++) {
          const wx = cx * CHUNK_SIZE + x;
          const wz = cz * CHUNK_SIZE + z;
          
          chunk[x + 0 * CHUNK_SIZE + z * CHUNK_SIZE * WORLD_HEIGHT] = BLOCKS.BEDROCK;
          
          if (x % 2 === 0 && z % 2 === 0) {
            const index = Math.abs(Math.floor(wx / 2) + Math.floor(wz / 2) * 50) % allIds.length;
            chunk[x + 1 * CHUNK_SIZE + z * CHUNK_SIZE * WORLD_HEIGHT] = allIds[index];
          }
        }
      }
      this.chunks.set(this.getChunkKey(cx, cz), chunk);
      return chunk;
    }

    for (let x = 0; x < CHUNK_SIZE; x++) {
      for (let z = 0; z < CHUNK_SIZE; z++) {
        const wx = cx * CHUNK_SIZE + x;
        const wz = cz * CHUNK_SIZE + z;
        
        const height = Math.floor((noise2D(wx * 0.02, wz * 0.02) + 1) * 10) + 20;
        const isLavaPool = noise2D(wx * 0.05, wz * 0.05) > 0.75;
        
        for (let y = 0; y < WORLD_HEIGHT; y++) {
          const index = x + y * CHUNK_SIZE + z * CHUNK_SIZE * WORLD_HEIGHT;
          
          if (y === 0) {
            chunk[index] = BLOCKS.BEDROCK;
          } else if (isLavaPool && y <= height && y > height - 3) {
            chunk[index] = y === height ? 0 : BLOCKS.LAVA; // Lava pool, air above
            if (chunk[index] === BLOCKS.LAVA) this.scheduleFluidUpdate(wx, y, wz);
          } else if (y < height - 1) {
            const isDeepslate = y < 10 + noise2D(wx * 0.1, wz * 0.1) * 2;
            let block = isDeepslate ? BLOCKS.DEEPSLATE : BLOCKS.STONE;
            
            // Deterministic ores
            const oreNoise = (noise2D(wx * 0.345, y * 0.678 + wz * 0.345) + 1) / 2;
            if (oreNoise < 0.005) block = isDeepslate ? BLOCKS.DEEPSLATE_DIAMOND_ORE : BLOCKS.DIAMOND_ORE;
            else if (oreNoise < 0.01) block = isDeepslate ? BLOCKS.DEEPSLATE_GOLD_ORE : BLOCKS.GOLD_ORE;
            else if (oreNoise < 0.02) block = isDeepslate ? BLOCKS.DEEPSLATE_EMERALD_ORE : BLOCKS.EMERALD_ORE;
            else if (oreNoise < 0.04) block = isDeepslate ? BLOCKS.DEEPSLATE_IRON_ORE : BLOCKS.IRON_ORE;
            else if (oreNoise < 0.06) block = isDeepslate ? BLOCKS.DEEPSLATE_COAL_ORE : BLOCKS.COAL_ORE;
            else if (oreNoise < 0.07) block = isDeepslate ? BLOCKS.DEEPSLATE_COPPER_ORE : BLOCKS.COPPER_ORE;
            else if (oreNoise < 0.08) block = isDeepslate ? BLOCKS.DEEPSLATE_REDSTONE_ORE : BLOCKS.REDSTONE_ORE;
            else if (oreNoise < 0.085) block = isDeepslate ? BLOCKS.DEEPSLATE_LAPIS_LAZULI_ORE : BLOCKS.LAPIS_ORE;
            else if (oreNoise < 0.12) block = BLOCKS.GRAVEL;
            else if (!isDeepslate && oreNoise < 0.16) block = BLOCKS.ANDESITE;
            else if (!isDeepslate && oreNoise < 0.20) block = BLOCKS.DIORITE;
            else if (!isDeepslate && oreNoise < 0.24) block = BLOCKS.GRANITE;
            else if (isDeepslate && oreNoise < 0.16) block = BLOCKS.TUFF;
            
            chunk[index] = block;
          } else if (y === height - 1) {
            chunk[index] = height <= WATER_LEVEL + 1 ? BLOCKS.SAND : BLOCKS.DIRT; // Sand or Dirt
          } else if (y === height) {
            chunk[index] = height <= WATER_LEVEL + 1 ? BLOCKS.SAND : BLOCKS.GRASS_BLOCK; // Sand or Grass
          } else if (y <= WATER_LEVEL) {
            chunk[index] = BLOCKS.WATER; // Water
            this.scheduleFluidUpdate(wx, y, wz);
          } else {
            chunk[index] = 0; // Air
          }
        }
      }
    }

    // Pass 2: Deterministic Decorations (Trees, Plants)
    // We check a slightly larger area so trees from neighboring chunks can overlap into this one
    for (let x = -2; x < CHUNK_SIZE + 2; x++) {
      for (let z = -2; z < CHUNK_SIZE + 2; z++) {
        const wx = cx * CHUNK_SIZE + x;
        const wz = cz * CHUNK_SIZE + z;
        
        const height = Math.floor((noise2D(wx * 0.02, wz * 0.02) + 1) * 10) + 20;
        const isLavaPool = noise2D(wx * 0.05, wz * 0.05) > 0.75;
        
        if (isLavaPool || height <= WATER_LEVEL || height >= WORLD_HEIGHT - 5) continue;
        
        // Deterministic random value for this specific column
        const r = (noise2D(wx * 123.456, wz * 789.012) + 1) / 2;
        
        if (r < 0.08) {
          // Tree
          // Log
          for (let ly = 1; ly <= 3; ly++) {
            if (x >= 0 && x < CHUNK_SIZE && z >= 0 && z < CHUNK_SIZE) {
              const index = x + (height + ly) * CHUNK_SIZE + z * CHUNK_SIZE * WORLD_HEIGHT;
              chunk[index] = BLOCKS.OAK_LOG;
            }
          }
          // Leaves
          for (let lx = -2; lx <= 2; lx++) {
            for (let lz = -2; lz <= 2; lz++) {
              for (let ly = 2; ly <= 4; ly++) {
                if (Math.abs(lx) === 2 && Math.abs(lz) === 2 && ly === 4) continue;
                const nx = x + lx;
                const nz = z + lz;
                if (nx >= 0 && nx < CHUNK_SIZE && nz >= 0 && nz < CHUNK_SIZE) {
                  const lIndex = nx + (height + ly) * CHUNK_SIZE + nz * CHUNK_SIZE * WORLD_HEIGHT;
                  if (chunk[lIndex] === 0) chunk[lIndex] = BLOCKS.OAK_LEAVES;
                }
              }
            }
          }
        } else if (r < 0.19) {
          if (x >= 0 && x < CHUNK_SIZE && z >= 0 && z < CHUNK_SIZE) {
            chunk[x + (height + 1) * CHUNK_SIZE + z * CHUNK_SIZE * WORLD_HEIGHT] = BLOCKS.SHORT_GRASS;
          }
        } else if (r < 0.20) {
          if (x >= 0 && x < CHUNK_SIZE && z >= 0 && z < CHUNK_SIZE) {
            chunk[x + (height + 1) * CHUNK_SIZE + z * CHUNK_SIZE * WORLD_HEIGHT] = BLOCKS.DANDELION;
          }
        } else if (r < 0.21) {
          if (x >= 0 && x < CHUNK_SIZE && z >= 0 && z < CHUNK_SIZE) {
            chunk[x + (height + 1) * CHUNK_SIZE + z * CHUNK_SIZE * WORLD_HEIGHT] = BLOCKS.POPPY;
          }
        }
        
        // Add mobs (only inside the actual chunk to prevent duplicates)
        if (x >= 0 && x < CHUNK_SIZE && z >= 0 && z < CHUNK_SIZE) {
          if (Math.random() < 0.005) {
            this.mobs.push({
              id: Math.random().toString(36).substring(7),
              type: Math.random() < 0.5 ? 'cow' : 'sheep',
              x: wx,
              y: height + 1,
              z: wz
            });
          }
        }
      }
    }
    this.chunks.set(this.getChunkKey(cx, cz), chunk);
    return chunk;
  }

  getBlock(x: number, y: number, z: number) {
    x = Math.floor(x);
    y = Math.floor(y);
    z = Math.floor(z);
    if (y < 0 || y >= WORLD_HEIGHT) return 0;
    const cx = Math.floor(x / CHUNK_SIZE);
    const cz = Math.floor(z / CHUNK_SIZE);
    const chunk = this.chunks.get(this.getChunkKey(cx, cz));
    if (!chunk) return 0; // Return AIR if chunk is not loaded
    
    const lx = x - cx * CHUNK_SIZE;
    const lz = z - cz * CHUNK_SIZE;
    return chunk[lx + y * CHUNK_SIZE + lz * CHUNK_SIZE * WORLD_HEIGHT];
  }

  setBlock(x: number, y: number, z: number, type: number) {
    x = Math.floor(x);
    y = Math.floor(y);
    z = Math.floor(z);
    if (y < 0 || y >= WORLD_HEIGHT) return;
    const cx = Math.floor(x / CHUNK_SIZE);
    const cz = Math.floor(z / CHUNK_SIZE);
    let chunk = this.chunks.get(this.getChunkKey(cx, cz));
    if (!chunk) chunk = this.generateChunk(cx, cz);
    
    const lx = x - cx * CHUNK_SIZE;
    const lz = z - cz * CHUNK_SIZE;
    
    if (chunk[lx + y * CHUNK_SIZE + lz * CHUNK_SIZE * WORLD_HEIGHT] === type) return;
    chunk[lx + y * CHUNK_SIZE + lz * CHUNK_SIZE * WORLD_HEIGHT] = type;
    
    this.scheduleFluidUpdate(x + 1, y, z);
    this.scheduleFluidUpdate(x - 1, y, z);
    this.scheduleFluidUpdate(x, y + 1, z);
    this.scheduleFluidUpdate(x, y - 1, z);
    this.scheduleFluidUpdate(x, y, z + 1);
    this.scheduleFluidUpdate(x, y, z - 1);
    this.scheduleFluidUpdate(x, y, z);
  }

  explode(cx: number, cy: number, cz: number, radius: number) {
    for (let x = -radius; x <= radius; x++) {
      for (let y = -radius; y <= radius; y++) {
        for (let z = -radius; z <= radius; z++) {
          if (x*x + y*y + z*z <= radius*radius) {
            const bx = cx + x;
            const by = cy + y;
            const bz = cz + z;
            if (this.getBlock(bx, by, bz) !== BLOCKS.BEDROCK && this.getBlock(bx, by, bz) !== 0) {
              this.setBlock(bx, by, bz, 0);
              inputState.triggerChunkUpdate(bx, bz);
            }
          }
        }
      }
    }
  }

  updateFluids() {
    if (this.fluidQueue.size === 0) return;
    const queue = Array.from(this.fluidQueue);
    this.fluidQueue.clear();
    
    let count = 0;
    for (const key of queue) {
      if (count++ > 500) {
        this.fluidQueue.add(key);
        continue;
      }
      const [x, y, z] = key.split(',').map(Number);
      this.processFluid(x, y, z);
    }
  }

  processFluid(x: number, y: number, z: number) {
    const id = this.getBlock(x, y, z);
    const isW = isWater(id);
    const isL = isLava(id);
    if (!isW && !isL) return;

    // Check neighbors for interaction
    const neighbors = [
      [x + 1, y, z], [x - 1, y, z],
      [x, y + 1, z], [x, y - 1, z],
      [x, y, z + 1], [x, y, z - 1]
    ];

    for (const [nx, ny, nz] of neighbors) {
      const neighborId = this.getBlock(nx, ny, nz);
      
      if (isW && isLava(neighborId)) {
        // Water touches Lava
        if (neighborId === BLOCKS.LAVA) {
          this.setBlock(nx, ny, nz, BLOCKS.OBSIDIAN);
        } else {
          this.setBlock(nx, ny, nz, BLOCKS.COBBLESTONE);
        }
      } else if (isL && isWater(neighborId)) {
        // Lava touches Water
        if (id === BLOCKS.LAVA) {
          this.setBlock(x, y, z, BLOCKS.OBSIDIAN);
        } else {
          this.setBlock(x, y, z, BLOCKS.COBBLESTONE);
        }
      }
    }

    const isSource = id === BLOCKS.WATER || id === BLOCKS.LAVA;
    let level = isSource ? 8 : (isW ? id - 2000 : id - 2010);

    if (!isSource) {
      let supported = false;
      const above = this.getBlock(x, y + 1, z);
      if ((isW && isWater(above)) || (isL && isLava(above))) {
        supported = true;
        level = 8;
      } else {
        let maxNeighborLevel = 0;
        const sides = [
          this.getBlock(x + 1, y, z),
          this.getBlock(x - 1, y, z),
          this.getBlock(x, y, z + 1),
          this.getBlock(x, y, z - 1)
        ];
        for (const side of sides) {
          if (isW && isWater(side)) {
            const sl = side === BLOCKS.WATER ? 8 : side - 2000;
            if (sl > maxNeighborLevel) maxNeighborLevel = sl;
          } else if (isL && isLava(side)) {
            const sl = side === BLOCKS.LAVA ? 8 : side - 2010;
            if (sl > maxNeighborLevel) maxNeighborLevel = sl;
          }
        }
        if (maxNeighborLevel > level) {
          supported = true;
          if (maxNeighborLevel - 1 > level) {
            level = maxNeighborLevel - 1;
            this.setBlock(x, y, z, isW ? 2000 + level : 2010 + level);
            inputState.triggerChunkUpdate(x, z);
          }
        }
      }

      if (!supported) {
        this.setBlock(x, y, z, 0);
        inputState.triggerChunkUpdate(x, z);
        return;
      }
    }

    // Spread downwards
    const below = this.getBlock(x, y - 1, z);
    if (below === BLOCKS.AIR || 
       (isW && isWater(below) && below !== BLOCKS.WATER && below - 2000 < 8) || 
       (isL && isLava(below) && below !== BLOCKS.LAVA && below - 2010 < 8)) {
      this.setBlock(x, y - 1, z, isW ? 2007 : 2017);
      inputState.triggerChunkUpdate(x, z);
    } else if (below !== BLOCKS.AIR && !isWater(below) && !isLava(below)) {
      // Spread sideways
      if (level > 1) {
        const spreadLevel = level - (isW ? 1 : 2);
        if (spreadLevel > 0) {
          const sides = [
            [x + 1, y, z],
            [x - 1, y, z],
            [x, y, z + 1],
            [x, y, z - 1]
          ];
          for (const [nx, ny, nz] of sides) {
            const sideId = this.getBlock(nx, ny, nz);
            if (sideId === BLOCKS.AIR) {
              this.setBlock(nx, ny, nz, isW ? 2000 + spreadLevel : 2010 + spreadLevel);
              inputState.triggerChunkUpdate(nx, nz);
            } else if (isW && isWater(sideId) && sideId !== BLOCKS.WATER && sideId - 2000 < spreadLevel) {
              this.setBlock(nx, ny, nz, 2000 + spreadLevel);
              inputState.triggerChunkUpdate(nx, nz);
            } else if (isL && isLava(sideId) && sideId !== BLOCKS.LAVA && sideId - 2010 < spreadLevel) {
              this.setBlock(nx, ny, nz, 2010 + spreadLevel);
              inputState.triggerChunkUpdate(nx, nz);
            }
          }
        }
      }
    }
  }
}

export const world = new WorldManager();
