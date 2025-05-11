import { NextResponse, type NextRequest } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Meme } from '@/types/meme';

// POST: Add a bookmark
export async function POST(request: NextRequest) {
  const { meme_id } = await request.json();
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  if (!meme_id) {
    return NextResponse.json({ error: 'Meme ID is required' }, { status: 400 });
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
  }

  try {
    const { data, error } = await supabase
      .from('bookmarks')
      .insert({ user_id: user.id, meme_id: meme_id })
      .select()
      .single();

    if (error) {
      console.error('Error bookmarking meme:', error);
      // Handle potential unique constraint violation (already bookmarked)
      if (error.code === '23505') { // Unique violation
        return NextResponse.json({ error: 'Meme already bookmarked' }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, bookmark: data });
  } catch (e: unknown) {
    const error = e as Error;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET: Fetch user's bookmarked memes
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_request: NextRequest) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
  }

  try {
    // Fetch meme details for bookmarked items
    // Adjust the select query to match your Meme type from types.ts
    const { data: bookmarkedMemes, error } = await supabase
      .from('bookmarks')
      .select(`
        created_at,
        memes (
          id,
          image_url,
          title,
          created_at,
          like_count,
          dislike_count,
          user:users (
            id,
            username,
            avatar_url
          )
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { foreignTable: 'bookmarks', ascending: false });

    if (error) {
      console.error('Error fetching bookmarked memes:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform the data to match the expected Meme[] structure, if necessary
    const memes = bookmarkedMemes?.map(bm => ({
      ...(bm.memes as unknown as Meme),
      bookmarked_at: bm.created_at
    })) || [];

    return NextResponse.json(memes);
  } catch (e: unknown) {
    const error = e as Error;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 