'use client';

import { useState, useCallback, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import BriefInput from '@/components/BriefInput';
import CouncilWorking, { CouncilEvent } from '@/components/CouncilWorking';
import Presentation from '@/components/Presentation';
import RefinementChat from '@/components/RefinementChat';
import { StructuredBrief, Direction, EvaluationResult } from '@/types';

type Phase = 'input' | 'working' | 'presentation' | 'refinement';

const SESSION_KEY = 'creative-agency-session';

interface SessionData {
  phase: Phase;
  rawBrief?: string;
  structuredBrief?: StructuredBrief;
  directions?: Direction[];
  evaluation?: EvaluationResult;
  selectedDirection?: Direction;
}

export default function Home() {
  const [phase, setPhase] = useState<Phase>('input');
  const [councilEvents, setCouncilEvents] = useState<CouncilEvent[]>([]);
  const [currentPhase, setCurrentPhase] = useState('');
  const [progress, setProgress] = useState(0);
  const [structuredBrief, setStructuredBrief] = useState<StructuredBrief | null>(null);
  const [directions, setDirections] = useState<Direction[]>([]);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [selectedDirection, setSelectedDirection] = useState<Direction | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load session from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SESSION_KEY);
      if (saved) {
        const data: SessionData = JSON.parse(saved);
        if (data.phase === 'presentation' && data.directions && data.evaluation) {
          setPhase('presentation');
          setStructuredBrief(data.structuredBrief || null);
          setDirections(data.directions);
          setEvaluation(data.evaluation);
        }
      }
    } catch { /* ignore parse errors */ }
  }, []);

  // Save session to localStorage
  const saveSession = useCallback((data: SessionData) => {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(data));
    } catch { /* ignore quota errors */ }
  }, []);

  const runCouncil = useCallback(async (brief: string, brandColours: string[], constraints: string[]) => {
    if (!brief.trim()) return;

    setIsLoading(true);
    setPhase('working');
    setCouncilEvents([]);
    setProgress(0);
    setCurrentPhase('analyzing');

    try {
      // Step 1: Analyze
      setProgress(5);
      const analyzeRes = await fetch('/api/council/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief, brandColours, constraints }),
      });
      const analyzeData = await analyzeRes.json();
      if (!analyzeRes.ok) throw new Error(analyzeData.error);
      const sBrief: StructuredBrief = analyzeData.brief;
      setStructuredBrief(sBrief);
      setProgress(15);

      // Step 2: Brainstorm (SSE)
      setCurrentPhase('brainstorming');
      const brainstormRes = await fetch('/api/council/brainstorm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief: sBrief }),
      });

      let brainstormDirections: Direction[] = [];

      if (brainstormRes.body) {
        const reader = brainstormRes.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          let eventType = '';
          for (const line of lines) {
            if (line.startsWith('event: ')) {
              eventType = line.slice(7).trim();
            } else if (line.startsWith('data: ') && eventType) {
              try {
                const data = JSON.parse(line.slice(6));
                const event: CouncilEvent = { type: eventType, ...data };
                setCouncilEvents(prev => [...prev, event]);

                if (eventType === 'council_member_start') {
                  const memberProgress: Record<string, number> = {
                    'Art Director': 20, 'Strategist': 30, 'Researcher': 40, 'Provocateur': 50,
                  };
                  setProgress(memberProgress[data.role] || 25);
                }
                if (eventType === 'council_member_complete') {
                  const memberProgress: Record<string, number> = {
                    'Art Director': 28, 'Strategist': 38, 'Researcher': 48, 'Provocateur': 55,
                  };
                  setProgress(memberProgress[data.role] || 35);
                }
                if (eventType === 'synthesis_start') setProgress(58);
                if (eventType === 'complete') {
                  brainstormDirections = data.directions;
                  setProgress(65);
                }
              } catch { /* skip malformed JSON */ }
              eventType = '';
            }
          }
        }
      }

      if (!brainstormDirections.length) throw new Error('No directions generated');

      // Step 3: Generate images (streaming)
      setCurrentPhase('generating');
      setProgress(68);
      let directionsWithImages: Direction[] = brainstormDirections.map(d => ({ ...d, images: [] }));
      
      const generateRes = await fetch('/api/council/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ directions: brainstormDirections, brief: sBrief }),
      });

      if (!generateRes.ok) throw new Error('Failed to generate images');

      const genReader = generateRes.body?.getReader();
      const genDecoder = new TextDecoder();
      if (genReader) {
        let genBuffer = '';
        while (true) {
          const { done, value } = await genReader.read();
          if (done) break;
          genBuffer += genDecoder.decode(value, { stream: true });
          const genLines = genBuffer.split('\n');
          genBuffer = genLines.pop() || '';
          for (const line of genLines) {
            if (!line.startsWith('data: ')) continue;
            try {
              const event = JSON.parse(line.slice(6));
              if (event.type === 'direction_start') {
                setProgress(68 + Math.round((event.index / event.total) * 17));
              } else if (event.type === 'direction_complete') {
                directionsWithImages = directionsWithImages.map(d =>
                  d.name === event.name ? { ...d, images: event.images } : d
                );
              } else if (event.type === 'complete') {
                directionsWithImages = event.directions;
              } else if (event.type === 'error') {
                throw new Error(event.message);
              }
            } catch {}
          }
        }
      }
      setProgress(85);

      // Step 4: Evaluate
      setCurrentPhase('evaluating');
      const evaluateRes = await fetch('/api/council/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ directions: directionsWithImages, brief: sBrief }),
      });
      const evaluateData = await evaluateRes.json();
      if (!evaluateRes.ok) throw new Error(evaluateData.error);

      setDirections(evaluateData.ranking);
      setEvaluation({
        ranking: evaluateData.ranking,
        recommended: evaluateData.recommended,
        boldPick: evaluateData.boldPick,
        summary: evaluateData.summary,
      });
      setProgress(100);

      // Save session
      saveSession({
        phase: 'presentation',
        rawBrief: brief,
        structuredBrief: sBrief,
        directions: evaluateData.ranking,
        evaluation: evaluateData,
      });

      // Transition to presentation
      setTimeout(() => setPhase('presentation'), 500);

    } catch (error) {
      console.error('Council failed:', error);
      alert('The council encountered an error. Please try again.');
      setPhase('input');
    } finally {
      setIsLoading(false);
    }
  }, [saveSession]);

  const handleRefine = useCallback((direction: Direction) => {
    setSelectedDirection(direction);
    setPhase('refinement');
  }, []);

  const handleStartNew = useCallback(() => {
    setPhase('input');
    setCouncilEvents([]);
    setProgress(0);
    setStructuredBrief(null);
    setDirections([]);
    setEvaluation(null);
    setSelectedDirection(null);
    localStorage.removeItem(SESSION_KEY);
  }, []);

  const handleBackToPresentation = useCallback(() => {
    setPhase('presentation');
    setSelectedDirection(null);
  }, []);

  return (
    <main className="min-h-screen bg-bg">
      <AnimatePresence mode="wait">
        {phase === 'input' && (
          <BriefInput
            key="input"
            onSubmit={runCouncil}
            isLoading={isLoading}
          />
        )}

        {phase === 'working' && (
          <CouncilWorking
            key="working"
            events={councilEvents}
            currentPhase={currentPhase}
            progress={progress}
          />
        )}

        {phase === 'presentation' && directions.length > 0 && evaluation && (
          <Presentation
            key="presentation"
            directions={directions}
            evaluation={evaluation}
            onRefine={handleRefine}
            onStartNew={handleStartNew}
          />
        )}

        {phase === 'refinement' && selectedDirection && (
          <RefinementChat
            key="refinement"
            direction={selectedDirection}
            onBack={handleBackToPresentation}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
