const fs = require('fs');

const lines = fs.readFileSync('blocks.txt', 'utf8').split('\n');
const blocks = {};
let currentBlockId = 1;

for (const line of lines) {
    if (!line.trim() || line.startsWith('---')) continue;
    const parts = line.split('=');
    if (parts.length === 2) {
        let name = parts[1].trim();
        if (name.startsWith('minecraft:')) {
            name = name.substring(10);
        }
        if (!blocks[name]) {
            blocks[name] = currentBlockId++;
        }
    }
}

// Add some defaults if not present
const defaultBlocks = ['air', 'dirt', 'grass_block', 'stone', 'cobblestone', 'oak_planks', 'oak_log', 'oak_leaves', 'glass', 'water', 'lava', 'sand', 'gravel', 'bedrock', 'coal_ore', 'iron_ore', 'gold_ore', 'diamond_ore'];
for (const b of defaultBlocks) {
    if (blocks[b] === undefined) {
        blocks[b] = currentBlockId++;
    }
}

// Ensure air is 0
if (blocks['air'] !== undefined) {
    delete blocks['air'];
}
blocks['air'] = 0;

let blocksStr = 'export const BLOCKS: Record<string, number> = {\n';
for (const [name, id] of Object.entries(blocks)) {
    blocksStr += `  '${name.toUpperCase()}': ${id},\n`;
}
blocksStr += '};\n';

const tileMap = {};
let currentTileId = 0;
const blockFaces = {};

for (const [name, id] of Object.entries(blocks)) {
    if (id === 0) continue;
    
    if (name === 'grass_block') {
        const topId = currentTileId++;
        const sideId = currentTileId++;
        const bottomId = currentTileId++;
        tileMap[topId] = 'grass_block_top';
        tileMap[sideId] = 'grass_block_side';
        tileMap[bottomId] = 'dirt';
        blockFaces[id] = `{ top: ${topId}, bottom: ${bottomId}, side: ${sideId} }`;
    } else if (name === 'oak_log') {
        const topId = currentTileId++;
        const sideId = currentTileId++;
        tileMap[topId] = 'oak_log_top';
        tileMap[sideId] = 'oak_log';
        blockFaces[id] = `{ top: ${topId}, bottom: ${topId}, side: ${sideId} }`;
    } else if (name === 'tnt') {
        const topId = currentTileId++;
        const sideId = currentTileId++;
        const bottomId = currentTileId++;
        tileMap[topId] = 'tnt_top';
        tileMap[sideId] = 'tnt_side';
        tileMap[bottomId] = 'tnt_bottom';
        blockFaces[id] = `{ top: ${topId}, bottom: ${bottomId}, side: ${sideId} }`;
    } else if (name === 'water') {
        const stillId = currentTileId++;
        tileMap[stillId] = 'water_still';
        blockFaces[id] = `{ all: ${stillId} }`;
    } else if (name === 'lava') {
        const stillId = currentTileId++;
        tileMap[stillId] = 'lava_still';
        blockFaces[id] = `{ all: ${stillId} }`;
    } else {
        const allId = currentTileId++;
        tileMap[allId] = name;
        blockFaces[id] = `{ all: ${allId} }`;
    }
}

let tileMapStr = 'export const TILE_MAP: Record<number, string> = {\n';
for (const [id, name] of Object.entries(tileMap)) {
    tileMapStr += `  ${id}: '${name}',\n`;
}
tileMapStr += '};\n';

let blockFacesStr = 'export const BLOCK_FACES: Record<number, { all?: number, top?: number, bottom?: number, side?: number }> = {\n';
for (const [id, faces] of Object.entries(blockFaces)) {
    blockFacesStr += `  ${id}: ${faces},\n`;
}
blockFacesStr += '};\n';

fs.writeFileSync('generated_blocks.ts', blocksStr + '\n' + tileMapStr + '\n' + blockFacesStr);
