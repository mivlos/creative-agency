import { NextRequest } from 'next/server';
import { generateImage } from '@/lib/fal';
import { Direction } from '@/types';

export const maxDuration = 300;

const STYLE_ROTATION: ('digital_illustration' | 'realistic_image' | 'any')[] = [
  'realistic_image',
  'digital_illustration',
  'any',
  'realistic_image',
  'digital_illustration',
];

export async function POST(request: NextRequest) {
  const body = await request.json();
  const directions: Direction[] = body.directions;

  if (!directions?.length) {
    return new Response(JSON.stringify({ error: 'Directions are required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        // Signal all directions starting
        for (let dirIndex = 0; dirIndex < directions.length; dirIndex++) {
          send({ type: 'direction_start', name: directions[dirIndex].name, index: dirIndex, total: directions.length });
        }

        // Generate ALL directions in parallel (300s timeout allows this)
        const directionResults = await Promise.allSettled(
          directions.map(async (direction, dirIndex) => {
            const style = STYLE_ROTATION[dirIndex % STYLE_ROTATION.length];
            const prompts = direction.prompts.slice(0, 4); // 4 images per direction = 20 total

            const results = await Promise.allSettled(
              prompts.map(prompt => generateImage(prompt, style))
            );

            const images = results
              .map((r, i) => {
                if (r.status === 'fulfilled') {
                  return { ...r.value, prompt: prompts[i] };
                }
                console.error(`Image gen failed for direction ${dirIndex}, prompt ${i}:`, r.reason);
                return null;
              })
              .filter((r): r is { url: string; style: string; prompt: string } => r !== null);

            send({
              type: 'direction_complete',
              name: direction.name,
              index: dirIndex,
              images,
            });

            return { name: direction.name, images };
          })
        );

        // Build final directions map
        const allDirectionResults: Record<string, { url: string; style: string; prompt: string }[]> = {};
        for (const result of directionResults) {
          if (result.status === 'fulfilled') {
            allDirectionResults[result.value.name] = result.value.images;
          }
        }

        // Send final combined result
        const finalDirections = directions.map(d => ({
          ...d,
          images: allDirectionResults[d.name] || [],
        }));

        send({ type: 'complete', directions: finalDirections });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        send({ type: 'error', message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
