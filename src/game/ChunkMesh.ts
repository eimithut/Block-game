import * as THREE from 'three';
import { world, CHUNK_SIZE, WORLD_HEIGHT } from './WorldManager';
import { BLOCKS, BLOCK_FACES, isWater, isLava, isPlant, isTransparent, dynamicTransparentBlocks } from './textures';

const faces = [
  { dir: [ -1,  0,  0 ], corners: [ [0,0,0], [0,0,1], [0,1,1], [0,1,0] ] }, // left
  { dir: [  1,  0,  0 ], corners: [ [1,0,1], [1,0,0], [1,1,0], [1,1,1] ] }, // right
  { dir: [  0, -1,  0 ], corners: [ [0,0,1], [0,0,0], [1,0,0], [1,0,1] ] }, // bottom
  { dir: [  0,  1,  0 ], corners: [ [0,1,0], [0,1,1], [1,1,1], [1,1,0] ] }, // top
  { dir: [  0,  0, -1 ], corners: [ [1,0,0], [0,0,0], [0,1,0], [1,1,0] ] }, // back
  { dir: [  0,  0,  1 ], corners: [ [0,0,1], [1,0,1], [1,1,1], [0,1,1] ] }, // front
];

const crossFaces = [
  { corners: [ [0,0,0], [1,0,1], [1,1,1], [0,1,0] ], normal: [0.707, 0, -0.707] },
  { corners: [ [1,0,1], [0,0,0], [0,1,0], [1,1,1] ], normal: [-0.707, 0, 0.707] },
  { corners: [ [1,0,0], [0,0,1], [0,1,1], [1,1,0] ], normal: [-0.707, 0, -0.707] },
  { corners: [ [0,0,1], [1,0,0], [1,1,0], [0,1,1] ], normal: [0.707, 0, 0.707] },
];

const faceUVs = [
  [0, 0], [1, 0], [1, 1], [0, 1]
];

export function buildChunkMesh(cx: number, cz: number) {
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const opaqueIndices: number[] = [];
  const transparentIndices: number[] = [];
  let indexOffset = 0;

  for (let x = 0; x < CHUNK_SIZE; x++) {
    for (let y = 0; y < WORLD_HEIGHT; y++) {
      for (let z = 0; z < CHUNK_SIZE; z++) {
        const wx = cx * CHUNK_SIZE + x;
        const wz = cz * CHUNK_SIZE + z;
        const block = world.getBlock(wx, y, wz);

        if (block === BLOCKS.AIR) continue;

        const blockFaces = BLOCK_FACES[block];
        if (!blockFaces) continue;

        if (isPlant(block)) {
          // Render as cross model
          let tile = blockFaces.all || 0;
          const u0 = (tile % 64) / 64;
          const v0 = 1 - (Math.floor(tile / 64) + 1) / 64;
          const u1 = u0 + 1 / 64;
          const v1 = v0 + 1 / 64;

          for (let i = 0; i < crossFaces.length; i++) {
            const face = crossFaces[i];
            for (let j = 0; j < 4; j++) {
              const corner = face.corners[j];
              positions.push(wx + corner[0], y + corner[1], wz + corner[2]);
              normals.push(...face.normal);
              const uv = faceUVs[j];
              uvs.push(uv[0] === 0 ? u0 : u1, uv[1] === 0 ? v0 : v1);
            }
            opaqueIndices.push(
              indexOffset, indexOffset + 1, indexOffset + 2,
              indexOffset, indexOffset + 2, indexOffset + 3
            );
            indexOffset += 4;
          }
          continue;
        }

        for (let i = 0; i < faces.length; i++) {
          const face = faces[i];
          const nx = wx + face.dir[0];
          const ny = y + face.dir[1];
          const nz = wz + face.dir[2];

          const neighbor = world.getBlock(nx, ny, nz);
          
          let renderFace = false;
          if (isTransparent(neighbor)) {
            if (neighbor === block && (isWater(block) || isLava(block))) {
              renderFace = false;
            } else if (neighbor === BLOCKS.GLASS && block === BLOCKS.GLASS) {
              renderFace = false;
            } else if (neighbor === BLOCKS.OAK_LEAVES && block === BLOCKS.OAK_LEAVES) {
              renderFace = false;
            } else if (neighbor === block && dynamicTransparentBlocks.has(block)) {
              renderFace = false;
            } else {
              renderFace = true;
            }
          }

          if (renderFace) {
            // Determine texture tile
            let tile = 0;
            if (blockFaces.all !== undefined) {
              tile = blockFaces.all;
            } else {
              if (face.dir[1] === 1 && blockFaces.top !== undefined) tile = blockFaces.top;
              else if (face.dir[1] === -1 && blockFaces.bottom !== undefined) tile = blockFaces.bottom;
              else if (blockFaces.side !== undefined) tile = blockFaces.side;
            }

            const u0 = (tile % 64) / 64;
            const v0 = 1 - (Math.floor(tile / 64) + 1) / 64;
            const u1 = u0 + 1 / 64;
            const v1 = v0 + 1 / 64;

            for (let j = 0; j < 4; j++) {
              const corner = face.corners[j];
              let yOffset = corner[1];
              
              if (isWater(block) && face.dir[1] === 1) {
                const level = block === BLOCKS.WATER ? 8 : block - 2000;
                yOffset = level / 8;
              } else if (isWater(block) && face.dir[1] === 0 && corner[1] === 1) {
                const level = block === BLOCKS.WATER ? 8 : block - 2000;
                yOffset = level / 8;
              }
              
              positions.push(wx + corner[0], y + yOffset, wz + corner[2]);
              normals.push(...face.dir);
              
              const uv = faceUVs[j];
              uvs.push(uv[0] === 0 ? u0 : u1, uv[1] === 0 ? v0 : v1);
            }

            const targetIndices = (isWater(block) || isLava(block)) ? transparentIndices : opaqueIndices;
            targetIndices.push(
              indexOffset, indexOffset + 1, indexOffset + 2,
              indexOffset, indexOffset + 2, indexOffset + 3
            );
            indexOffset += 4;
          }
        }
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  
  geometry.setIndex([...opaqueIndices, ...transparentIndices]);
  geometry.addGroup(0, opaqueIndices.length, 0);
  geometry.addGroup(opaqueIndices.length, transparentIndices.length, 1);

  return geometry;
}
