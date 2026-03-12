import { useEffect, useRef, useState } from 'react';
import { inputState } from '../game/inputState';
import { BLOCKS } from '../game/textures';

export function Inventory({ onSelect, onClose }: { onSelect: (id: number) => void, onClose: () => void }) {
  const blocks = Object.entries(BLOCKS).filter(([name, id]) => id > 0);
  return (
    <div className="absolute inset-0 z-50 bg-black/90 flex flex-col p-4 md:p-8 pointer-events-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-white text-2xl font-bold">Inventory</h2>
        <button className="text-white text-3xl font-bold w-12 h-12 flex items-center justify-center bg-white/10 rounded-full" onClick={onClose}>×</button>
      </div>
      <div className="flex-1 overflow-y-auto grid grid-cols-4 sm:grid-cols-6 md:grid-cols-10 gap-2 content-start">
        {blocks.map(([name, id]) => (
          <button
            key={id}
            className="aspect-square bg-white/10 border border-white/30 rounded flex items-center justify-center text-[10px] sm:text-xs text-white text-center break-words p-1 hover:bg-white/30 active:bg-white/50"
            onClick={() => { onSelect(id); onClose(); }}
          >
            {name.replace(/_/g, ' ')}
          </button>
        ))}
      </div>
    </div>
  );
}

export function TouchControls() {
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
  const joystickCenter = useRef({ x: 0, y: 0 });
  const joystickActive = useRef(false);
  const joystickTouchId = useRef<number | null>(null);

  const lookTouchId = useRef<number | null>(null);
  const lastLookPos = useRef({ x: 0, y: 0 });
  const [showInventory, setShowInventory] = useState(false);

  useEffect(() => {
    const preventDefault = (e: TouchEvent) => e.preventDefault();
    document.addEventListener('touchmove', preventDefault, { passive: false });
    return () => document.removeEventListener('touchmove', preventDefault);
  }, []);

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    const touches = 'changedTouches' in e ? Array.from(e.changedTouches) : [{ identifier: 'mouse', clientX: e.clientX, clientY: e.clientY }];
    
    for (let i = 0; i < touches.length; i++) {
      const touch = touches[i];
      
      if (touch.clientX < window.innerWidth / 2 && !joystickActive.current) {
        joystickActive.current = true;
        joystickTouchId.current = touch.identifier as any;
        joystickCenter.current = { x: touch.clientX, y: touch.clientY };
        setJoystickPos({ x: 0, y: 0 });
      } 
      else if (touch.clientX >= window.innerWidth / 2 && lookTouchId.current === null) {
        lookTouchId.current = touch.identifier as any;
        lastLookPos.current = { x: touch.clientX, y: touch.clientY };
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    const touches = 'changedTouches' in e ? Array.from(e.changedTouches) : [{ identifier: 'mouse', clientX: e.clientX, clientY: e.clientY }];
    
    for (let i = 0; i < touches.length; i++) {
      const touch = touches[i];
      
      if (touch.identifier === joystickTouchId.current) {
        const dx = touch.clientX - joystickCenter.current.x;
        const dy = touch.clientY - joystickCenter.current.y;
        const distance = Math.min(50, Math.sqrt(dx * dx + dy * dy));
        const angle = Math.atan2(dy, dx);
        
        const nx = Math.cos(angle) * distance;
        const ny = Math.sin(angle) * distance;
        
        setJoystickPos({ x: nx, y: ny });
        
        inputState.right = nx / 50;
        inputState.forward = -ny / 50;
      }
      
      if (touch.identifier === lookTouchId.current) {
        const dx = touch.clientX - lastLookPos.current.x;
        const dy = touch.clientY - lastLookPos.current.y;
        
        inputState.lookX += dx;
        inputState.lookY += dy;
        
        lastLookPos.current = { x: touch.clientX, y: touch.clientY };
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent | React.MouseEvent) => {
    const touches = 'changedTouches' in e ? Array.from(e.changedTouches) : [{ identifier: 'mouse' }];
    
    for (let i = 0; i < touches.length; i++) {
      const touch = touches[i];
      
      if (touch.identifier === joystickTouchId.current) {
        joystickActive.current = false;
        joystickTouchId.current = null;
        setJoystickPos({ x: 0, y: 0 });
        inputState.right = 0;
        inputState.forward = 0;
      }
      
      if (touch.identifier === lookTouchId.current) {
        lookTouchId.current = null;
      }
    }
  };

  return (
    <div 
      className="absolute inset-0 z-10 touch-none font-mono"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseMove={(e) => {
        if (e.buttons > 0) handleTouchMove(e);
      }}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
    >
      {/* Crosshair */}
      <div className="absolute top-1/2 left-1/2 w-6 h-6 -translate-x-1/2 -translate-y-1/2 pointer-events-none mix-blend-difference opacity-80">
        <div className="absolute top-1/2 left-0 w-full h-[2px] -translate-y-1/2 bg-white"></div>
        <div className="absolute left-1/2 top-0 w-[2px] h-full -translate-x-1/2 bg-white"></div>
      </div>

      <button 
        className="absolute top-4 left-4 z-50 w-12 h-12 bg-[#C6C6C6] border-[4px] border-t-white border-l-white border-b-[#555] border-r-[#555] text-black font-black shadow-[4px_4px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 pointer-events-auto flex items-center justify-center"
        onClick={() => { inputState.paused = true; }}
        onTouchStart={(e) => { e.stopPropagation(); inputState.paused = true; }}
        onMouseDown={(e) => { e.stopPropagation(); inputState.paused = true; }}
      >
        ||
      </button>

      <button 
        className="absolute top-4 left-20 z-50 w-12 h-12 bg-[#C6C6C6] border-[4px] border-t-white border-l-white border-b-[#555] border-r-[#555] text-black font-black shadow-[4px_4px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 pointer-events-auto flex items-center justify-center"
        onClick={() => { 
          window.dispatchEvent(new KeyboardEvent('keydown', { key: 't' }));
        }}
        onTouchStart={(e) => { 
          e.stopPropagation(); 
          window.dispatchEvent(new KeyboardEvent('keydown', { key: 't' }));
        }}
        onMouseDown={(e) => { 
          e.stopPropagation(); 
          window.dispatchEvent(new KeyboardEvent('keydown', { key: 't' }));
        }}
      >
        T
      </button>

      {/* Joystick Visual */}
      {joystickActive.current && (
        <div 
          className="absolute w-24 h-24 rounded-full border-4 border-white/50 bg-black/20 pointer-events-none"
          style={{
            left: joystickCenter.current.x - 48,
            top: joystickCenter.current.y - 48,
          }}
        >
          <div 
            className="absolute w-12 h-12 rounded-full bg-white/50 border-2 border-white"
            style={{
              left: 24 + joystickPos.x - 24,
              top: 24 + joystickPos.y - 24,
            }}
          />
        </div>
      )}

      {/* Action Buttons */}
      {showInventory && <Inventory onSelect={(id) => { inputState.selectedBlock = id; }} onClose={() => setShowInventory(false)} />}
      
      <div className="absolute bottom-24 right-8 flex flex-col gap-4 pointer-events-auto">
        <button 
          className="w-16 h-16 bg-[#2196F3] border-[4px] border-t-[#64B5F6] border-l-[#64B5F6] border-b-[#1565C0] border-r-[#1565C0] text-white font-black shadow-[4px_4px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1"
          onClick={() => setShowInventory(true)}
          onTouchStart={(e) => { e.stopPropagation(); setShowInventory(true); }}
          onMouseDown={(e) => { e.stopPropagation(); setShowInventory(true); }}
        >
          INV
        </button>
        <button 
          className="w-16 h-16 bg-[#A0A0A0] border-[4px] border-t-white border-l-white border-b-[#555] border-r-[#555] text-black font-black shadow-[4px_4px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1"
          onTouchStart={(e) => { e.stopPropagation(); inputState.jump = true; }}
          onMouseDown={(e) => { e.stopPropagation(); inputState.jump = true; }}
        >
          JUMP
        </button>
        <div className="flex gap-4">
          <button 
            className="w-16 h-16 bg-[#F44336] border-[4px] border-t-[#E57373] border-l-[#E57373] border-b-[#C62828] border-r-[#C62828] text-white font-black shadow-[4px_4px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1"
            onTouchStart={(e) => { e.stopPropagation(); inputState.actionBreak = true; }}
            onMouseDown={(e) => { e.stopPropagation(); inputState.actionBreak = true; }}
          >
            BRK
          </button>
          <button 
            className="w-16 h-16 bg-[#4CAF50] border-[4px] border-t-[#81C784] border-l-[#81C784] border-b-[#2E7D32] border-r-[#2E7D32] text-white font-black shadow-[4px_4px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1"
            onTouchStart={(e) => { e.stopPropagation(); inputState.actionPlace = true; }}
            onMouseDown={(e) => { e.stopPropagation(); inputState.actionPlace = true; }}
          >
            PLC
          </button>
        </div>
      </div>

      {/* Hotbar */}
      <Hotbar />
    </div>
  );
}

export function Hotbar() {
  const [selected, setSelected] = useState(inputState.selectedBlock);
  
  // Update selected when it changes externally (from inventory)
  useEffect(() => {
    const interval = setInterval(() => {
      if (inputState.selectedBlock !== selected) {
        setSelected(inputState.selectedBlock);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [selected]);

  const blocks = [
    { id: BLOCKS.DIRT, color: '#654321', name: 'Dirt' },
    { id: BLOCKS.GRASS_BLOCK, color: '#44aa44', name: 'Grass' },
    { id: BLOCKS.STONE, color: '#888888', name: 'Stone' },
    { id: BLOCKS.OAK_LOG, color: '#5c4033', name: 'Wood' },
    { id: BLOCKS.OAK_LEAVES, color: '#228b22', name: 'Leaves' },
    { id: BLOCKS.OAK_PLANKS, color: '#cd853f', name: 'Planks' },
    { id: BLOCKS.GLASS, color: '#aaddff', name: 'Glass' },
    { id: BLOCKS.TNT, color: '#db3725', name: 'TNT' },
  ];

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-1 p-2 bg-[#C6C6C6] border-[4px] border-t-white border-l-white border-b-[#555] border-r-[#555] shadow-[4px_4px_0px_rgba(0,0,0,1)] pointer-events-auto">
      {blocks.map(b => (
        <button
          key={b.id}
          className={`w-10 h-10 md:w-12 md:h-12 border-[4px] transition-all relative ${selected === b.id ? 'border-white shadow-[0_0_0_2px_#000]' : 'border-t-[#555] border-l-[#555] border-b-white border-r-white'}`}
          style={{ backgroundColor: b.color }}
          onClick={() => {
            inputState.selectedBlock = b.id;
            setSelected(b.id);
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
            inputState.selectedBlock = b.id;
            setSelected(b.id);
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            inputState.selectedBlock = b.id;
            setSelected(b.id);
          }}
        />
      ))}
    </div>
  );
}
