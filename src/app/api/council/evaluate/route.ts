import { NextRequest, NextResponse } from 'next/server';
import { callClaudeJSON } from '@/lib/anthropic';
import { Direction, StructuredBrief } from '@/types';

const EVALUATION_PROMPT = `You are the lead creative director evaluating creative directions against the original brief. 

For each direction, score on three criteria (1-5 each):
- Impact: How visually striking and memorable is this direction?
- Relevance: How well does it serve the original goal and audience?
- Originality: How fresh and differentiated is this approach?

Also identify:
- The "recommended" direction (best overall fit for the brief)
- The "bold pick" (most creatively daring — usually the Provocateur's champion)

Provide a 2-3 paragraph summary explaining your overall recommendation.

Respond with ONLY valid JSON:
{
  "evaluations": [
    {
      "name": "Direction Name",
      "impact": 4,
      "relevance": 5,
      "originality": 3,
      "total": 12,
      "strengths": ["strength 1", "strength 2"],
      "weaknesses": ["weakness 1"]
    }
  ],
  "recommended": "Name of recommended direction",
  "boldPick": "Name of bold/provocative pick",
  "summary": "2-3 paragraph rationale explaining the recommendation, what to watch for, and how the directions compare."
}`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const directions: Direction[] = body.directions;
    const brief: StructuredBrief = body.brief;

    if (!directions?.length || !brief) {
      return NextResponse.json({ error: 'Directions and brief are required' }, { status: 400 });
    }

    const directionsText = directions.map((d, i) => 
      `Direction ${i + 1}: "${d.name}"
Concept: ${d.concept}
Champion: ${d.champion}
Rationale: ${d.rationale}
Risks: ${d.risks}
Images generated: ${d.images?.length || 0}`
    ).join('\n\n');

    const briefText = `Original Brief:
Goal: ${brief.goal}
Audience: ${brief.audience}
Mood: ${brief.mood.join(', ')}
Category: ${brief.category}`;

    const result = await callClaudeJSON<{
      evaluations: { name: string; impact: number; relevance: number; originality: number; total: number }[];
      recommended: string;
      boldPick: string;
      summary: string;
    }>(EVALUATION_PROMPT, `${briefText}\n\n--- DIRECTIONS TO EVALUATE ---\n\n${directionsText}`);

    // Merge scores into directions
    const scoredDirections = directions.map(d => {
      const evaluation = result.evaluations.find(e => e.name === d.name);
      return {
        ...d,
        scores: evaluation ? {
          impact: evaluation.impact,
          relevance: evaluation.relevance,
          originality: evaluation.originality,
          total: evaluation.total,
        } : undefined,
      };
    });

    // Sort by total score descending
    scoredDirections.sort((a, b) => (b.scores?.total || 0) - (a.scores?.total || 0));

    return NextResponse.json({
      ranking: scoredDirections,
      recommended: result.recommended,
      boldPick: result.boldPick,
      summary: result.summary,
    });
  } catch (error) {
    console.error('Evaluate error:', error);
    return NextResponse.json({ error: 'Failed to evaluate directions' }, { status: 500 });
  }
}
