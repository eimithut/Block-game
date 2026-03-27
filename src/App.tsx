import { Canvas, useFrame } from '@react-three/fiber';
import { Player } from './game/Player';
import { PlayerSync } from './game/PlayerSync';
import { PlayerModel } from './game/PlayerModel';
import { WorldRenderer } from './game/WorldRenderer';
import { Mobs } from './game/Mobs';
import { DayNightCycle } from './game/DayNightCycle';
import { TouchControls, Hotbar } from './components/TouchControls';
import { KeyboardControls } from './game/KeyboardControls';
import { RoomUI } from './components/RoomUI';
import { PauseMenu } from './components/PauseMenu';
import { Chat } from './components/Chat';
import { MultiplayerLobby } from './components/MultiplayerLobby';
import { useState, useRef, useEffect } from 'react';
import { LayoutGrid } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { world } from './game/WorldManager';
import { loadTexturePack, loadPublicOverrides, applyTextureOverride } from './game/textures';
import { inputState } from './game/inputState';
import { signIn } from './firebase';

function FreecamBody() {
  const [active, setActive] = useState(inputState.freecam);
  const [skin, setSkin] = useState(inputState.playerSkin);
  const [name, setName] = useState(inputState.playerName);
  
  useFrame(() => {
    if (active !== inputState.freecam) setActive(inputState.freecam);
    if (skin !== inputState.playerSkin) setSkin(inputState.playerSkin);
    if (name !== inputState.playerName) setName(inputState.playerName);
  });

  if (!active) return null;
  const { x, y, z, yaw, pitch } = inputState.freecamOrigin;
  
  return (
    <PlayerModel 
      position={[x, y, z]} 
      yaw={yaw} 
      pitch={pitch} 
      name={name} 
      skinUrl={skin}
      skinColor="#ffcc99"
      frozen={true}
    />
  );
}

export default function App() {
  const [started, setStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [menuState, setMenuState] = useState<'main' | 'multiplayer'>('main');
  const [loadingPack, setLoadingPack] = useState(false);
  const [defaultPackLoaded, setDefaultPackLoaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handlePause = (paused: boolean) => {
      setIsPaused(paused);
      if (paused) {
        document.exitPointerLock?.();
      }
    };
    inputState.pauseCallbacks.add(handlePause);
    return () => { inputState.pauseCallbacks.delete(handlePause); };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && started) {
        if (inputState.chatting || document.activeElement?.tagName === 'INPUT') return;
        inputState.paused = !inputState.paused;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [started]);

  useEffect(() => {
    signIn();
    const loadDefaultPack = async () => {
      try {
        setLoadingPack(true);
        // First check for individual overrides in /public/textures/
        await loadPublicOverrides();
        
        const res = await fetch('https://github.com/eimithut/Block-game/raw/refs/heads/main/public/1.21.10-1.21.9-Template.zip');
        if (res.ok) {
          const blob = await res.blob();
          const file = new File([blob], 'texturepack.zip', { type: 'application/zip' });
          await loadTexturePack(file);
          console.log('Default texture pack loaded successfully');
          setDefaultPackLoaded(true);
        }
      } catch (err) {
        console.log('No default texture pack found at /texturepack.zip');
      } finally {
        setLoadingPack(false);
      }
    };
    loadDefaultPack();
  }, []);

  useEffect(() => {
    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer?.files || []);
      for (const file of files) {
        if (file.name.endsWith('.png')) {
          const name = file.name.replace('.png', '');
          const success = await applyTextureOverride(name, file);
          if (success) {
            console.log(`Applied texture override for ${name} from dropped file`);
          }
        } else if (file.name.endsWith('.zip')) {
          setLoadingPack(true);
          try {
            await loadTexturePack(file);
            alert('Texture pack loaded successfully!');
          } catch (err) {
            console.error(err);
            alert('Failed to load texture pack.');
          }
          setLoadingPack(false);
        }
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    window.addEventListener('drop', handleDrop);
    window.addEventListener('dragover', handleDragOver);
    return () => {
      window.removeEventListener('drop', handleDrop);
      window.removeEventListener('dragover', handleDragOver);
    };
  }, []);

  const handleTexturePackUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setLoadingPack(true);
    try {
      await loadTexturePack(file);
      alert('Texture pack loaded successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to load texture pack. Make sure it is a valid Minecraft Java Edition resource pack (.zip).');
    }
    setLoadingPack(false);
  };

  // A simple dirt-like pattern using CSS gradients
  const dirtBackground = {
    backgroundColor: '#7A5C46',
    backgroundImage: `
      linear-gradient(45deg, #6B4D3A 25%, transparent 25%, transparent 75%, #6B4D3A 75%, #6B4D3A), 
      linear-gradient(45deg, #6B4D3A 25%, transparent 25%, transparent 75%, #6B4D3A 75%, #6B4D3A)
    `,
    backgroundSize: '32px 32px',
    backgroundPosition: '0 0, 16px 16px'
  };

  return (
    <div className="w-full h-screen overflow-hidden relative font-mono selection:bg-black selection:text-white" style={!started ? dirtBackground : { backgroundColor: '#87CEEB' }}>
      <AnimatePresence>
        {(!started || isPaused) && (
          <motion.a
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            href="https://eimithut.pages.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-4 left-4 z-[150] flex items-center gap-2 px-4 py-2 bg-[#C6C6C6] text-black font-bold border-[4px] border-t-white border-l-white border-b-[#555] border-r-[#555] active:border-t-[#555] active:border-l-[#555] active:border-b-white active:border-r-white active:bg-[#A0A0A0] transition-all shadow-[4px_4px_0px_rgba(0,0,0,0.3)] pointer-events-auto"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <LayoutGrid size={20} />
            <span className="hidden md:inline">All Projects</span>
          </motion.a>
        )}
      </AnimatePresence>

      {!started ? (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center text-black bg-black/40">
          <div className="max-w-xl w-full mx-4 flex flex-col items-center">
            <h1 className="text-5xl md:text-6xl font-black mb-12 text-center tracking-tighter text-white" style={{ textShadow: '4px 4px 0 #333, -2px -2px 0 #333, 2px -2px 0 #333, -2px 2px 0 #333, 2px 2px 0 #333' }}>
              MINECRAFT CLONE
            </h1>
            
            {menuState === 'main' ? (
              <div className="flex flex-col gap-4 w-full max-w-sm">
                <button 
                  className="w-full py-3 bg-[#C6C6C6] text-black font-bold text-xl border-[4px] border-t-white border-l-white border-b-[#555] border-r-[#555] active:border-t-[#555] active:border-l-[#555] active:border-b-white active:border-r-white active:bg-[#A0A0A0] transition-all"
                  onClick={() => {
                    world.setRoom(null);
                    world.worldType = 'normal';
                    world.chunks.clear();
                    setStarted(true);
                  }}
                >
                  Singleplayer
                </button>
                <button 
                  className="w-full py-3 bg-[#C6C6C6] text-black font-bold text-xl border-[4px] border-t-white border-l-white border-b-[#555] border-r-[#555] active:border-t-[#555] active:border-l-[#555] active:border-b-white active:border-r-white active:bg-[#A0A0A0] transition-all"
                  onClick={() => setMenuState('multiplayer')}
                >
                  Multiplayer
                </button>
                
                <div className="mt-8 flex flex-col items-center gap-3">
                  <input 
                    type="file" 
                    accept=".zip" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleTexturePackUpload}
                  />
                  <button 
                    className="w-full py-3 bg-[#C6C6C6] text-black font-bold text-xl border-[4px] border-t-white border-l-white border-b-[#555] border-r-[#555] active:border-t-[#555] active:border-l-[#555] active:border-b-white active:border-r-white active:bg-[#A0A0A0] transition-all disabled:opacity-50"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loadingPack}
                  >
                    {loadingPack ? 'Loading...' : 'Texture Packs...'}
                  </button>
                </div>
              </div>
            ) : (
              <MultiplayerLobby 
                onBack={() => setMenuState('main')} 
                onJoin={() => {
                  world.worldType = 'normal';
                  world.chunks.clear();
                  setStarted(true);
                }}
              />
            )}
          </div>
        </div>
      ) : (
        <div 
          className="w-full h-full" 
          onClick={() => {
            if (!inputState.paused && !inputState.chatting) {
              document.body.requestPointerLock?.();
            }
          }}
        >
          <Canvas>
            <DayNightCycle />
            <Player />
            <PlayerSync />
            <FreecamBody />
            <WorldRenderer />
            <Mobs />
          </Canvas>
          <KeyboardControls />
          <TouchControls />
          <Hotbar />
          <RoomUI />
          <Chat />
          {isPaused && (
            <PauseMenu 
              onResume={() => { inputState.paused = false; }} 
              onQuit={() => { 
                inputState.paused = false; 
                setStarted(false); 
                world.setRoom(null); 
              }} 
            />
          )}
        </div>
      )}
    </div>
  );
}
