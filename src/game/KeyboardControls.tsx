import { useEffect } from 'react';
import { inputState } from './inputState';
import { BLOCKS } from './textures';

export function KeyboardControls() {
  useEffect(() => {
    const keys: Record<string, boolean> = {};

    const handleKeyDown = (e: KeyboardEvent) => {
      if (inputState.chatting || document.activeElement?.tagName === 'INPUT') return;
      
      keys[e.code] = true;
      
      // Hotbar selection
      if (e.code.startsWith('Digit')) {
        const digit = parseInt(e.code.replace('Digit', ''));
        if (digit >= 1 && digit <= 8) {
          const blocks = [
            BLOCKS.DIRT,
            BLOCKS.GRASS_BLOCK,
            BLOCKS.STONE,
            BLOCKS.OAK_LOG,
            BLOCKS.OAK_LEAVES,
            BLOCKS.OAK_PLANKS,
            BLOCKS.GLASS,
            BLOCKS.TNT,
          ];
          inputState.selectedBlock = blocks[digit - 1];
        }
      }

      if (e.code === 'KeyE') {
        // Toggle inventory logic could go here if needed
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.code] = false;
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (inputState.paused || inputState.chatting) return;
      
      if (e.button === 0) { // Left click
        inputState.actionBreak = true;
      } else if (e.button === 2) { // Right click
        inputState.actionPlace = true;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement && !inputState.paused && !inputState.chatting) {
        inputState.lookX += e.movementX;
        inputState.lookY += e.movementY;
      }
    };

    const updateInput = () => {
      if (inputState.paused || inputState.chatting) {
        inputState.forward = 0;
        inputState.right = 0;
        inputState.jump = false;
        return;
      }

      let f = 0;
      let r = 0;

      if (keys['KeyW'] || keys['ArrowUp']) f += 1;
      if (keys['KeyS'] || keys['ArrowDown']) f -= 1;
      if (keys['KeyA'] || keys['ArrowLeft']) r -= 1;
      if (keys['KeyD'] || keys['ArrowRight']) r += 1;

      inputState.forward = f;
      inputState.right = r;
      
      if (keys['Space']) {
        inputState.jump = true;
      }
    };

    const interval = setInterval(updateInput, 1000 / 60);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    
    // Prevent context menu on right click
    const preventContext = (e: MouseEvent) => e.preventDefault();
    window.addEventListener('contextmenu', preventContext);

    return () => {
      clearInterval(interval);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('contextmenu', preventContext);
    };
  }, []);

  return null;
}
