import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';
import type { InteractionType } from '@/types';

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const memeId = searchParams.get('memeId');
    const type = searchParams.get('type') as InteractionType;
    
    if (!memeId || !type) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Validate interaction type
    const validTypes: InteractionType[] = ['like', 'share', 'save'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid interaction type' },
        { status: 400 }
      );
    }

    // Count interactions
    const { count, error } = await supabase
      .from('interactions')
      .select('id', { count: 'exact', head: true })
      .match({
        meme_id: memeId,
        type,
      });

    if (error) {
      console.error('Error counting interactions:', error);
      return NextResponse.json(
        { error: 'Failed to count interactions' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        count: count || 0
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error counting interactions:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 