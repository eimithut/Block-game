import * as THREE from 'three';
import JSZip from 'jszip';
import { BLOCKS, TILE_MAP, BLOCK_FACES } from './generated_blocks';

export { BLOCKS, TILE_MAP, BLOCK_FACES };

const COLORS = [
  'WHITE', 'ORANGE', 'MAGENTA', 'LIGHT_BLUE', 'YELLOW', 'LIME', 'PINK', 'GRAY',
  'LIGHT_GRAY', 'CYAN', 'PURPLE', 'BLUE', 'BROWN', 'GREEN', 'RED', 'BLACK'
];

export const isWater = (id: number) => id === BLOCKS.WATER || (id >= 2000 && id <= 2007);
export const isLava = (id: number) => id === BLOCKS.LAVA || (id >= 2010 && id <= 2017);

export const isPlant = (id: number) => {
  return [
    BLOCKS.SHORT_GRASS, BLOCKS.TALL_GRASS, BLOCKS.DANDELION, BLOCKS.POPPY,
    BLOCKS.OAK_SAPLING, BLOCKS.FERN, BLOCKS.DEAD_BUSH, BLOCKS.BROWN_MUSHROOM,
    BLOCKS.RED_MUSHROOM, BLOCKS.SUGAR_CANE, BLOCKS.WHEAT, BLOCKS.CARROTS,
    BLOCKS.POTATOES, BLOCKS.BEETROOTS, BLOCKS.SWEET_BERRY_BUSH, BLOCKS.VINE,
    BLOCKS.LILY_PAD, BLOCKS.SUNFLOWER, BLOCKS.LILAC, BLOCKS.ROSE_BUSH,
    BLOCKS.PEONY, BLOCKS.TALL_SEAGRASS, BLOCKS.SEAGRASS, BLOCKS.KELP,
    BLOCKS.BAMBOO, BLOCKS.CORNFLOWER, BLOCKS.LILY_OF_THE_VALLEY, BLOCKS.WITHER_ROSE,
    BLOCKS.BLUE_ORCHID, BLOCKS.ALLIUM, BLOCKS.AZURE_BLUET, BLOCKS.RED_TULIP,
    BLOCKS.ORANGE_TULIP, BLOCKS.WHITE_TULIP, BLOCKS.PINK_TULIP, BLOCKS.OXEYE_DAISY
  ].includes(id);
};

export const dynamicTransparentBlocks = new Set<number>();

export const isTransparent = (id: number) => {
  return id === BLOCKS.AIR || id === BLOCKS.GLASS || id === BLOCKS.OAK_LEAVES || 
         isWater(id) || isLava(id) || isPlant(id) || dynamicTransparentBlocks.has(id);
};

for (let i = 2000; i <= 2007; i++) BLOCK_FACES[i] = { all: BLOCK_FACES[BLOCKS.WATER].all };
for (let i = 2010; i <= 2017; i++) BLOCK_FACES[i] = { all: BLOCK_FACES[BLOCKS.LAVA].all };

export function createTextureAtlas() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, 1024, 1024);

  const drawTile = (tId: number, color: string, noiseColor?: string, noiseDensity = 0.5) => {
    const x = tId % 64;
    const y = Math.floor(tId / 64);
    ctx.fillStyle = color;
    ctx.fillRect(x * 16, y * 16, 16, 16);
    if (noiseColor) {
      ctx.fillStyle = noiseColor;
      for (let i = 0; i < 16; i++) {
        for (let j = 0; j < 16; j++) {
          if (Math.random() > noiseDensity) {
            ctx.fillRect(x * 16 + i, y * 16 + j, 1, 1);
          }
        }
      }
    }
  };

  Object.entries(TILE_MAP).forEach(([tIdStr, name]) => {
    const tId = parseInt(tIdStr);
    let color = '#888888';
    let noiseColor = '#777777';
    let noiseDensity = 0.5;

    if (name.includes('wood') || name.includes('log') || name.includes('planks') || name.includes('door') || name.includes('trapdoor') || name.includes('fence') || name.includes('sign')) {
      color = '#5c4033'; noiseColor = '#4a332a';
      if (name.includes('birch')) { color = '#d7c185'; noiseColor = '#c1a96c'; }
      if (name.includes('spruce')) { color = '#4d3323'; noiseColor = '#3a2518'; }
      if (name.includes('jungle')) { color = '#7a5c46'; noiseColor = '#614734'; }
      if (name.includes('acacia')) { color = '#a85a32'; noiseColor = '#8c4826'; }
      if (name.includes('dark_oak')) { color = '#2c1b0d'; noiseColor = '#1e1108'; }
      if (name.includes('crimson')) { color = '#7e3a56'; noiseColor = '#5c283d'; }
      if (name.includes('warped')) { color = '#398382'; noiseColor = '#2b6362'; }
    } else if (name.includes('dirt') || name.includes('farmland') || name.includes('path') || name.includes('podzol') || name.includes('mycelium')) {
      color = '#654321'; noiseColor = '#543210';
      if (name.includes('mycelium')) { color = '#6f6265'; noiseColor = '#5a4e51'; }
      if (name.includes('podzol')) { color = '#5a3b1d'; noiseColor = '#452a12'; }
    } else if (name.includes('grass_block_top')) {
      color = '#44aa44'; noiseColor = '#339933';
    } else if (name.includes('grass_block_side')) {
      color = '#654321'; noiseColor = '#543210';
    } else if (name.includes('leaves') || name.includes('plant') || name.includes('vine') || name.includes('grass') || name.includes('fern') || name.includes('flower') || name.includes('sapling') || name.includes('mushroom') || name.includes('lily') || name.includes('rose') || name.includes('tulip') || name.includes('daisy') || name.includes('orchid') || name.includes('allium') || name.includes('bluet') || name.includes('cornflower')) {
      color = '#228b22'; noiseColor = '#1e7b1e';
      if (name.includes('red')) { color = '#ff0000'; noiseColor = '#cc0000'; }
      if (name.includes('blue')) { color = '#0000ff'; noiseColor = '#0000cc'; }
      if (name.includes('yellow') || name.includes('dandelion') || name.includes('sunflower')) { color = '#ffff00'; noiseColor = '#cccc00'; }
      if (name.includes('pink') || name.includes('peony')) { color = '#ff66b2'; noiseColor = '#cc4c8e'; }
      if (name.includes('white') || name.includes('lily_of_the_valley')) { color = '#ffffff'; noiseColor = '#cccccc'; }
      if (name.includes('wither')) { color = '#222222'; noiseColor = '#111111'; }
      if (name.includes('brown')) { color = '#8b4513'; noiseColor = '#6b340e'; }
    } else if (name.includes('stone') || name.includes('cobblestone') || name.includes('andesite') || name.includes('diorite') || name.includes('granite') || name.includes('tuff') || name.includes('deepslate') || name.includes('bedrock') || name.includes('basalt') || name.includes('blackstone')) {
      color = '#888888'; noiseColor = '#777777';
      if (name.includes('diorite')) { color = '#d4d4d4'; noiseColor = '#b3b3b3'; }
      if (name.includes('granite')) { color = '#9a6b5e'; noiseColor = '#7a5247'; }
      if (name.includes('andesite')) { color = '#828383'; noiseColor = '#686969'; }
      if (name.includes('deepslate')) { color = '#3d3d43'; noiseColor = '#2d2d31'; }
      if (name.includes('tuff')) { color = '#6c6d66'; noiseColor = '#54554f'; }
      if (name.includes('bedrock')) { color = '#555555'; noiseColor = '#333333'; }
      if (name.includes('basalt')) { color = '#515155'; noiseColor = '#3d3d40'; }
      if (name.includes('blackstone')) { color = '#2a242a'; noiseColor = '#1e1a1e'; }
    } else if (name.includes('sand') || name.includes('gravel') || name.includes('clay')) {
      color = '#d2b48c'; noiseColor = '#c2a47c';
      if (name.includes('red_sand')) { color = '#a95821'; noiseColor = '#8a4619'; }
      if (name.includes('gravel')) { color = '#827f7f'; noiseColor = '#686565'; }
      if (name.includes('clay')) { color = '#a0a6b3'; noiseColor = '#808590'; }
    } else if (name.includes('water')) {
      color = 'rgba(30, 144, 255, 0.6)'; noiseColor = undefined;
    } else if (name.includes('lava')) {
      color = '#ff4400'; noiseColor = '#cc3300';
    } else if (name.includes('glass')) {
      color = 'rgba(255, 255, 255, 0.3)'; noiseColor = undefined;
    } else if (name.includes('ore')) {
      color = '#888888'; noiseColor = '#111111'; noiseDensity = 0.8;
      if (name.includes('deepslate')) { color = '#3d3d43'; }
      if (name.includes('gold')) noiseColor = '#fcee4b';
      else if (name.includes('iron')) noiseColor = '#dcb9a0';
      else if (name.includes('diamond')) noiseColor = '#5decf2';
      else if (name.includes('emerald')) noiseColor = '#17dd62';
      else if (name.includes('redstone')) noiseColor = '#ff0000';
      else if (name.includes('lapis')) noiseColor = '#1034a6';
      else if (name.includes('copper')) noiseColor = '#c87d62';
      else if (name.includes('coal')) noiseColor = '#111111';
      else if (name.includes('quartz')) { color = '#7a3333'; noiseColor = '#e5e1d8'; }
    } else if (name.includes('wool') || name.includes('concrete') || name.includes('terracotta') || name.includes('shulker') || name.includes('bed') || name.includes('banner') || name.includes('carpet')) {
      color = '#dddddd'; noiseColor = '#cccccc';
      if (name.includes('red')) color = '#b02e26';
      else if (name.includes('blue')) color = '#3c44aa';
      else if (name.includes('green')) color = '#5e7c16';
      else if (name.includes('yellow')) color = '#fed83d';
      else if (name.includes('orange')) color = '#f27e2b';
      else if (name.includes('purple')) color = '#8932b8';
      else if (name.includes('pink')) color = '#f38baa';
      else if (name.includes('cyan')) color = '#169c9c';
      else if (name.includes('black')) color = '#1d1d21';
      else if (name.includes('white')) color = '#ffffff';
      else if (name.includes('gray')) color = '#474f52';
      else if (name.includes('light_gray')) color = '#9d9d97';
      else if (name.includes('light_blue')) color = '#3ab3da';
      else if (name.includes('lime')) color = '#80c71f';
      else if (name.includes('magenta')) color = '#c64fbd';
      else if (name.includes('brown')) color = '#835432';
    } else if (name.includes('netherrack') || name.includes('nylium') || name.includes('soul') || name.includes('magma') || name.includes('glowstone')) {
      color = '#7a3333'; noiseColor = '#5c2424';
      if (name.includes('crimson_nylium')) { color = '#bd3030'; noiseColor = '#942424'; }
      if (name.includes('warped_nylium')) { color = '#14b485'; noiseColor = '#0e8a65'; }
      if (name.includes('soul')) { color = '#4d3a2e'; noiseColor = '#3a2b22'; }
      if (name.includes('magma')) { color = '#d96514'; noiseColor = '#a84a0b'; }
      if (name.includes('glowstone')) { color = '#e6b85c'; noiseColor = '#b38b3b'; }
    } else if (name.includes('end_stone') || name.includes('purpur')) {
      color = '#dfdfa5'; noiseColor = '#baba85';
      if (name.includes('purpur')) { color = '#a97aa9'; noiseColor = '#855e85'; }
    } else if (name.includes('ice') || name.includes('snow') || name.includes('powder_snow')) {
      color = '#ffffff'; noiseColor = '#e0e0e0';
      if (name.includes('ice')) { color = '#8cb4ff'; noiseColor = '#6a98e8'; }
      if (name.includes('blue_ice')) { color = '#74a8ff'; noiseColor = '#558bed'; }
    } else if (name.includes('copper')) {
      color = '#c06b50'; noiseColor = '#a1563e';
      if (name.includes('exposed')) { color = '#a07d6a'; noiseColor = '#856655'; }
      if (name.includes('weathered')) { color = '#64a077'; noiseColor = '#508561'; }
      if (name.includes('oxidized')) { color = '#52a286'; noiseColor = '#41856d'; }
    } else if (name.includes('tnt')) {
      color = '#db3725'; noiseColor = '#ffffff'; noiseDensity = 0.9;
    } else {
      let hash = 0;
      for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
      }
      const r = (hash & 0xFF0000) >> 16;
      const g = (hash & 0x00FF00) >> 8;
      const b = hash & 0x0000FF;
      color = `rgb(${r},${g},${b})`;
      noiseColor = `rgb(${Math.max(0, r-20)},${Math.max(0, g-20)},${Math.max(0, b-20)})`;
    }

    drawTile(tId, color, noiseColor, noiseDensity);

    if (name.includes('grass_block_side')) {
      const x = tId % 64;
      const y = Math.floor(tId / 64);
      ctx.fillStyle = '#44aa44';
      ctx.fillRect(x * 16, y * 16, 16, 4);
      for(let i=0; i<16; i++) {
        if(Math.random() > 0.5) ctx.fillRect(x * 16 + i, y * 16 + 4, 1, Math.floor(Math.random()*3));
      }
    } else if (name.includes('glass')) {
      const x = tId % 64;
      const y = Math.floor(tId / 64);
      ctx.strokeStyle = '#ffffff';
      ctx.strokeRect(x * 16, y * 16, 16, 16);
    } else if (name.includes('tnt_side')) {
      const x = tId % 64;
      const y = Math.floor(tId / 64);
      ctx.fillStyle = '#ffffff';
      ctx.font = '8px monospace';
      ctx.fillText('TNT', x*16 + 1, y*16 + 10);
    }
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export const textureAtlas = createTextureAtlas();
export const materialOpaque = new THREE.MeshLambertMaterial({
  map: textureAtlas,
  transparent: false,
  alphaTest: 0.5,
});

export const materialTransparent = new THREE.MeshLambertMaterial({
  map: textureAtlas,
  transparent: true,
  depthWrite: false,
  alphaTest: 0.1,
});

type AnimatedTexture = {
  x: number;
  y: number;
  img: HTMLImageElement;
  frames: number;
  currentFrame: number;
  ticks: number;
  frameTime: number;
};

const animatedTextures: AnimatedTexture[] = [];

setInterval(() => {
  if (animatedTextures.length === 0) return;
  
  const canvas = textureAtlas.image as HTMLCanvasElement;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  let updated = false;
  
  for (const anim of animatedTextures) {
    anim.ticks++;
    if (anim.ticks >= anim.frameTime) {
      anim.ticks = 0;
      anim.currentFrame = (anim.currentFrame + 1) % anim.frames;
      
      ctx.clearRect(anim.x * 16, anim.y * 16, 16, 16);
      ctx.drawImage(
        anim.img, 
        0, anim.currentFrame * anim.img.width, 
        anim.img.width, anim.img.width, 
        anim.x * 16, anim.y * 16, 
        16, 16
      );
      updated = true;
    }
  }
  
  if (updated) {
    textureAtlas.needsUpdate = true;
  }
}, 50);

export async function applyTextureOverride(name: string, source: string | Blob) {
  const canvas = textureAtlas.image as HTMLCanvasElement;
  const ctx = canvas.getContext('2d')!;
  
  const img = new Image();
  if (typeof source === 'string') {
    img.src = source;
  } else {
    img.src = URL.createObjectURL(source);
  }

  try {
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });

    let updated = false;
    Object.entries(TILE_MAP).forEach(([tIdStr, tileName]) => {
      if (tileName === name) {
        const tId = parseInt(tIdStr);
        const x = tId % 64;
        const y = Math.floor(tId / 64);
        ctx.clearRect(x * 16, y * 16, 16, 16);
        ctx.drawImage(img, 0, 0, img.width, img.width, x * 16, y * 16, 16, 16);
        updated = true;
      }
    });

    if (updated) {
      textureAtlas.needsUpdate = true;
      materialOpaque.needsUpdate = true;
      materialTransparent.needsUpdate = true;
      window.dispatchEvent(new CustomEvent('texture-pack-loaded'));
    }
    return updated;
  } catch (err) {
    console.error(`Failed to apply texture override for ${name}`, err);
    return false;
  }
}

export async function loadPublicOverrides() {
  // Common blocks to check for overrides in /public/textures/
  const commonBlocks = [
    'stone', 'grass_block_top', 'grass_block_side', 'dirt', 'cobblestone', 
    'oak_planks', 'oak_log', 'oak_leaves', 'glass', 'bedrock', 'sand', 
    'gravel', 'water_still', 'lava_still', 'tnt_side', 'tnt_top', 'tnt_bottom',
    'iron_block', 'gold_block', 'diamond_block', 'emerald_block', 'obsidian',
    'oak_sapling', 'dandelion', 'poppy', 'brown_mushroom', 'red_mushroom',
    'iron_ore', 'gold_ore', 'coal_ore', 'diamond_ore', 'emerald_ore', 'redstone_ore', 'lapis_ore',
    'birch_planks', 'spruce_planks', 'jungle_planks', 'acacia_planks', 'dark_oak_planks',
    'birch_log', 'spruce_log', 'jungle_log', 'acacia_log', 'dark_oak_log',
    'birch_leaves', 'spruce_leaves', 'jungle_leaves', 'acacia_leaves', 'dark_oak_leaves',
    'bricks', 'mossy_cobblestone', 'netherrack', 'soul_sand', 'glowstone', 'end_stone'
  ];

  console.log('Checking for public texture overrides...');
  
  const results = await Promise.allSettled(commonBlocks.map(async (name) => {
    const url = `/textures/${name}.png`;
    const res = await fetch(url, { method: 'HEAD' });
    if (!res.ok) throw new Error('Not found');
    return applyTextureOverride(name, url);
  }));

  const appliedCount = results.filter(r => r.status === 'fulfilled' && r.value).length;
  if (appliedCount > 0) {
    console.log(`Applied ${appliedCount} public texture overrides`);
  }
}

export async function loadTexturePack(file: File) {
  const zip = await JSZip.loadAsync(file);
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  
  // First, draw the default atlas as a fallback
  ctx.drawImage(textureAtlas.image, 0, 0);

  // Clear existing animated textures
  animatedTextures.length = 0;
  
  const transparentTextures = new Set<number>();

  // Then overwrite with loaded textures
  const promises = Object.entries(TILE_MAP).map(async ([tIdStr, name]) => {
    const tId = parseInt(tIdStr);
    const x = tId % 64;
    const y = Math.floor(tId / 64);
    
    // Try to find the file in the zip (handle different possible paths in texture packs)
    const possiblePaths = [
      `assets/minecraft/textures/block/${name}.png`,
      `assets/minecraft/textures/blocks/${name}.png`,
      `textures/block/${name}.png`,
      `textures/blocks/${name}.png`,
    ];
    
    let zipFile = null;
    for (const path of possiblePaths) {
      const f = zip.file(path);
      if (f) {
        zipFile = f;
        break;
      }
    }

    if (zipFile) {
      try {
        const blob = await zipFile.async('blob');
        const img = new Image();
        img.src = URL.createObjectURL(blob);
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });

        // Use an offscreen canvas to prevent composite operations from bleeding into the main atlas
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 16;
        tempCanvas.height = 16;
        const tempCtx = tempCanvas.getContext('2d')!;
        tempCtx.imageSmoothingEnabled = false;

        // Use img.width for both source width and height to grab the first square frame
        tempCtx.drawImage(img, 0, 0, img.width, img.width, 0, 0, 16, 16);
        
        // Apply biome tint for grass top and leaves (which are greyscale in Minecraft)
        if (name === 'grass_block_top' || name === 'oak_leaves') {
          tempCtx.globalCompositeOperation = 'multiply';
          tempCtx.fillStyle = name === 'grass_block_top' ? '#79c05a' : '#48b54e';
          tempCtx.fillRect(0, 0, 16, 16);
          
          // Restore alpha channel (important for leaves)
          tempCtx.globalCompositeOperation = 'destination-in';
          tempCtx.drawImage(img, 0, 0, img.width, img.width, 0, 0, 16, 16);
        }

        // Handle grass block side overlay (the green grass part that hangs over the dirt)
        if (name === 'grass_block_side') {
          const overlayPaths = [
            `assets/minecraft/textures/block/grass_block_side_overlay.png`,
            `assets/minecraft/textures/blocks/grass_block_side_overlay.png`,
            `textures/block/grass_block_side_overlay.png`,
            `textures/blocks/grass_block_side_overlay.png`,
          ];
          let overlayZipFile = null;
          for (const path of overlayPaths) {
            const f = zip.file(path);
            if (f) { overlayZipFile = f; break; }
          }
          if (overlayZipFile) {
            const overlayBlob = await overlayZipFile.async('blob');
            const overlayImg = new Image();
            overlayImg.src = URL.createObjectURL(overlayBlob);
            await new Promise((resolve) => {
              overlayImg.onload = resolve;
              overlayImg.onerror = resolve;
            });
            
            if (overlayImg.width > 0) {
              const overlayCanvas = document.createElement('canvas');
              overlayCanvas.width = 16;
              overlayCanvas.height = 16;
              const overlayCtx = overlayCanvas.getContext('2d')!;
              overlayCtx.imageSmoothingEnabled = false;
              
              overlayCtx.drawImage(overlayImg, 0, 0, overlayImg.width, overlayImg.width, 0, 0, 16, 16);
              overlayCtx.globalCompositeOperation = 'multiply';
              overlayCtx.fillStyle = '#79c05a';
              overlayCtx.fillRect(0, 0, 16, 16);
              overlayCtx.globalCompositeOperation = 'destination-in';
              overlayCtx.drawImage(overlayImg, 0, 0, overlayImg.width, overlayImg.width, 0, 0, 16, 16);
              
              tempCtx.globalCompositeOperation = 'source-over';
              tempCtx.drawImage(overlayCanvas, 0, 0);
            }
          }
        }

        // Draw the finalized 16x16 texture onto the main atlas
        ctx.clearRect(x * 16, y * 16, 16, 16);
        ctx.globalCompositeOperation = 'source-over';
        ctx.drawImage(tempCanvas, 0, 0, 16, 16, x * 16, y * 16, 16, 16);
        
        // Check for transparency
        const imageData = tempCtx.getImageData(0, 0, 16, 16).data;
        let hasTransparency = false;
        for (let i = 3; i < imageData.length; i += 4) {
          if (imageData[i] < 255) {
            hasTransparency = true;
            break;
          }
        }
        if (hasTransparency) {
          transparentTextures.add(tId);
        }
        
        // Add to animated textures if it has multiple frames
        if (img.height > img.width) {
          animatedTextures.push({
            x,
            y,
            img,
            frames: Math.floor(img.height / img.width),
            currentFrame: 0,
            ticks: 0,
            frameTime: 2, // 100ms per frame
          });
        }
      } catch (e) {
        console.error(`Failed to load texture for ${name}`, e);
      }
    }
  });

  await Promise.all(promises);
  
  dynamicTransparentBlocks.clear();
  for (const [blockIdStr, faces] of Object.entries(BLOCK_FACES)) {
    const blockId = parseInt(blockIdStr);
    if (
      (faces.all !== undefined && transparentTextures.has(faces.all)) ||
      (faces.top !== undefined && transparentTextures.has(faces.top)) ||
      (faces.bottom !== undefined && transparentTextures.has(faces.bottom)) ||
      (faces.side !== undefined && transparentTextures.has(faces.side))
    ) {
      dynamicTransparentBlocks.add(blockId);
    }
  }
  
  textureAtlas.image = canvas;
  textureAtlas.needsUpdate = true;
  materialOpaque.needsUpdate = true;
  materialTransparent.needsUpdate = true;
  
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('texture-pack-loaded'));
  }
}
