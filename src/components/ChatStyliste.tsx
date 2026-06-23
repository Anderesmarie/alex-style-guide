import { useState, useEffect, useRef } from 'react';
import { X, Send, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ChatStylisteProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Product {
  title: string;
  price: string;
  link: string;
  thumbnail: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  quotaExceeded?: boolean;
  products?: Product[];
}


const WELCOME: ChatMessage = {
  role: 'assistant',
  content: "Coucou ! 👋 Pose-moi tes questions mode, je connais ta garde-robe !",
};

export default function ChatStyliste({ isOpen, onClose }: ChatStylisteProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  if (!isOpen) return null;

  const handleSend = async () => {
    const message = input.trim();
    if (!message || loading) return;
    setMessages((prev) => [...prev, { role: 'user', content: message }]);
    setInput('');
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('chat-styliste', {
        body: { message },
      });
      if (error) {
        const ctx: any = (error as any).context;
        const status = ctx?.status ?? (error as any).status;
        if (status === 403) {
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content:
                "Tu as atteint ta limite de 3 messages gratuits aujourd'hui ! Passe en Premium pour un accès illimité ✨",
              quotaExceeded: true,
            },
          ]);
          setRemaining(0);
        } else {
          throw error;
        }
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
        if (typeof data.messages_remaining === 'number') {
          setRemaining(data.messages_remaining);
        }
      }
    } catch (e) {
      console.error(e);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: "Oups, un souci est survenu, réessaie 🙏" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-t-2xl shadow-2xl flex flex-col h-[80vh] animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
          <h2 className="text-lg font-serif font-bold text-gray-900">✨ Ta styliste</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto flex flex-col gap-3 p-4"
        >
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className="max-w-[80%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap break-words"
                style={
                  m.role === 'user'
                    ? { backgroundColor: '#C9956C', color: '#fff' }
                    : { backgroundColor: '#F5F5F5', color: '#333' }
                }
              >
                {m.content}
                {m.quotaExceeded && (
                  <button
                    className="mt-3 block w-full py-2 px-3 rounded-lg text-white text-sm font-semibold"
                    style={{ backgroundColor: '#C9956C' }}
                  >
                    Découvrir Premium
                  </button>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div
                className="rounded-2xl px-4 py-3 flex gap-1"
                style={{ backgroundColor: '#F5F5F5' }}
              >
                <span className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-gray-100 p-3 pb-5 shrink-0">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              disabled={loading}
              placeholder="Écris ton message..."
              className="flex-1 px-4 py-2 rounded-full bg-gray-100 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 disabled:opacity-60"
              style={{ '--tw-ring-color': '#C9956C' } as React.CSSProperties}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="w-10 h-10 rounded-full flex items-center justify-center text-white disabled:opacity-50 transition-transform active:scale-95"
              style={{ backgroundColor: '#C9956C' }}
              aria-label="Envoyer"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          {remaining !== null && remaining !== -1 && (
            <p className="text-xs text-gray-400 text-center mt-2">
              {remaining} message{remaining > 1 ? 's' : ''} gratuit{remaining > 1 ? 's' : ''} restant{remaining > 1 ? 's' : ''} aujourd'hui
            </p>
          )}
          {remaining === -1 && (
            <p className="text-xs text-center mt-2" style={{ color: '#C9956C' }}>
              Accès illimité ✨
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
