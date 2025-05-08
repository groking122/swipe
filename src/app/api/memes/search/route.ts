import { NextResponse, type NextRequest } from 'next/server'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers'; 
import type { Meme } from "@/types/meme"; // Import the Meme type

// Helper function for pagination range
const getPagination = (page: number, limit: number) => {
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  return { from, to };
}

export async function GET(request: NextRequest) {
  const cookieStore = cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  const { searchParams } = new URL(request.url);

  // Parse query parameters
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '9'); 
  const sortBy = searchParams.get('sort') || 'newest'; // 'newest' or 'mostLiked'
  const searchQuery = searchParams.get('search');
  // Categories will now be category IDs (or the special 'all' slug)
  const categoryParams = searchParams.getAll('categories'); 

  const { from, to } = getPagination(page, limit);

  try {
    let query = supabase
      .from('memes')
      // Select all columns from memes table, and join to get category info if needed (though not strictly required for this query if just filtering)
      // For simplicity here, we are just filtering. If you need category names alongside memes, you'd join.
      .select('id, title, description, image_url, like_count, created_at');

    // Apply category filter (if provided and not 'all')
    const selectedCategoryIds = categoryParams.filter(catId => catId !== 'all');
    if (selectedCategoryIds.length > 0) {
      // Find memes that are in ANY of the selected categories
      // This requires a subquery or a join with meme_categories
      // Using .in() with a subquery from meme_categories that selects meme_id
      const { data: memeIdsFromCategories, error: categoryFilterError } = await supabase
        .from('meme_categories')
        .select('meme_id')
        .in('category_id', selectedCategoryIds);

      if (categoryFilterError) {
        console.error("Supabase error fetching meme IDs for categories:", categoryFilterError);
        throw categoryFilterError;
      }
      
      const distinctMemeIds = memeIdsFromCategories?.map(mc => mc.meme_id) || [];
      if (distinctMemeIds.length > 0) {
        query = query.in('id', distinctMemeIds);
      } else {
        // If selected categories yield no memes, return empty array directly
        return NextResponse.json([]);
      }
    }

    // Apply search filter (if provided)
    if (searchQuery) {
      query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
    }

    // Apply sorting
    if (sortBy === 'mostLiked') {
      query = query.order('like_count', { ascending: false });
    } else { // Default to newest
      query = query.order('created_at', { ascending: false });
    }

    // Apply pagination
    query = query.range(from, to);

    const { data, error } = await query;

    if (error) {
      console.error("Supabase error fetching search results:", error)
      throw error;
    }

    const memes: Meme[] = data?.map(item => ({
      id: item.id,
      title: item.title,
      description: item.description,
      imageUrl: item.image_url,
      likes: item.like_count,
      createdAt: item.created_at
    })) || [];

    return NextResponse.json(memes)

  } catch (error: unknown) {
    console.error("API Search Error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch search results';
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
} 