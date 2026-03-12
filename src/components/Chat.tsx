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
      if (e.key === 't' && !isTyping && !inputState.paused) {
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
    if (!inputText.trim() || !world.roomId || !auth.currentUser) return;

    const text = inputText.trim();
    setInputText('');
    setIsTyping(false);
    inputState.chatting = false;

    try {
      await addDoc(collection(db, 'rooms', world.roomId, 'chat'), {
        text,
        sender: auth.currentUser.displayName || 'Player',
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (!world.roomId) return null;

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
