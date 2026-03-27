import { NextRequest, NextResponse } from 'next/server';
import { callClaudeJSON } from '@/lib/anthropic';
import { StructuredBrief } from '@/types';

const SYSTEM_PROMPT = `You are a creative brief analyst for an elite design council. Extract structured information from a natural language creative goal.

You MUST respond with ONLY valid JSON matching this exact structure:
{
  "goal": "one-line summary of what the user wants to create",
  "category": "brand-identity|campaign|social-media|editorial|personal|other",
  "audience": "described or inferred target audience",
  "constraints": ["list of constraints, brand requirements, things to avoid"],
  "mood": ["adjectives describing desired feeling/aesthetic"],
  "scope": ["logo", "illustrations", "social-templates", "photography", "typography", "mixed"],
  "references": "any mentioned styles, brands, cultural references, or inspirations"
}

Be thorough in inferring audience and mood even if not explicitly stated. Think about what a creative agency would infer from the brief.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { brief, references, brandColours, constraints } = body;

    if (!brief) {
      return NextResponse.json({ error: 'Brief is required' }, { status: 400 });
    }

    let enrichedBrief = brief;
    if (brandColours?.length) enrichedBrief += `\n\nBrand colours: ${brandColours.join(', ')}`;
    if (constraints?.length) enrichedBrief += `\n\nConstraints: ${constraints.join(', ')}`;
    if (references?.length) enrichedBrief += `\n\nReferences: ${references.join(', ')}`;

    const structuredBrief = await callClaudeJSON<StructuredBrief>(SYSTEM_PROMPT, enrichedBrief);

    return NextResponse.json({ brief: structuredBrief });
  } catch (error) {
    console.error('Analyze error:', error);
    return NextResponse.json({ error: 'Failed to analyze brief' }, { status: 500 });
  }
}
