'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Direction, EvaluationResult } from '@/types';
import Lightbox from './Lightbox';

interface PresentationProps {
  directions: Direction[];
  evaluation: EvaluationResult;
  onRefine: (direction: Direction) => void;
  onStartNew: () => void;
}

function StarRating({ score, max = 5 }: { score: number; max?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={i < score ? 'star-filled' : 'star-empty'}>★</span>
      ))}
    </div>
  );
}

function DownloadButton({ url, small = false }: { url: string; small?: boolean }) {
  const handleDownload = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `creative-agency-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, '_blank');
    }
  }, [url]);

  return (
    <button
      onClick={handleDownload}
      className={`bg-amber/90 text-black rounded-lg hover:bg-amber transition-colors flex items-center gap-1 ${
        small ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'
      } font-semibold`}
    >
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
        <path d="M8 1v10M8 11L4 7M8 11l4-4M2 14h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      {!small && 'Download'}
    </button>
  );
}

const CHAMPION_EMOJIS: Record<string, string> = {
  'Art Director': '🎨',
  'Strategist': '🧠',
  'Researcher': '🔬',
  'Provocateur': '🔥',
};

export default function Presentation({ directions, evaluation, onRefine, onStartNew }: PresentationProps) {
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const downloadAllForDirection = useCallback(async (direction: Direction) => {
    if (!direction.images?.length) return;
    for (const img of direction.images) {
      try {
        const response = await fetch(img.url);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${direction.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch { /* skip failed downloads */ }
      // Small delay between downloads
      await new Promise(r => setTimeout(r, 300));
    }
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen px-4 py-12 max-w-7xl mx-auto"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h2 className="text-3xl md:text-5xl font-bold mb-3">
          Creative <span className="text-amber">Directions</span>
        </h2>
        <p className="text-white/40 max-w-xl mx-auto">
          The council has explored {directions.length} strategic directions for your brief.
          Here are the results, ranked by overall score.
        </p>
      </motion.div>

      {/* Direction Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-16">
        {directions.map((direction, i) => {
          const isRecommended = direction.name === evaluation.recommended;
          const isBoldPick = direction.name === evaluation.boldPick;
          const avgScore = direction.scores
            ? Math.round((direction.scores.impact + direction.scores.relevance + direction.scores.originality) / 3)
            : 0;

          return (
            <motion.div
              key={direction.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`bg-bg-card border rounded-2xl overflow-hidden transition-all hover:border-white/20 ${
                isRecommended ? 'border-amber/50 shadow-lg shadow-amber/10' : 'border-white/10'
              }`}
            >
              {/* Badges */}
              <div className="flex gap-2 p-4 pb-0">
                {isRecommended && (
                  <span className="px-2.5 py-1 bg-amber/20 text-amber text-xs font-semibold rounded-full">
                    ★ Recommended
                  </span>
                )}
                {isBoldPick && (
                  <span className="px-2.5 py-1 bg-red-500/20 text-red-400 text-xs font-semibold rounded-full">
                    🔥 Bold Pick
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="text-xl font-bold mb-1">{direction.name}</h3>
                <p className="text-sm text-white/50 mb-3">{direction.concept}</p>

                {/* Image Gallery */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {direction.images?.map((img, imgIndex) => (
                    <div key={imgIndex} className="relative group aspect-square rounded-lg overflow-hidden cursor-pointer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url}
                        alt={`${direction.name} - ${imgIndex + 1}`}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        onClick={() => setLightboxImage(img.url)}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-sm">
                          Click to expand
                        </span>
                      </div>
                      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DownloadButton url={img.url} small />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Scores */}
                <div className="flex items-center justify-between mb-3">
                  <StarRating score={avgScore} />
                  <div className="flex items-center gap-1.5 text-sm text-white/40">
                    <span>{CHAMPION_EMOJIS[direction.champion] || '💡'}</span>
                    <span>{direction.champion}</span>
                  </div>
                </div>

                {/* Rationale */}
                <p className="text-xs text-white/40 mb-4 line-clamp-3">{direction.rationale}</p>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => onRefine(direction)}
                    className="flex-1 py-2 bg-amber text-black text-sm font-semibold rounded-lg hover:bg-amber-dark transition-colors"
                  >
                    Refine This
                  </button>
                  <button
                    onClick={() => downloadAllForDirection(direction)}
                    className="px-3 py-2 bg-white/5 border border-white/10 text-sm rounded-lg hover:border-white/20 transition-colors"
                  >
                    Download All
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Council Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="max-w-3xl mx-auto bg-bg-card border border-white/10 rounded-2xl p-8 mb-12"
      >
        <h3 className="text-2xl font-bold mb-4">Council <span className="text-amber">Summary</span></h3>
        <div className="text-white/60 leading-relaxed whitespace-pre-line text-sm">
          {evaluation.summary}
        </div>
      </motion.div>

      {/* Start New */}
      <div className="text-center">
        <button
          onClick={onStartNew}
          className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white/60 hover:text-white hover:border-white/20 transition-all"
        >
          Start New Brief →
        </button>
      </div>

      <Lightbox imageUrl={lightboxImage} onClose={() => setLightboxImage(null)} />
    </motion.div>
  );
}
