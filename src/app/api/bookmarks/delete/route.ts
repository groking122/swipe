import { NextResponse, type NextRequest } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// DELETE: Remove a bookmark
export async function POST(request: NextRequest) { // Using POST for delete to easily pass meme_id in body
  const { meme_id } = await request.json(); // Or get from query params if preferred for DELETE
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
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('user_id', user.id)
      .eq('meme_id', meme_id);

    if (error) {
      console.error('Error unbookmarking meme:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, message: 'Bookmark removed' });
  } catch (e: unknown) {
    const error = e as Error;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 