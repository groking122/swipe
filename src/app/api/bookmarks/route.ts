import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuth } from '@clerk/nextjs/server';
import type { Meme } from '@/types/meme';

// POST: Add a bookmark
export async function POST(request: NextRequest) {
  const auth = getAuth(request);
  const clerkUserId = auth.userId;

  if (!clerkUserId) {
    return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
  }

  let meme_id;
  try {
    const body = await request.json();
    meme_id = body.meme_id;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!meme_id) {
    return NextResponse.json({ error: 'Meme ID is required' }, { status: 400 });
  }

  // Initialize Supabase client with the Clerk user ID in headers for RLS
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          'X-Clerk-User-Id': clerkUserId,
        },
      },
    }
  );

  try {
    const { data, error } = await supabase
      .from('bookmarks')
      .insert({ user_id: clerkUserId, meme_id: meme_id }) // using 'user_id' as defined in the new table
      .select()
      .single();

    if (error) {
      console.error('Error bookmarking meme:', error);
      // Handle potential unique constraint violation (already bookmarked)
      if (error.code === '23505') { // Unique violation
        // Check if the message indicates the specific unique constraint
        if (error.message.includes('unique_user_meme_bookmark')) {
          return NextResponse.json({ error: 'Meme already bookmarked by this user' }, { status: 409 });
        }
      }
      return NextResponse.json({ error: error.message || 'Failed to bookmark meme' }, { status: 500 });
    }
    return NextResponse.json({ success: true, bookmark: data });
  } catch (e: unknown) {
    const err = e as Error;
    console.error('Unexpected error in POST /api/bookmarks:', err);
    return NextResponse.json({ error: err.message || 'An unexpected error occurred' }, { status: 500 });
  }
}

// GET: Fetch user's bookmarked memes
export async function GET(request: NextRequest) {
  const auth = getAuth(request);
  const clerkUserId = auth.userId;

  if (!clerkUserId) {
    return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
  }

  // Initialize Supabase client with the Clerk user ID in headers for RLS
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          'X-Clerk-User-Id': clerkUserId,
        },
      },
    }
  );

  try {
    // Fetch meme details for bookmarked items
    // RLS policy "Users can view their own bookmarks" will filter by user_id = get_current_clerk_user_id()
    const { data: bookmarkedEntries, error } = await supabase
      .from('bookmarks')
      .select(`
        created_at,
        meme_id,
        memes (
          id,
          image_url,
          title,
          created_at,
          like_count,
          dislike_count,
          user_id, 
          description,
          cluster_id,
          share_count,
          twitter,
          website
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching bookmarked memes:', error);
      return NextResponse.json({ error: error.message || 'Failed to fetch bookmarks' }, { status: 500 });
    }

    const memes: Meme[] = bookmarkedEntries
      ?.filter(bm => bm.memes) // Filter out entries where memes is null or undefined
      .map(bm => {
        const memeData = bm.memes as unknown as Meme; // Cast to unknown first, then to Meme
        return {
          ...memeData,
          bookmarked_at: bm.created_at 
        };
      }) || [];

    return NextResponse.json(memes);
  } catch (e: unknown) {
    const err = e as Error;
    console.error('Unexpected error in GET /api/bookmarks:', err);
    return NextResponse.json({ error: err.message || 'An unexpected error occurred' }, { status: 500 });
  }
} 