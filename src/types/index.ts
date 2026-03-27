export interface StructuredBrief {
  goal: string;
  category: string;
  audience: string;
  constraints: string[];
  mood: string[];
  scope: string[];
  references: string;
}

export interface Direction {
  name: string;
  concept: string;
  prompts: string[];
  rationale: string;
  champion: string;
  risks: string;
  images?: DirectionImage[];
  scores?: {
    impact: number;
    relevance: number;
    originality: number;
    total: number;
  };
}

export interface DirectionImage {
  url: string;
  style: string;
  prompt: string;
}

export interface CouncilMember {
  emoji: string;
  name: string;
  role: string;
}

export interface EvaluationResult {
  ranking: Direction[];
  recommended: string;
  boldPick: string;
  summary: string;
}

export interface RefinementMessage {
  role: 'user' | 'council';
  content: string;
  images?: DirectionImage[];
  timestamp: number;
}

export interface SessionState {
  id: string;
  rawBrief: string;
  structuredBrief?: StructuredBrief;
  directions?: Direction[];
  evaluation?: EvaluationResult;
  refinementChat?: RefinementMessage[];
  selectedDirection?: string;
  phase: 'input' | 'working' | 'presentation' | 'refinement';
  createdAt: number;
}

export const COUNCIL_MEMBERS: CouncilMember[] = [
  { emoji: '🎨', name: 'Art Director', role: 'Visual impact, composition, colour theory, bold choices' },
  { emoji: '🧠', name: 'Strategist', role: 'Audience fit, brand coherence, market positioning' },
  { emoji: '🔬', name: 'Researcher', role: 'Evidence, trends, competitor approaches, precedent' },
  { emoji: '🔥', name: 'Provocateur', role: 'Challenge conventions, push unexpected directions' },
];

export const EXAMPLE_BRIEFS = [
  "A visual identity for a sustainable coffee brand",
  "Social media campaign for Gen Z athleisure in Dubai",
  "5 logo directions for an artisan gin brand",
  "Album cover art exploring urban solitude",
  "Brand identity for a mindfulness podcast",
];
