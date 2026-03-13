import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { world } from './WorldManager';
import { inputState } from './inputState';
import { BLOCKS, isWater, isLava, isPlant } from './textures';

const PLAYER_HEIGHT = 1.6;
const PLAYER_RADIUS = 0.3;
const GRAVITY = 30;
const JUMP_FORCE = 10;
const MOVE_SPEED = 5;

import { settings } from '../components/PauseMenu';

export function Player() {
  const { camera } = useThree();
  const velocity = useRef(new THREE.Vector3());
  const position = useRef(new THREE.Vector3(8, 40, 8)); // Start high up
  const onGround = useRef(false);
  const pitch = useRef(0);
  const yaw = useRef(0);

  // Initialize camera and listen for room changes
  useEffect(() => {
    camera.position.copy(position.current);
    camera.rotation.order = 'YXZ';

    const onRoomChange = () => {
      position.current.set(8, 40, 8);
      velocity.current.set(0, 0, 0);
      camera.position.copy(position.current);
    };

    const onTeleport = (e: any) => {
      const { x, y, z } = e.detail;
      position.current.set(x, y, z);
      velocity.current.set(0, 0, 0);
      camera.position.copy(position.current);
    };

    world.roomChangeCallbacks.add(onRoomChange);
    window.addEventListener('teleport', onTeleport);
    return () => {
      world.roomChangeCallbacks.delete(onRoomChange);
      window.removeEventListener('teleport', onTeleport);
    };
  }, [camera]);

  useFrame((state, delta) => {
    if (!inputState.paused && !inputState.chatting) {
      // Look
      yaw.current -= inputState.lookX * settings.sensitivity;
      pitch.current -= inputState.lookY * settings.sensitivity;
      pitch.current = Math.max(-Math.PI / 2 + 0.001, Math.min(Math.PI / 2 - 0.001, pitch.current));
      
      camera.rotation.set(pitch.current, yaw.current, 0, 'YXZ');
    }
    
    inputState.lookX = 0;
    inputState.lookY = 0;

    // Movement
    const direction = new THREE.Vector3();
    if (!inputState.paused && !inputState.chatting) {
      const frontVector = new THREE.Vector3(0, 0, -inputState.forward);
      const sideVector = new THREE.Vector3(inputState.right, 0, 0);
      
      direction.addVectors(frontVector, sideVector);
      if (direction.lengthSq() > 0) {
        direction.normalize().multiplyScalar(MOVE_SPEED);
        if (inputState.freecam) {
          direction.applyEuler(camera.rotation); // Move in camera direction (3D)
        } else {
          direction.applyEuler(new THREE.Euler(0, yaw.current, 0)); // Move on ground
        }
      }
    }

    if (inputState.freecam) {
      // Freecam movement (no gravity, no collision)
      const freecamSpeed = MOVE_SPEED * 2;
      position.current.add(direction.clone().multiplyScalar(freecamSpeed * delta / MOVE_SPEED));
      
      // Vertical movement in freecam
      if (inputState.jump) {
        position.current.y += freecamSpeed * delta;
      }
      // We don't have a crouch key yet, but if we did we'd use it for down
      
      camera.position.copy(position.current);
      // Eye level doesn't apply in freecam as we are the drone
    } else {
      // Normal movement
      velocity.current.x = direction.x;
      velocity.current.z = direction.z;

      const currentBlock = world.getBlock(Math.floor(position.current.x), Math.floor(position.current.y), Math.floor(position.current.z));
      const inWater = isWater(currentBlock) || isLava(currentBlock);

      if (inWater) {
        velocity.current.y -= GRAVITY * 0.2 * delta;
        if (inputState.jump && !inputState.paused && !inputState.chatting) {
          velocity.current.y = 4;
        }
      } else {
        if (onGround.current && inputState.jump && !inputState.paused && !inputState.chatting) {
          velocity.current.y = JUMP_FORCE;
        }
        velocity.current.y -= GRAVITY * delta;
      }

      // Apply velocity with collision
      const nextPos = position.current.clone();
      
      // Y collision
      nextPos.y += velocity.current.y * delta;
      if (checkCollision(nextPos)) {
        if (velocity.current.y < 0) {
          onGround.current = true;
        }
        velocity.current.y = 0;
        nextPos.y = position.current.y;
      } else {
        onGround.current = false;
      }

      // X collision
      const testPosX = position.current.clone();
      testPosX.x += velocity.current.x * delta;
      if (checkCollision(testPosX)) {
        velocity.current.x = 0;
      } else {
        nextPos.x += velocity.current.x * delta;
      }

      // Z collision
      const testPosZ = position.current.clone();
      testPosZ.x = nextPos.x;
      testPosZ.z += velocity.current.z * delta;
      if (checkCollision(testPosZ)) {
        velocity.current.z = 0;
      } else {
        nextPos.z += velocity.current.z * delta;
      }

      // Respawn if fallen off
      if (nextPos.y < -20) {
        nextPos.set(8, 40, 8);
        velocity.current.set(0, 0, 0);
      }

      position.current.copy(nextPos);
      camera.position.copy(position.current);
      camera.position.y += PLAYER_HEIGHT; // Eye level
    }

    inputState.jump = false;

    // Update world manager for other components
    world.playerPos = { x: position.current.x, y: position.current.y, z: position.current.z };
    world.playerYaw = yaw.current;
    world.playerPitch = pitch.current;

    // Block interaction
    if ((inputState.actionBreak || inputState.actionPlace) && !inputState.paused && !inputState.chatting) {
      const raycaster = new THREE.Raycaster(camera.position, new THREE.Vector3(0, 0, -1).applyEuler(camera.rotation), 0, 5);
      
      let hit = false;
      let hitPos = new THREE.Vector3();
      let prevPos = new THREE.Vector3();
      
      const step = 0.1;
      for (let d = 0; d <= 5; d += step) {
        const p = camera.position.clone().add(raycaster.ray.direction.clone().multiplyScalar(d));
        const bx = Math.floor(p.x);
        const by = Math.floor(p.y);
        const bz = Math.floor(p.z);
        
        const block = world.getBlock(bx, by, bz);
        if (block !== 0 && !isWater(block) && !isLava(block)) {
          hit = true;
          hitPos.set(bx, by, bz);
          break;
        }
        prevPos.set(bx, by, bz);
      }

      if (hit) {
        if (inputState.actionBreak) {
          const blockId = world.getBlock(hitPos.x, hitPos.y, hitPos.z);
          if (blockId === BLOCKS.TNT) {
            world.setBlock(hitPos.x, hitPos.y, hitPos.z, 0);
            inputState.triggerChunkUpdate(hitPos.x, hitPos.z);
            setTimeout(() => {
              world.explode(hitPos.x, hitPos.y, hitPos.z, 4);
            }, 1500);
          } else {
            world.setBlock(hitPos.x, hitPos.y, hitPos.z, 0);
            inputState.triggerChunkUpdate(hitPos.x, hitPos.z);
          }
        } else if (inputState.actionPlace) {
          world.setBlock(prevPos.x, prevPos.y, prevPos.z, inputState.selectedBlock);
          inputState.triggerChunkUpdate(prevPos.x, prevPos.z);
        }
      }
      
      inputState.actionBreak = false;
      inputState.actionPlace = false;
    }
  });

  return null;
}

function checkCollision(pos: THREE.Vector3) {
  const minX = Math.floor(pos.x - PLAYER_RADIUS);
  const maxX = Math.floor(pos.x + PLAYER_RADIUS);
  const minY = Math.floor(pos.y);
  const maxY = Math.floor(pos.y + PLAYER_HEIGHT);
  const minZ = Math.floor(pos.z - PLAYER_RADIUS);
  const maxZ = Math.floor(pos.z + PLAYER_RADIUS);

  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      for (let z = minZ; z <= maxZ; z++) {
        const block = world.getBlock(x, y, z);
        if (block !== 0 && !isWater(block) && !isLava(block) && !isPlant(block)) {
          return true;
        }
      }
    }
  }
  return false;
}
