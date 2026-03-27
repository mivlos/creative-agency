export const maxDuration = 60;
import { NextRequest, NextResponse } from 'next/server';
import { callClaudeJSON } from '@/lib/anthropic';
import { generateImagesParallel } from '@/lib/fal';
import { Direction, RefinementMessage } from '@/types';

const REFINE_PROMPT = `You are the creative council refining a chosen direction based on user feedback. 

The user has selected a creative direction and wants to refine it. Based on their feedback and the conversation history, generate 2-3 NEW image generation prompts that incorporate the requested changes while maintaining the core concept.

Also provide a brief response acknowledging the changes and explaining what you've adjusted.

Respond with ONLY valid JSON:
{
  "response": "Brief council response explaining the refinements",
  "prompts": ["refined prompt 1", "refined prompt 2", "refined prompt 3"],
  "style": "realistic_image|digital_illustration"
}`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { direction, refinement, conversationHistory } = body as {
      direction: Direction;
      refinement: string;
      conversationHistory: RefinementMessage[];
    };

    if (!direction || !refinement) {
      return NextResponse.json({ error: 'Direction and refinement are required' }, { status: 400 });
    }

    const historyText = conversationHistory
      ?.map(m => `${m.role === 'user' ? 'User' : 'Council'}: ${m.content}`)
      .join('\n') || '';

    const context = `Direction: "${direction.name}"
Concept: ${direction.concept}
Original rationale: ${direction.rationale}

Previous conversation:
${historyText}

User's new refinement request: ${refinement}`;

    const result = await callClaudeJSON<{
      response: string;
      prompts: string[];
      style: 'realistic_image' | 'digital_illustration';
    }>(REFINE_PROMPT, context);

    // Generate new images
    const images = await generateImagesParallel(
      result.prompts.map(prompt => ({ prompt, style: result.style }))
    );

    return NextResponse.json({
      response: result.response,
      images: images.map(img => ({
        url: img.url,
        style: img.style,
        prompt: img.prompt,
      })),
    });
  } catch (error) {
    console.error('Refine error:', error);
    return NextResponse.json({ error: 'Failed to refine direction' }, { status: 500 });
  }
}
