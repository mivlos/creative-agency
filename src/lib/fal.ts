export async function generateImage(
  prompt: string,
  style: 'digital_illustration' | 'realistic_image' | 'any' = 'realistic_image'
): Promise<{ url: string; style: string }> {
  const falKey = process.env.FAL_KEY;
  if (!falKey) throw new Error('FAL_KEY not configured');

  // Map 'any' to a random choice
  const actualStyle = style === 'any' 
    ? (Math.random() > 0.5 ? 'digital_illustration' : 'realistic_image')
    : style;

  const response = await fetch('https://fal.run/fal-ai/recraft-v3', {
    method: 'POST',
    headers: {
      'Authorization': `Key ${falKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      style: actualStyle,
      image_size: 'square_hd',
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`fal.ai error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return {
    url: data.images[0].url,
    style: actualStyle,
  };
}

export async function generateImagesParallel(
  prompts: { prompt: string; style: 'digital_illustration' | 'realistic_image' | 'any' }[]
): Promise<{ url: string; style: string; prompt: string }[]> {
  const results = await Promise.allSettled(
    prompts.map(p => generateImage(p.prompt, p.style))
  );

  return results
    .map((r, i) => {
      if (r.status === 'fulfilled') {
        return { ...r.value, prompt: prompts[i].prompt };
      }
      console.error(`Image generation failed for prompt ${i}:`, r.reason);
      return null;
    })
    .filter((r): r is { url: string; style: string; prompt: string } => r !== null);
}
