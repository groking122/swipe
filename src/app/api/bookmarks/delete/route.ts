import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuth } from '@clerk/nextjs/server';

// DELETE: Remove a bookmark
export async function POST(request: NextRequest) { // Still using POST as per original structure
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
    // The RLS policy "Users can delete their own bookmarks" will ensure
    // that user_id in the table matches get_current_clerk_user_id() (derived from the header).
    // We also explicitly match meme_id to ensure the correct bookmark is deleted.
    const { error, count } = await supabase
      .from('bookmarks')
      .delete()
      .eq('meme_id', meme_id)
      .eq('user_id', clerkUserId); // Explicitly matching user_id here is good practice, though RLS provides primary enforcement

    if (error) {
      console.error('Error unbookmarking meme:', error);
      return NextResponse.json({ error: error.message || 'Failed to remove bookmark' }, { status: 500 });
    }

    if (count === 0) {
      // This could mean the bookmark didn't exist for this user or was already deleted.
      // Depending on desired UX, you might return a 404 or a specific message.
      // For now, returning success as the state is "bookmark not present".
      // console.warn(`Attempt to delete non-existent bookmark or bookmark not owned by user: meme_id=${meme_id}, user_id=${clerkUserId}`);
    }

    return NextResponse.json({ success: true, message: 'Bookmark removed successfully' });
  } catch (e: unknown) {
    const err = e as Error;
    console.error('Unexpected error in POST /api/bookmarks/delete:', err);
    return NextResponse.json({ error: err.message || 'An unexpected error occurred' }, { status: 500 });
  }
} 