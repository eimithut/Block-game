import { useState, useEffect, useRef } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { world } from '../game/WorldManager';
import { inputState } from '../game/inputState';

interface ChatMessage {
  id: string;
  text: string;
  sender: string;
  timestamp: any;
}

export function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!world.roomId) return;

    const q = query(
      collection(db, 'rooms', world.roomId, 'chat'),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        newMessages.push({ id: doc.id, ...doc.data() } as ChatMessage);
      });
      setMessages(newMessages.reverse());
    });

    return () => unsubscribe();
  }, [world.roomId]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 't' || e.key === 'Enter') && !isTyping && !inputState.paused) {
        e.preventDefault();
        setIsTyping(true);
        inputState.chatting = true; // Pause game input while typing
      } else if (e.key === 'Escape' && isTyping) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        setIsTyping(false);
        inputState.chatting = false;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTyping]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const text = inputText.trim();
    setInputText('');
    setIsTyping(false);
    inputState.chatting = false;

    // Handle commands
    if (text.startsWith('/')) {
      const parts = text.slice(1).split(' ');
      const cmd = parts[0].toLowerCase();
      const args = parts.slice(1);

      const addSystemMessage = (msg: string) => {
        setMessages(prev => [...prev, {
          id: 'system-' + Date.now(),
          text: msg,
          sender: 'System',
          timestamp: null
        }]);
      };

      switch (cmd) {
        case 'freecam':
          inputState.freecam = !inputState.freecam;
          if (inputState.freecam) {
            // Store current position as origin
            const pos = world.playerPos || { x: 0, y: 0, z: 0 };
            inputState.freecamOrigin = { 
              x: pos.x, 
              y: pos.y, 
              z: pos.z,
              yaw: world.playerYaw || 0,
              pitch: world.playerPitch || 0
            };
            addSystemMessage('Freecam enabled. Your body stays here.');
          } else {
            addSystemMessage('Freecam disabled.');
          }
          return;

        case 'tp':
          if (args.length === 3) {
            const x = parseFloat(args[0]);
            const y = parseFloat(args[1]);
            const z = parseFloat(args[2]);
            if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
              window.dispatchEvent(new CustomEvent('teleport', { detail: { x, y, z } }));
              addSystemMessage(`Teleported to ${x}, ${y}, ${z}`);
            }
          } else {
            addSystemMessage('Usage: /tp <x> <y> <z>');
          }
          return;

        case 'time':
          if (args[0] === 'set') {
            const val = args[1];
            if (val === 'day') {
              window.dispatchEvent(new CustomEvent('settime', { detail: 6000 }));
              addSystemMessage('Time set to day');
            } else if (val === 'night') {
              window.dispatchEvent(new CustomEvent('settime', { detail: 18000 }));
              addSystemMessage('Time set to night');
            } else if (!isNaN(parseInt(val))) {
              window.dispatchEvent(new CustomEvent('settime', { detail: parseInt(val) }));
              addSystemMessage(`Time set to ${val}`);
            }
          } else {
            addSystemMessage('Usage: /time set <day|night|number>');
          }
          return;

        case 'help':
          addSystemMessage('Commands: /freecam, /tp <x y z>, /time set <day|night|val>, /clear, /help');
          return;

        case 'clear':
          setMessages([]);
          return;

        default:
          addSystemMessage(`Unknown command: /${cmd}`);
          return;
      }
    }

    if (world.roomId && auth.currentUser) {
      try {
        await addDoc(collection(db, 'rooms', world.roomId, 'chat'), {
          text,
          sender: auth.currentUser.displayName || 'Player',
          timestamp: serverTimestamp(),
        });
      } catch (error) {
        console.error('Error sending message:', error);
      }
    } else {
      // Local echo for singleplayer commands or if not logged in
      setMessages(prev => [...prev.slice(-49), {
        id: 'local-' + Date.now(),
        text,
        sender: inputState.playerName || 'Player',
        timestamp: null
      }]);
    }
  };

  return (
    <div className="absolute bottom-20 left-4 z-[60] w-80 font-mono pointer-events-none">
      <div className="flex flex-col gap-1 mb-2 max-h-48 overflow-y-auto" style={{ textShadow: '1px 1px 0 #000' }}>
        {messages.map((msg) => (
          <div key={msg.id} className="text-white text-sm bg-black/30 px-2 py-1 rounded">
            <span className="text-yellow-300">&lt;{msg.sender}&gt;</span> {msg.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {isTyping && (
        <form onSubmit={sendMessage} className="pointer-events-auto">
          <input
            type="text"
            value={inputText || ''}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full bg-black/50 text-white border-2 border-white/50 p-2 outline-none focus:border-white"
            placeholder="Type a message..."
            autoFocus
            onBlur={() => {
              setIsTyping(false);
              inputState.chatting = false;
            }}
          />
        </form>
      )}
    </div>
  );
}
