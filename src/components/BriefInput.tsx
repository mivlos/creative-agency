'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { EXAMPLE_BRIEFS } from '@/types';

interface BriefInputProps {
  onSubmit: (brief: string, brandColours: string[], constraints: string[]) => void;
  isLoading: boolean;
}

export default function BriefInput({ onSubmit, isLoading }: BriefInputProps) {
  const [brief, setBrief] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [brandColours, setBrandColours] = useState<string[]>([]);
  const [constraints, setConstraints] = useState('');
  const [colourInput, setColourInput] = useState('#F59E0B');

  const addColour = () => {
    if (colourInput && brandColours.length < 5) {
      setBrandColours([...brandColours, colourInput]);
      setColourInput('#F59E0B');
    }
  };

  const removeColour = (index: number) => {
    setBrandColours(brandColours.filter((_, i) => i !== index));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
      className="min-h-screen flex flex-col items-center justify-center px-4 py-16"
    >
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="text-center mb-12"
      >
        <h1 className="text-5xl md:text-7xl font-bold mb-4 tracking-tight">
          Creative <span className="text-amber">Agency</span>
        </h1>
        <p className="text-lg text-white/50 font-light">
          Your AI Design Council
        </p>
      </motion.div>

      {/* Input Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="w-full max-w-2xl"
      >
        <div className="relative">
          <textarea
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            placeholder="What are you creating?"
            className="w-full h-40 bg-bg-card border border-white/10 rounded-2xl p-6 text-lg text-white placeholder-white/30 resize-none focus:outline-none focus:border-amber/50 focus:ring-1 focus:ring-amber/25 transition-all"
            disabled={isLoading}
          />
        </div>

        {/* Example Chips */}
        <div className="flex flex-wrap gap-2 mt-4">
          {EXAMPLE_BRIEFS.map((example, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.08, duration: 0.4 }}
              onClick={() => setBrief(example)}
              className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-sm text-white/60 hover:text-amber hover:border-amber/30 transition-all"
            >
              {example}
            </motion.button>
          ))}
        </div>

        {/* Optional Sections */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-6"
        >
          <button
            onClick={() => setShowOptions(!showOptions)}
            className="text-sm text-white/40 hover:text-white/60 transition-colors flex items-center gap-1"
          >
            <span className="text-xs">{showOptions ? '▼' : '▶'}</span>
            Advanced options
          </button>

          {showOptions && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 space-y-4"
            >
              {/* Brand Colours */}
              <div>
                <label className="block text-sm text-white/50 mb-2">Brand Colours</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={colourInput}
                    onChange={(e) => setColourInput(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border border-white/10"
                  />
                  <button
                    onClick={addColour}
                    className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm hover:border-amber/30 transition-colors"
                  >
                    Add
                  </button>
                  <div className="flex gap-2">
                    {brandColours.map((colour, i) => (
                      <button
                        key={i}
                        onClick={() => removeColour(i)}
                        className="w-8 h-8 rounded-lg border border-white/10 hover:border-red-400/50 transition-colors relative group"
                        style={{ backgroundColor: colour }}
                        title="Click to remove"
                      >
                        <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 text-xs">✕</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Constraints */}
              <div>
                <label className="block text-sm text-white/50 mb-2">Constraints or things to avoid</label>
                <input
                  type="text"
                  value={constraints}
                  onChange={(e) => setConstraints(e.target.value)}
                  placeholder="e.g., No stock photo aesthetic, avoid clichés..."
                  className="w-full bg-bg-card border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-amber/50 transition-all"
                />
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Submit Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          onClick={() => onSubmit(brief, brandColours, constraints ? [constraints] : [])}
          disabled={!brief.trim() || isLoading}
          className="w-full mt-8 py-4 bg-amber text-black font-semibold text-lg rounded-2xl hover:bg-amber-dark disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <span className="inline-block w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              Starting Council...
            </>
          ) : (
            <>Start Council →</>
          )}
        </motion.button>
      </motion.div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-16 text-xs text-white/20"
      >
        Powered by Claude & Recraft V3
      </motion.p>
    </motion.div>
  );
}
