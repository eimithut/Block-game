import { useState } from 'react';
import { world } from '../game/WorldManager';

export function RoomUI() {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [joinId, setJoinId] = useState('');

  const createRoom = () => {
    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    world.setRoom(newRoomId);
    setRoomId(newRoomId);
  };

  const joinRoom = () => {
    if (joinId) {
      world.setRoom(joinId);
      setRoomId(joinId);
    }
  };

  return (
    <div className="absolute top-4 right-4 z-50 flex flex-col gap-2">
      {roomId ? (
        <div className="bg-zinc-800 text-white p-4 rounded-xl border border-white/10">
          <p className="text-sm text-zinc-400">Room Code:</p>
          <p className="text-2xl font-mono font-bold text-green-400">{roomId}</p>
        </div>
      ) : (
        <div className="bg-zinc-800 text-white p-4 rounded-xl border border-white/10 flex flex-col gap-2">
          <button 
            className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg font-bold"
            onClick={createRoom}
          >
            Create Room
          </button>
          <div className="flex gap-2">
            <input 
              type="text" 
              className="bg-zinc-700 px-2 py-1 rounded-lg w-24"
              placeholder="Room Code"
              value={joinId}
              onChange={(e) => setJoinId(e.target.value.toUpperCase())}
            />
            <button 
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold"
              onClick={joinRoom}
            >
              Join
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
