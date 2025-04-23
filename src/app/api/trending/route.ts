import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { mapDbMemeToMeme } from '@/services/memeService';

// Initialize Supabase client with environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface InteractionCountItem {
  meme_id: string;
  count: number;
}

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const limitParam = searchParams.get('limit');
    const timeframeParam = searchParams.get('timeframe') as 'day' | 'week' | 'month' | null;
    
    // Set defaults or use provided values
    const limit = limitParam ? parseInt(limitParam, 10) : 10;
    const timeframe = timeframeParam || 'week';
    
    // Validate timeframe
    if (!['day', 'week', 'month'].includes(timeframe)) {
      return NextResponse.json(
        { error: 'Invalid timeframe. Must be one of: day, week, month' },
        { status: 400 }
      );
    }
    
    // Calculate the start date based on the timeframe
    const now = new Date();
    let startDate = new Date();
    
    switch (timeframe) {
      case 'day':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
    }

    // First, get the meme IDs with the most interactions
    const { data: interactionData, error: interactionError } = await supabase
      .rpc('get_trending_memes', {
        start_date: startDate.toISOString(),
        limit_count: limit
      });

    if (interactionError) {
      console.error('Error getting trending memes:', interactionError);
      return NextResponse.json(
        { error: 'Failed to fetch trending memes' },
        { status: 500 }
      );
    }

    if (!interactionData || interactionData.length === 0) {
      return NextResponse.json({ 
        data: [],
        timeframe,
        count: 0
      });
    }

    // Then, get the actual meme data
    const memeIds = interactionData.map((item: InteractionCountItem) => item.meme_id);
    
    const { data: memes, error: memesError } = await supabase
      .from('memes')
      .select('*, users:user_id(id, username, avatar_url)')
      .in('id', memeIds)
      .eq('status', 'active');

    if (memesError) {
      console.error('Error getting meme details:', memesError);
      return NextResponse.json(
        { error: 'Failed to fetch meme details' },
        { status: 500 }
      );
    }

    // Sort the memes to match the order of memeIds and map to application model
    const sortedMemes = memeIds
      .map((id: string) => memes.find((meme) => meme.id === id))
      .filter(Boolean)
      .map(mapDbMemeToMeme);

    return NextResponse.json({
      data: sortedMemes,
      timeframe,
      count: sortedMemes.length
    });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 