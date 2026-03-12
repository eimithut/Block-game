import { Canvas } from '@react-three/fiber';
import { Player } from './game/Player';
import { PlayerSync } from './game/PlayerSync';
import { WorldRenderer } from './game/WorldRenderer';
import { Mobs } from './game/Mobs';
import { DayNightCycle } from './game/DayNightCycle';
import { TouchControls, Hotbar } from './components/TouchControls';
import { RoomUI } from './components/RoomUI';
import { PauseMenu } from './components/PauseMenu';
import { Chat } from './components/Chat';
import { useState, useRef, useEffect } from 'react';
import { world } from './game/WorldManager';
import { loadTexturePack } from './game/textures';
import { inputState } from './game/inputState';
import { signIn } from './firebase';

export default function App() {
  const [started, setStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [menuState, setMenuState] = useState<'main' | 'multiplayer'>('main');
  const [joinId, setJoinId] = useState('');
  const [loadingPack, setLoadingPack] = useState(false);
  const [defaultPackLoaded, setDefaultPackLoaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handlePause = (paused: boolean) => setIsPaused(paused);
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

  const createRoom = () => {
    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    world.setRoom(newRoomId);
    world.worldType = 'normal';
    world.chunks.clear();
    setStarted(true);
  };

  const joinRoom = () => {
    if (joinId) {
      world.setRoom(joinId);
      world.worldType = 'normal';
      world.chunks.clear();
      setStarted(true);
    }
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
              <div className="flex flex-col gap-4 w-full max-w-sm">
                <h2 className="text-2xl font-bold text-white text-center mb-4" style={{ textShadow: '2px 2px 0 #333' }}>Play Multiplayer</h2>
                
                <button 
                  className="w-full py-3 bg-[#C6C6C6] text-black font-bold text-xl border-[4px] border-t-white border-l-white border-b-[#555] border-r-[#555] active:border-t-[#555] active:border-l-[#555] active:border-b-white active:border-r-white active:bg-[#A0A0A0] transition-all"
                  onClick={createRoom}
                >
                  Create New Room
                </button>

                <div className="flex gap-2 mt-4">
                  <input 
                    type="text" 
                    className="flex-1 bg-black/50 border-[4px] border-t-[#555] border-l-[#555] border-b-white border-r-white px-3 py-2 font-bold text-white outline-none focus:bg-black/70 uppercase"
                    placeholder="ROOM CODE"
                    value={joinId}
                    onChange={(e) => setJoinId(e.target.value.toUpperCase())}
                  />
                  <button 
                    className="px-6 py-2 bg-[#C6C6C6] text-black font-bold text-lg border-[4px] border-t-white border-l-white border-b-[#555] border-r-[#555] active:border-t-[#555] active:border-l-[#555] active:border-b-white active:border-r-white active:bg-[#A0A0A0] transition-all"
                    onClick={joinRoom}
                  >
                    Join
                  </button>
                </div>

                <button 
                  className="w-full mt-8 py-3 bg-[#C6C6C6] text-black font-bold text-xl border-[4px] border-t-white border-l-white border-b-[#555] border-r-[#555] active:border-t-[#555] active:border-l-[#555] active:border-b-white active:border-r-white active:bg-[#A0A0A0] transition-all"
                  onClick={() => setMenuState('main')}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          <Canvas>
            <DayNightCycle />
            <Player />
            <PlayerSync />
            <WorldRenderer />
            <Mobs />
          </Canvas>
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
        </>
      )}
    </div>
  );
}
