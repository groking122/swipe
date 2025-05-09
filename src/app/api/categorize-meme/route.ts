import { NextResponse, type NextRequest } from 'next/server';
import { getAICategoryForMeme } from '@/lib/aiCategorizer'; // Import the shared function

export async function POST(request: NextRequest) {
  console.log("[API /categorize-meme] Received request via HTTP POST");

  try {
    const body = await request.json();
    const imageUrl = body.imageUrl as string | undefined;

    if (!imageUrl) {
      console.log("[API /categorize-meme] Missing imageUrl");
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
    }

    const result = await getAICategoryForMeme(imageUrl);

    if (result.error) {
      console.warn(`[API /categorize-meme] AI Categorization failed: ${result.error}`);
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    if (result.suggestedCategory) {
      console.log(`[API /categorize-meme] Category suggested: ${result.suggestedCategory}`);
      return NextResponse.json({ suggestedCategory: result.suggestedCategory });
    } else {
      console.warn(`[API /categorize-meme] AI did not return a category but no explicit error.`);
      return NextResponse.json({ error: 'AI did not return a category suggestion.' }, { status: 500 });
    }

  } catch (error: unknown) {
    console.error('[API /categorize-meme] Error processing request:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `Internal server error: ${errorMessage}` }, { status: 500 });
  }
} 