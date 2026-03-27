'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Direction, RefinementMessage, DirectionImage } from '@/types';
import Lightbox from './Lightbox';

interface RefinementChatProps {
  direction: Direction;
  onBack: () => void;
}

export default function RefinementChat({ direction, onBack }: RefinementChatProps) {
  const [messages, setMessages] = useState<RefinementMessage[]>([
    {
      role: 'council',
      content: `You've selected "${direction.name}" for refinement. ${direction.concept}\n\nDescribe what you'd like to change — warmer colours, different composition, more playful feel, whatever you envision. The council will generate refined explorations.`,
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: RefinementMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/council/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          direction,
          refinement: input.trim(),
          conversationHistory: messages,
        }),
      });

      const data = await response.json();

      const councilMessage: RefinementMessage = {
        role: 'council',
        content: data.response,
        images: data.images,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, councilMessage]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          role: 'council',
          content: 'Something went wrong with the refinement. Please try again.',
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `refined-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, '_blank');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex flex-col max-w-3xl mx-auto px-4 py-8"
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm hover:border-white/20 transition-colors"
        >
          ← Back
        </button>
        <div>
          <h2 className="text-xl font-bold">
            Refining: <span className="text-amber">{direction.name}</span>
          </h2>
          <p className="text-xs text-white/40">{direction.concept}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl p-4 ${
                  msg.role === 'user'
                    ? 'bg-amber/20 text-white'
                    : 'bg-bg-card border border-white/10 text-white/80'
                }`}
              >
                {msg.role === 'council' && (
                  <span className="text-xs text-amber font-semibold block mb-1">Council</span>
                )}
                <p className="text-sm whitespace-pre-line">{msg.content}</p>

                {/* Inline Images */}
                {msg.images && msg.images.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    {msg.images.map((img: DirectionImage, imgIdx: number) => (
                      <div key={imgIdx} className="relative group rounded-lg overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.url}
                          alt={`Refined ${imgIdx + 1}`}
                          className="w-full aspect-square object-cover cursor-pointer"
                          onClick={() => setLightboxImage(img.url)}
                        />
                        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDownload(img.url); }}
                            className="bg-amber text-black px-2 py-1 rounded text-xs font-semibold"
                          >
                            ↓
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-bg-card border border-white/10 rounded-2xl p-4">
              <span className="text-xs text-amber font-semibold block mb-1">Council</span>
              <div className="flex gap-1.5">
                <span className="w-2 h-2 bg-amber rounded-full typing-dot" />
                <span className="w-2 h-2 bg-amber rounded-full typing-dot" />
                <span className="w-2 h-2 bg-amber rounded-full typing-dot" />
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Describe your refinement..."
          className="flex-1 bg-bg-card border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-amber/50 transition-all"
          disabled={isLoading}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className="px-5 py-3 bg-amber text-black font-semibold rounded-xl hover:bg-amber-dark disabled:opacity-30 transition-colors"
        >
          Send
        </button>
      </div>

      <Lightbox imageUrl={lightboxImage} onClose={() => setLightboxImage(null)} />
    </motion.div>
  );
}
