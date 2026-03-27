import { NextRequest, NextResponse } from 'next/server';
import { generateImagesParallel } from '@/lib/fal';
import { Direction, StructuredBrief } from '@/types';

const STYLE_ROTATION: ('digital_illustration' | 'realistic_image' | 'any')[] = [
  'realistic_image',
  'digital_illustration',
  'any',
  'realistic_image',
  'digital_illustration',
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const directions: Direction[] = body.directions;
    const _brief: StructuredBrief = body.brief;

    if (!directions?.length) {
      return NextResponse.json({ error: 'Directions are required' }, { status: 400 });
    }

    // Generate images for all directions in parallel
    const directionResults = await Promise.all(
      directions.map(async (direction, dirIndex) => {
        const style = STYLE_ROTATION[dirIndex % STYLE_ROTATION.length];
        const promptsWithStyle = direction.prompts.slice(0, 4).map(prompt => ({
          prompt,
          style,
        }));

        const images = await generateImagesParallel(promptsWithStyle);

        return {
          ...direction,
          images: images.map(img => ({
            url: img.url,
            style: img.style,
            prompt: img.prompt,
          })),
        };
      })
    );

    return NextResponse.json({ directions: directionResults });
  } catch (error) {
    console.error('Generate error:', error);
    return NextResponse.json({ error: 'Failed to generate images' }, { status: 500 });
  }
}
