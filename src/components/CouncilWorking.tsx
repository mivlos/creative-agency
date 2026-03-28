'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { COUNCIL_MEMBERS } from '@/types';

export interface CouncilEvent {
  type: string;
  role?: string;
  emoji?: string;
  message?: string;
  thinking?: string;
  directions?: string[];
}

interface CouncilWorkingProps {
  events: CouncilEvent[];
  currentPhase: string;
  progress: number;
}

const PHASE_LABELS: Record<string, string> = {
  analyzing: 'Analyzing your brief...',
  brainstorming: 'Council is deliberating...',
  generating: 'Generating visual explorations...',
  evaluating: 'Evaluating directions...',
};

const CREATIVE_QUOTES = [
  { text: "Design is not just what it looks like. Design is how it works.", author: "Steve Jobs" },
  { text: "Have no fear of perfection — you'll never reach it.", author: "Salvador Dalí" },
  { text: "Creativity takes courage.", author: "Henri Matisse" },
  { text: "The chief enemy of creativity is good sense.", author: "Pablo Picasso" },
  { text: "Design is thinking made visual.", author: "Saul Bass" },
  { text: "To create, one must first question everything.", author: "Eileen Gray" },
  { text: "Good design is obvious. Great design is transparent.", author: "Joe Sparano" },
  { text: "Art is not what you see, but what you make others see.", author: "Edgar Degas" },
];

const EVAL_CRITERIA = [
  'Visual impact & composition',
  'Brand coherence & strategy',
  'Audience relevance',
  'Originality & differentiation',
  'Technical execution',
  'Emotional resonance',
  'Scalability & versatility',
];

function RotatingQuotes() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex(i => (i + 1) % CREATIVE_QUOTES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-center mb-8 h-24 flex flex-col items-center justify-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.6 }}
          className="max-w-lg"
        >
          <p className="text-white/70 text-lg italic font-[family-name:var(--font-display)]">
            &ldquo;{CREATIVE_QUOTES[index].text}&rdquo;
          </p>
          <p className="text-amber/60 text-sm mt-2">— {CREATIVE_QUOTES[index].author}</p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function GenerativeShape() {
  return (
    <div className="flex items-center justify-center my-6">
      <div className="generative-shape" />
    </div>
  );
}

function EvaluationAnimation() {
  const [visibleCriteria, setVisibleCriteria] = useState<number[]>([]);

  useEffect(() => {
    EVAL_CRITERIA.forEach((_, i) => {
      setTimeout(() => {
        setVisibleCriteria(prev => [...prev, i]);
      }, i * 150);
    });
  }, []);

  return (
    <div className="w-full max-w-md mx-auto space-y-2">
      {EVAL_CRITERIA.map((criterion, i) => (
        <AnimatePresence key={i}>
          {visibleCriteria.includes(i) && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-3 text-sm"
            >
              <span className="text-green-400">✅</span>
              <span className="text-white/60">{criterion}</span>
            </motion.div>
          )}
        </AnimatePresence>
      ))}
    </div>
  );
}

export default function CouncilWorking({ events, currentPhase, progress }: CouncilWorkingProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col items-center px-4 py-16"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h2 className="text-3xl md:text-4xl font-bold mb-2">
          The Council is <span className="text-amber">Working</span>
        </h2>
        <p className="text-white/40">{PHASE_LABELS[currentPhase] || currentPhase}</p>
      </motion.div>

      {/* Progress Bar */}
      <div className="w-full max-w-2xl mb-12">
        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-amber rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <p className="text-right text-xs text-white/30 mt-1">{Math.round(progress)}%</p>
      </div>

      {/* Creative quotes — between progress bar and council grid */}
      {(currentPhase === 'generating' || currentPhase === 'brainstorming') && (
        <div className="w-full max-w-2xl mb-8">
          <RotatingQuotes />
        </div>
      )}

      {/* Council Members Grid */}
      <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {COUNCIL_MEMBERS.map((member, i) => {
          const memberEvents = events.filter(e => e.role === member.name);
          const isActive = memberEvents.some(e => e.type === 'council_member_start') && !memberEvents.some(e => e.type === 'council_member_complete');
          const isComplete = memberEvents.some(e => e.type === 'council_member_complete');
          const completedEvent = memberEvents.find(e => e.type === 'council_member_complete');

          return (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`bg-bg-card border rounded-xl p-5 transition-all duration-500 ${
                isActive ? 'border-amber/50 shadow-lg shadow-amber/5' :
                isComplete ? 'border-white/10' :
                'border-white/5 opacity-40'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{member.emoji}</span>
                <div>
                  <h3 className="font-semibold text-sm">{member.name}</h3>
                  <p className="text-xs text-white/40">{member.role}</p>
                </div>
                {isActive && (
                  <div className="ml-auto flex gap-1">
                    <span className="w-1.5 h-1.5 bg-amber rounded-full typing-dot" />
                    <span className="w-1.5 h-1.5 bg-amber rounded-full typing-dot" />
                    <span className="w-1.5 h-1.5 bg-amber rounded-full typing-dot" />
                  </div>
                )}
                {isComplete && (
                  <span className="ml-auto text-green-400 text-sm">✓</span>
                )}
              </div>

              <AnimatePresence mode="wait">
                {isActive && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-white/50 italic"
                  >
                    Exploring creative directions...
                  </motion.p>
                )}
                {isComplete && completedEvent?.thinking && (
                  <motion.p
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-white/60"
                  >
                    {completedEvent.thinking}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Generative shape during generation */}
      {(currentPhase === 'generating' || currentPhase === 'brainstorming') && (
        <div className="w-full max-w-2xl">
          <GenerativeShape />
        </div>
      )}

      {/* Evaluation animation */}
      {currentPhase === 'evaluating' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl bg-bg-card border border-amber/30 rounded-xl p-6 mb-8"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="w-2 h-2 bg-amber rounded-full pulse-amber" />
            <span className="text-amber font-semibold text-sm">Evaluating Directions</span>
          </div>
          <EvaluationAnimation />
        </motion.div>
      )}

      {/* Synthesis indicator */}
      <AnimatePresence>
        {events.some(e => e.type === 'synthesis_start') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-2xl bg-bg-card border border-amber/30 rounded-xl p-5 text-center"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="w-2 h-2 bg-amber rounded-full pulse-amber" />
              <span className="text-amber font-semibold text-sm">Synthesising</span>
            </div>
            <p className="text-sm text-white/50">Council is consolidating the top 5 directions...</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
