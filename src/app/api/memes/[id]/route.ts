import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Meme ID is required' },
        { status: 400 }
      );
    }

    // Fetch meme from database
    const { data: meme, error } = await supabase
      .from('memes')
      .select(`
        *,
        users:user_id (
          id,
          username,
          avatar_url
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch meme' },
        { status: 500 }
      );
    }

    if (!meme) {
      return NextResponse.json(
        { error: 'Meme not found' },
        { status: 404 }
      );
    }

    // Transform the response to match the application's Meme type
    const formattedMeme = {
      id: meme.id,
      title: meme.title,
      imageUrl: meme.image_url,
      status: meme.status,
      createdAt: meme.created_at,
      user: meme.users ? {
        id: meme.users.id,
        username: meme.users.username,
        avatarUrl: meme.users.avatar_url
      } : null
    };

    return NextResponse.json(formattedMeme);
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 