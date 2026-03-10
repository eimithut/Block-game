import { Canvas } from '@react-three/fiber';
import { Sky } from '@react-three/drei';
import { Player } from './game/Player';
import { WorldRenderer } from './game/WorldRenderer';
import { Mobs } from './game/Mobs';
import { TouchControls, Hotbar } from './components/TouchControls';
import { useState, useRef, useEffect } from 'react';
import { world } from './game/WorldManager';
import { loadTexturePack } from './game/textures';
import { inputState } from './game/inputState';

export default function App() {
  const [started, setStarted] = useState(false);
  const [loadingPack, setLoadingPack] = useState(false);
  const [defaultPackLoaded, setDefaultPackLoaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
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

  return (
    <div className="w-full h-screen bg-black overflow-hidden relative">
      {!started ? (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-zinc-900 text-white">
          <h1 className="text-5xl font-bold mb-8 font-mono text-green-400">MINECRAFT CLONE</h1>
          <p className="mb-8 text-zinc-400 max-w-md text-center">
            Click/Touch and drag the left side of the screen to move, right side to look around. Use the buttons to jump, place, and break blocks.
          </p>
          <div className="flex flex-col gap-4">
            <button 
              className="px-8 py-4 bg-green-600 hover:bg-green-500 rounded-xl font-bold text-xl transition-colors"
              onClick={() => {
                world.worldType = 'normal';
                world.chunks.clear();
                setStarted(true);
              }}
            >
              PLAY NORMAL WORLD
            </button>
            <button 
              className="px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-xl transition-colors"
              onClick={() => {
                world.worldType = 'debug';
                world.chunks.clear();
                setStarted(true);
              }}
            >
              PLAY DEBUG WORLD
            </button>
            
            <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/10 flex flex-col items-center gap-2">
              <p className="text-sm text-zinc-400">
                {defaultPackLoaded ? 'Default texture pack loaded!' : 'Want real Minecraft textures?'}
              </p>
              <input 
                type="file" 
                accept=".zip" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleTexturePackUpload}
              />
              <button 
                className="px-6 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg font-semibold transition-colors disabled:opacity-50"
                onClick={() => fileInputRef.current?.click()}
                disabled={loadingPack}
              >
                {loadingPack ? 'LOADING...' : 'LOAD CUSTOM TEXTURE PACK (.ZIP)'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <Canvas>
            <Sky sunPosition={[100, 20, 100]} />
            <ambientLight intensity={0.5} />
            <pointLight position={[100, 100, 100]} intensity={0.8} />
            <Player />
            <WorldRenderer />
            <Mobs />
          </Canvas>
          <TouchControls />
          <Hotbar />
        </>
      )}
    </div>
  );
}
