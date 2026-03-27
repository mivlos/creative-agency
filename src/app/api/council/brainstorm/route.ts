export const maxDuration = 300;
import { NextRequest } from 'next/server';
import { callClaudeJSON } from '@/lib/anthropic';
import { StructuredBrief, Direction } from '@/types';

const ROLE_PROMPTS: Record<string, string> = {
  'Art Director': `You are the Art Director on an elite design council. You focus on:
- Visual impact, composition, colour theory
- Bold, striking creative choices
- Contemporary design trends and aesthetics
- "Does this stop the scroll?"

Given the creative brief, propose 2-3 creative directions. Each direction should be visually distinct and specific. For each direction, provide 3-4 detailed image generation prompts that would bring the concept to life.

Respond with ONLY valid JSON:
{
  "directions": [
    {
      "name": "Direction Name",
      "concept": "One-line concept description",
      "prompts": ["detailed image prompt 1", "detailed image prompt 2", "detailed image prompt 3"],
      "rationale": "Why this direction works visually",
      "risks": "Potential visual risks or limitations"
    }
  ]
}`,

  'Strategist': `You are the Strategist on an elite design council. You focus on:
- Audience fit and brand coherence
- Market positioning and competitive differentiation
- Cultural context and audience behaviour
- "Does this serve the brief and resonate with the target audience?"

Given the creative brief, propose 2-3 creative directions. Each should be strategically sound and audience-appropriate. For each direction, provide 3-4 detailed image generation prompts.

Respond with ONLY valid JSON:
{
  "directions": [
    {
      "name": "Direction Name",
      "concept": "One-line concept description",
      "prompts": ["detailed image prompt 1", "detailed image prompt 2", "detailed image prompt 3"],
      "rationale": "Strategic reasoning for this direction",
      "risks": "Strategic risks or market concerns"
    }
  ]
}`,

  'Researcher': `You are the Researcher on an elite design council. You focus on:
- Evidence-based design decisions
- Current trends, competitor approaches, historical precedent
- Data-informed insights others might miss
- "What does the evidence suggest would work?"

Given the creative brief, propose 2-3 creative directions informed by research insights. For each direction, provide 3-4 detailed image generation prompts.

Respond with ONLY valid JSON:
{
  "directions": [
    {
      "name": "Direction Name",
      "concept": "One-line concept description",
      "prompts": ["detailed image prompt 1", "detailed image prompt 2", "detailed image prompt 3"],
      "rationale": "Research-backed reasoning",
      "risks": "What the evidence warns about"
    }
  ]
}`,

  'Provocateur': `You are the Provocateur on an elite design council. You focus on:
- Challenging conventional thinking
- Pushing unexpected, surprising creative directions
- Creative risk that could yield high reward
- "What would surprise and delight? What hasn't been tried?"

Given the creative brief, propose 2-3 UNCONVENTIONAL creative directions. At least one should be genuinely surprising. Push boundaries. For each direction, provide 3-4 detailed image generation prompts.

Respond with ONLY valid JSON:
{
  "directions": [
    {
      "name": "Direction Name",
      "concept": "One-line concept description",
      "prompts": ["detailed image prompt 1", "detailed image prompt 2", "detailed image prompt 3"],
      "rationale": "Why this unexpected direction could work",
      "risks": "The creative risk involved"
    }
  ]
}`
};

const SYNTHESIS_PROMPT = `You are the lead creative director synthesising input from four council members (Art Director, Strategist, Researcher, Provocateur).

Review all proposed directions and consolidate to the TOP 5 strongest, most diverse directions. Ensure variety — at least one safe/strategic choice, one bold/provocative choice, and a mix in between.

For each direction:
- Refine the name and concept
- Select or refine the best 3-4 image generation prompts (be highly detailed and specific — these go directly to an image generation AI)
- Note which council member championed it
- Keep the rationale and risks

Respond with ONLY valid JSON:
{
  "directions": [
    {
      "name": "Direction Name",
      "concept": "One-line concept description",
      "prompts": ["very detailed image prompt 1", "very detailed image prompt 2", "very detailed image prompt 3"],
      "rationale": "Why this direction was selected",
      "champion": "Art Director|Strategist|Researcher|Provocateur",
      "risks": "Key risks to consider"
    }
  ]
}`;

export async function POST(request: NextRequest) {
  const body = await request.json();
  const brief: StructuredBrief = body.brief;

  if (!brief) {
    return new Response(JSON.stringify({ error: 'Structured brief is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const briefText = `Creative Brief:
Goal: ${brief.goal}
Category: ${brief.category}
Target Audience: ${brief.audience}
Mood/Aesthetic: ${brief.mood.join(', ')}
Scope: ${brief.scope.join(', ')}
Constraints: ${brief.constraints.join(', ') || 'None specified'}
References: ${brief.references || 'None specified'}`;

  // Use SSE for streaming progress
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const roles = ['Art Director', 'Strategist', 'Researcher', 'Provocateur'];
        const emojis: Record<string, string> = { 'Art Director': '🎨', 'Strategist': '🧠', 'Researcher': '🔬', 'Provocateur': '🔥' };

        // Run council members SEQUENTIALLY so SSE shows each completing one by one
        const allDirections: { directions: { name: string; concept: string; prompts: string[]; rationale: string; risks: string }[] }[] = [];

        for (const role of roles) {
          sendEvent('council_member_start', { role, emoji: emojis[role] });

          try {
            const result = await callClaudeJSON<{ directions: { name: string; concept: string; prompts: string[]; rationale: string; risks: string }[] }>(
              ROLE_PROMPTS[role],
              briefText
            );

            sendEvent('council_member_complete', {
              role,
              emoji: emojis[role],
              directions: result.directions.map(d => d.name),
              thinking: result.directions.map(d => `${d.name}: ${d.concept}`).join(' | '),
            });

            allDirections.push(result);
          } catch (err) {
            console.error(`Council member ${role} failed:`, err);
            // Continue with other members even if one fails
          }
        }

        if (allDirections.length === 0) throw new Error('All council members failed');

        // Proper Claude synthesis to consolidate to top 5 with refined prompts
        sendEvent('synthesis_start', { message: 'Synthesising top directions...' });

        const allProposalsText = allDirections.map((memberResult, i) => {
          const roleName = roles[i];
          return `${roleName}:\n${memberResult.directions.map(d =>
            `- "${d.name}": ${d.concept}\n  Rationale: ${d.rationale}\n  Risks: ${d.risks}\n  Prompts: ${d.prompts.join(' | ')}`
          ).join('\n')}`;
        }).join('\n\n');

        const synthesis = await callClaudeJSON<{ directions: Direction[] }>(
          SYNTHESIS_PROMPT,
          `${briefText}\n\n--- COUNCIL PROPOSALS ---\n\n${allProposalsText}`
        );

        sendEvent('complete', { directions: synthesis.directions });
        controller.close();
      } catch (error) {
        console.error('Brainstorm error:', error);
        sendEvent('error', { message: 'Council brainstorming failed' });
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
