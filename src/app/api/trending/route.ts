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
      
      // Fallback to recent memes if RPC fails
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('memes')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(limit);
        
      if (fallbackError || !fallbackData) {
        return NextResponse.json(
          { error: 'Failed to fetch trending memes' },
          { status: 500 }
        );
      }
      
      // Use fallback data instead
      const mappedMemes = fallbackData.map(mapDbMemeToMeme);
      return NextResponse.json({
        data: mappedMemes,
        timeframe,
        count: mappedMemes.length,
        note: 'Using recent memes as fallback'
      });
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
    
    // Try both creator_id and user_id for the join, to handle either field being present
    // First try with creator_id
    let memes;
    let memesError;
    
    try {
      const { data, error } = await supabase
        .from('memes')
        .select('*, users:creator_id(id, username, avatar_url)')
        .in('id', memeIds)
        .eq('status', 'active');
        
      memes = data;
      memesError = error;
      
      // If that failed, try with user_id
      if (error || !data || data.length === 0) {
        const { data: userData, error: userError } = await supabase
          .from('memes')
          .select('*, users:user_id(id, username, avatar_url)')
          .in('id', memeIds)
          .eq('status', 'active');
          
        if (!userError && userData && userData.length > 0) {
          memes = userData;
          memesError = null;
        }
      }
    } catch (error) {
      console.error('Error fetching meme details:', error);
      memesError = error;
    }

    if (memesError || !memes) {
      console.error('Error getting meme details:', memesError);
      return NextResponse.json(
        { error: 'Failed to fetch meme details' },
        { status: 500 }
      );
    }

    // Sort the memes to match the order of memeIds and map to application model
    const sortedMemes = memeIds
      .map((id: string) => memes.find((meme: any) => meme.id === id))
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