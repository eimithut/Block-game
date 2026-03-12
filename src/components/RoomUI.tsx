import { useState, useEffect } from 'react';
import { world } from '../game/WorldManager';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../firebase';

export function RoomUI() {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [joinId, setJoinId] = useState('');
  const [playerCount, setPlayerCount] = useState(0);

  useEffect(() => {
    if (!roomId) {
      setPlayerCount(0);
      return;
    }
    const q = query(collection(db, 'rooms', roomId, 'players'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPlayerCount(snapshot.size);
    });
    return () => unsubscribe();
  }, [roomId]);

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

  if (!roomId) return null;

  return (
    <div className="absolute top-4 right-4 z-50 flex flex-col gap-2 font-mono">
      <div className="bg-[#C6C6C6] text-black p-4 border-[4px] border-t-white border-l-white border-b-[#555] border-r-[#555] shadow-[4px_4px_0px_rgba(0,0,0,1)]">
        <p className="text-xs font-bold uppercase mb-1">Room Code:</p>
        <div className="flex items-center justify-between gap-6">
          <p className="text-2xl font-black text-black">{roomId}</p>
          <div className="flex items-center gap-2 bg-black px-3 py-1 border-2 border-[#555]">
            <div className="w-3 h-3 bg-[#4CAF50] border-2 border-white animate-pulse"></div>
            <span className="text-sm font-bold text-white uppercase">{playerCount} Player{playerCount !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
