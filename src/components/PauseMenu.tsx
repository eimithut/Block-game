import { useState, useRef } from 'react';
import { world } from '../game/WorldManager';
import { inputState } from '../game/inputState';

interface PauseMenuProps {
  onResume: () => void;
  onQuit: () => void;
}

export const settings = {
  sensitivity: 0.003,
  renderDistance: 4,
};

export function PauseMenu({ onResume, onQuit }: PauseMenuProps) {
  const [sens, setSens] = useState(settings.sensitivity || 0.003);
  const [renderDist, setRenderDist] = useState(settings.renderDistance || 4);
  const [name, setName] = useState(inputState.playerName || 'Player');
  const [mcUsername, setMcUsername] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSensChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) {
      setSens(val);
      settings.sensitivity = val;
    }
  };

  const handleRenderDistChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    if (!isNaN(val)) {
      setRenderDist(val);
      settings.renderDistance = val;
      world.renderDistance = val;
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    inputState.playerName = e.target.value;
  };

  const handleSkinUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        inputState.playerSkin = base64;
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black/60 font-mono">
      <div className="w-full max-w-md flex flex-col gap-4 bg-[#C6C6C6] p-8 border-[4px] border-t-white border-l-white border-b-[#555] border-r-[#555] overflow-y-auto max-h-[90vh]">
        <h2 className="text-4xl font-black text-black text-center mb-2">
          Game Paused
        </h2>

        {world.roomId && (
          <div className="bg-black/20 p-2 rounded text-center mb-2">
            <p className="text-black font-bold text-sm">JOIN CODE</p>
            <p className="text-black font-black text-2xl tracking-widest">{world.roomId}</p>
          </div>
        )}
        
        <div className="flex flex-col gap-2 mb-2">
          <label className="text-black font-bold">Player Name</label>
          <input 
            type="text" 
            value={name} 
            onChange={handleNameChange}
            className="w-full bg-black/10 border-2 border-black/20 p-2 text-black font-bold outline-none focus:border-black/40"
            placeholder="Enter name..."
          />
        </div>

        <div className="flex flex-col gap-2 mb-2">
          <label className="text-black font-bold">Minecraft Username (Skin)</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={mcUsername} 
              onChange={(e) => setMcUsername(e.target.value)}
              className="flex-1 bg-black/10 border-2 border-black/20 p-2 text-black font-bold outline-none focus:border-black/40"
              placeholder="Username..."
            />
            <button 
              className="px-4 py-2 bg-[#A0A0A0] text-black font-bold border-[2px] border-t-white border-l-white border-b-[#555] border-r-[#555] active:bg-[#888]"
              onClick={() => {
                if (mcUsername) {
                  inputState.playerSkin = `https://crafatar.com/skins/${mcUsername}`;
                }
              }}
            >
              Fetch
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2 mb-2">
          <label className="text-black font-bold">Player Skin (.png)</label>
          <input 
            type="file" 
            accept="image/png" 
            ref={fileInputRef}
            onChange={handleSkinUpload}
            className="hidden"
          />
          <button 
            className="w-full py-2 bg-[#A0A0A0] text-black font-bold border-[2px] border-t-white border-l-white border-b-[#555] border-r-[#555] active:bg-[#888]"
            onClick={() => fileInputRef.current?.click()}
          >
            Upload Skin
          </button>
        </div>

        <div className="flex flex-col gap-2 mb-2">
          <label className="text-black font-bold">Sensitivity: {((sens ?? settings.sensitivity) * 1000).toFixed(0)}</label>
          <input 
            type="range" 
            min="0.001" max="0.01" step="0.001" 
            value={sens || 0.003} 
            onChange={handleSensChange}
            className="w-full"
          />
        </div>

        <div className="flex flex-col gap-2 mb-4">
          <label className="text-black font-bold">Render Distance: {renderDist ?? settings.renderDistance} chunks</label>
          <input 
            type="range" 
            min="2" max="8" step="1" 
            value={renderDist || 4} 
            onChange={handleRenderDistChange}
            className="w-full"
          />
        </div>

        <button 
          className="w-full py-4 bg-[#C6C6C6] text-black font-bold text-xl border-[4px] border-t-white border-l-white border-b-[#555] border-r-[#555] active:border-t-[#555] active:border-l-[#555] active:border-b-white active:border-r-white active:bg-[#A0A0A0] transition-all"
          onClick={onResume}
        >
          Back to Game
        </button>

        <button 
          className="w-full py-4 bg-[#C6C6C6] text-black font-bold text-xl border-[4px] border-t-white border-l-white border-b-[#555] border-r-[#555] active:border-t-[#555] active:border-l-[#555] active:border-b-white active:border-r-white active:bg-[#A0A0A0] transition-all"
          onClick={onQuit}
        >
          Save and Quit to Title
        </button>
      </div>
    </div>
  );
}
