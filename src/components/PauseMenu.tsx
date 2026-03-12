import { useState } from 'react';
import { world } from '../game/WorldManager';

interface PauseMenuProps {
  onResume: () => void;
  onQuit: () => void;
}

export const settings = {
  sensitivity: 0.003,
  renderDistance: 4,
};

export function PauseMenu({ onResume, onQuit }: PauseMenuProps) {
  const [sens, setSens] = useState(settings.sensitivity);
  const [renderDist, setRenderDist] = useState(settings.renderDistance);

  const handleSensChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setSens(val);
    settings.sensitivity = val;
  };

  const handleRenderDistChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setRenderDist(val);
    settings.renderDistance = val;
    world.renderDistance = val;
  };

  return (
    <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black/60 font-mono">
      <div className="w-full max-w-md flex flex-col gap-4 bg-[#C6C6C6] p-8 border-[4px] border-t-white border-l-white border-b-[#555] border-r-[#555]">
        <h2 className="text-4xl font-black text-black text-center mb-4">
          Game Paused
        </h2>
        
        <div className="flex flex-col gap-2 mb-4">
          <label className="text-black font-bold">Sensitivity: {(sens * 1000).toFixed(0)}</label>
          <input 
            type="range" 
            min="0.001" max="0.01" step="0.001" 
            value={sens} 
            onChange={handleSensChange}
            className="w-full"
          />
        </div>

        <div className="flex flex-col gap-2 mb-8">
          <label className="text-black font-bold">Render Distance: {renderDist} chunks</label>
          <input 
            type="range" 
            min="2" max="8" step="1" 
            value={renderDist} 
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
