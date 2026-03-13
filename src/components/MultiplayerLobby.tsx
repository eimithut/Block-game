import { useState, useEffect } from 'react';
import { world } from '../game/WorldManager';
import { db, auth } from '../firebase';
import { collection, onSnapshot, query, setDoc, doc, Timestamp, getDocs, where } from 'firebase/firestore';
import { inputState } from '../game/inputState';

interface RoomData {
  roomId: string;
  name: string;
  hostId: string;
  hostName: string;
  isLocked: boolean;
  password?: string;
  playerCount: number;
  createdAt: string;
}

export function MultiplayerLobby({ onBack, onJoin }: { onBack: () => void, onJoin: () => void }) {
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [showHostModal, setShowHostModal] = useState(false);
  const [serverName, setServerName] = useState(`${inputState.playerName}'s Server`);
  const [isLocked, setIsLocked] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordPrompt, setPasswordPrompt] = useState<{ roomId: string, correctPass: string } | null>(null);
  const [promptInput, setPromptInput] = useState('');
  const [showJoinByCode, setShowJoinByCode] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [lobbyError, setLobbyError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'rooms'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const roomList: RoomData[] = [];
      snapshot.forEach((doc) => {
        roomList.push(doc.data() as RoomData);
      });
      // Sort by creation date
      roomList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setRooms(roomList);
      setLobbyError(null);
    }, (err) => {
      console.error("Lobby Snapshot Error:", err);
      setLobbyError("Failed to load server list. Check your Firebase rules or quota.");
    });
    return () => unsubscribe();
  }, []);

  const handleHost = async () => {
    if (!serverName.trim()) return;
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const roomData: RoomData = {
      roomId,
      name: serverName,
      hostId: auth.currentUser?.uid || 'anonymous',
      hostName: inputState.playerName,
      isLocked,
      password: isLocked ? password : '',
      playerCount: 1,
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'rooms', roomId), roomData);
      world.setRoom(roomId);
      onJoin();
    } catch (err) {
      console.error("Error creating room:", err);
      alert("Failed to create room. " + (err instanceof Error ? err.message : "Check your connection."));
    }
  };

  const handleJoin = (room: RoomData) => {
    if (room.isLocked) {
      setPasswordPrompt({ roomId: room.roomId, correctPass: room.password || '' });
      setPromptInput('');
    } else {
      world.setRoom(room.roomId);
      onJoin();
    }
  };

  const handleManualJoin = () => {
    if (manualCode.trim()) {
      world.setRoom(manualCode.trim().toUpperCase());
      onJoin();
    }
  };

  const verifyPassword = () => {
    if (passwordPrompt && promptInput === passwordPrompt.correctPass) {
      world.setRoom(passwordPrompt.roomId);
      onJoin();
    } else {
      alert("Incorrect password!");
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-2xl bg-black/60 p-6 border-[4px] border-[#555] shadow-[8px_8px_0px_rgba(0,0,0,0.5)]">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-3xl font-black text-white uppercase tracking-tighter" style={{ textShadow: '2px 2px 0 #000' }}>Server List</h2>
        <div className="flex gap-2">
          <button 
            className="px-4 py-2 bg-[#C6C6C6] text-black font-bold border-[3px] border-t-white/50 border-l-white/50 border-b-black/50 border-r-black/50 active:bg-[#A0A0A0]"
            onClick={() => setShowJoinByCode(true)}
          >
            Join by Code
          </button>
          <button 
            className="px-4 py-2 bg-[#4CAF50] text-white font-bold border-[3px] border-t-white/50 border-l-white/50 border-b-black/50 border-r-black/50 active:bg-[#388E3C]"
            onClick={() => setShowHostModal(true)}
          >
            Host Server
          </button>
        </div>
      </div>

      {lobbyError && (
        <div className="bg-red-500/20 border-2 border-red-500 p-3 text-red-200 text-sm font-bold mb-2">
          {lobbyError}
        </div>
      )}

      <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {rooms.length === 0 ? (
          <div className="text-center py-12 text-[#AAA] font-bold italic">No servers online...</div>
        ) : (
          rooms.map((room) => (
            <div key={room.roomId} className="flex items-center justify-between bg-[#C6C6C6] p-3 border-[3px] border-t-white border-l-white border-b-[#555] border-r-[#555]">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-black text-lg">{room.name}</span>
                  {room.isLocked && <span className="text-xs bg-black text-white px-1">LOCKED</span>}
                </div>
                <span className="text-xs text-[#555] font-bold uppercase">Host: {room.hostName} • ID: {room.roomId}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-bold text-sm bg-black/10 px-2 py-1">{room.playerCount} Players</span>
                <button 
                  className="px-6 py-1 bg-[#C6C6C6] text-black font-bold border-[3px] border-t-white border-l-white border-b-[#555] border-r-[#555] active:border-t-[#555] active:border-l-[#555] active:border-b-white active:border-r-white active:bg-[#A0A0A0]"
                  onClick={() => handleJoin(room)}
                >
                  Join
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <button 
        className="w-full mt-4 py-3 bg-[#C6C6C6] text-black font-bold text-xl border-[4px] border-t-white border-l-white border-b-[#555] border-r-[#555] active:border-t-[#555] active:border-l-[#555] active:border-b-white active:border-r-white active:bg-[#A0A0A0]"
        onClick={onBack}
      >
        Back to Menu
      </button>

      {/* Host Modal */}
      {showHostModal && (
        <div className="absolute inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#C6C6C6] p-6 border-[4px] border-t-white border-l-white border-b-[#555] border-r-[#555] w-full max-w-md flex flex-col gap-4">
            <h3 className="text-2xl font-black uppercase text-center">Host New Server</h3>
            
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase">Server Name</label>
              <input 
                type="text" 
                className="w-full bg-black/10 border-[3px] border-t-[#555] border-l-[#555] border-b-white border-r-white p-2 font-bold outline-none focus:bg-white/20"
                value={serverName}
                onChange={(e) => setServerName(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-3 py-2">
              <input 
                type="checkbox" 
                id="locked" 
                className="w-5 h-5 cursor-pointer"
                checked={isLocked}
                onChange={(e) => setIsLocked(e.target.checked)}
              />
              <label htmlFor="locked" className="font-bold uppercase cursor-pointer">Private Server (Password)</label>
            </div>

            {isLocked && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase">Server Password</label>
                <input 
                  type="password" 
                  className="w-full bg-black/10 border-[3px] border-t-[#555] border-l-[#555] border-b-white border-r-white p-2 font-bold outline-none"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            )}

            <div className="flex gap-2 mt-4">
              <button 
                className="flex-1 py-2 bg-[#C6C6C6] text-black font-bold border-[3px] border-t-white border-l-white border-b-[#555] border-r-[#555] active:bg-[#A0A0A0]"
                onClick={() => setShowHostModal(false)}
              >
                Cancel
              </button>
              <button 
                className="flex-1 py-2 bg-[#4CAF50] text-white font-bold border-[3px] border-t-white/50 border-l-white/50 border-b-black/50 border-r-black/50 active:bg-[#388E3C]"
                onClick={handleHost}
              >
                Launch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join by Code Modal */}
      {showJoinByCode && (
        <div className="absolute inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#C6C6C6] p-6 border-[4px] border-t-white border-l-white border-b-[#555] border-r-[#555] w-full max-w-sm flex flex-col gap-4 text-center">
            <h3 className="text-2xl font-black uppercase">Join by Code</h3>
            <p className="text-sm font-bold text-[#555]">Enter the 6-character room code.</p>
            
            <input 
              type="text" 
              className="w-full bg-black/10 border-[3px] border-t-[#555] border-l-[#555] border-b-white border-r-white p-2 font-bold outline-none text-center uppercase"
              autoFocus
              maxLength={6}
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleManualJoin()}
            />

            <div className="flex gap-2 mt-2">
              <button 
                className="flex-1 py-2 bg-[#C6C6C6] text-black font-bold border-[3px] border-t-white border-l-white border-b-[#555] border-r-[#555]"
                onClick={() => setShowJoinByCode(false)}
              >
                Cancel
              </button>
              <button 
                className="flex-1 py-2 bg-[#4CAF50] text-white font-bold border-[3px] border-t-white/50 border-l-white/50 border-b-black/50 border-r-black/50"
                onClick={handleManualJoin}
              >
                Join
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Prompt */}
      {passwordPrompt && (
        <div className="absolute inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#C6C6C6] p-6 border-[4px] border-t-white border-l-white border-b-[#555] border-r-[#555] w-full max-w-sm flex flex-col gap-4 text-center">
            <h3 className="text-2xl font-black uppercase">Enter Password</h3>
            <p className="text-sm font-bold text-[#555]">This server is private.</p>
            
            <input 
              type="password" 
              className="w-full bg-black/10 border-[3px] border-t-[#555] border-l-[#555] border-b-white border-r-white p-2 font-bold outline-none text-center"
              autoFocus
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && verifyPassword()}
            />

            <div className="flex gap-2 mt-2">
              <button 
                className="flex-1 py-2 bg-[#C6C6C6] text-black font-bold border-[3px] border-t-white border-l-white border-b-[#555] border-r-[#555]"
                onClick={() => setPasswordPrompt(null)}
              >
                Cancel
              </button>
              <button 
                className="flex-1 py-2 bg-[#4CAF50] text-white font-bold border-[3px] border-t-white/50 border-l-white/50 border-b-black/50 border-r-black/50"
                onClick={verifyPassword}
              >
                Join
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
