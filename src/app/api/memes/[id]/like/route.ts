import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify user is authenticated
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Await params to get the ID
    const { id: memeId } = await params;
    
    if (!memeId) {
      return NextResponse.json(
        { error: 'Meme ID is required' },
        { status: 400 }
      );
    }

    // Check if meme exists
    const { data: meme, error: memeError } = await supabase
      .from('memes')
      .select('id')
      .eq('id', memeId)
      .single();

    if (memeError || !meme) {
      return NextResponse.json(
        { error: 'Meme not found' },
        { status: 404 }
      );
    }

    // Check if interaction already exists
    const { data: existingInteraction, error: checkError } = await supabase
      .from('interactions')
      .select('id')
      .eq('user_id', userId)
      .eq('meme_id', memeId)
      .eq('type', 'like')
      .single();

    if (existingInteraction) {
      return NextResponse.json(
        { message: 'You have already liked this meme' },
        { status: 200 }
      );
    }

    // Create a new like interaction
    const { data: interaction, error: createError } = await supabase
      .from('interactions')
      .insert([
        {
          user_id: userId,
          meme_id: memeId,
          type: 'like'
        }
      ])
      .select()
      .single();

    if (createError) {
      console.error('Database error:', createError);
      return NextResponse.json(
        { error: 'Failed to like meme' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      message: 'Meme liked successfully',
      interactionId: interaction.id 
    });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify user is authenticated
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Await params to get the ID
    const { id: memeId } = await params;
    
    if (!memeId) {
      return NextResponse.json(
        { error: 'Meme ID is required' },
        { status: 400 }
      );
    }

    // Delete the like interaction
    const { error: deleteError } = await supabase
      .from('interactions')
      .delete()
      .eq('user_id', userId)
      .eq('meme_id', memeId)
      .eq('type', 'like');

    if (deleteError) {
      console.error('Database error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to unlike meme' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Meme unliked successfully' });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 