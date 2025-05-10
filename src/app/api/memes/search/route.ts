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
  const categoryParams = searchParams.getAll('categories');
  const memeIds = searchParams.getAll('ids'); // Get meme IDs from query params

  const { from, to } = getPagination(page, limit);

  try {
    let query = supabase
      .from('memes')
      .select('id, title, description, image_url, like_count, created_at, twitter, website');

    // If specific meme IDs are provided, prioritize that filter
    if (memeIds && memeIds.length > 0) {
      console.log(`[API Search] Searching for ${memeIds.length} specific meme IDs`);
      query = query.in('id', memeIds);
    } else {
      // Otherwise, proceed with category-based filtering
      // Resolve category slugs to IDs if necessary
      const categoryValuesToFilterBy: string[] = [];
      const slugsToFetch: string[] = [];

      for (const catParam of categoryParams) {
        // Basic check: UUIDs are typically 36 characters long. This is a naive check.
        // A more robust check would be a regex for UUID format.
        if (catParam.length === 36 && catParam.includes('-')) { // Likely a UUID
          categoryValuesToFilterBy.push(catParam);
        } else if (catParam !== 'all') { // Likely a slug
          slugsToFetch.push(catParam);
        }
      }

      if (slugsToFetch.length > 0) {
        const { data: categoriesFromSlugs, error: slugError } = await supabase
          .from('categories')
          .select('id')
          .in('slug', slugsToFetch);

        if (slugError) {
          console.error("Supabase error fetching category IDs for slugs:", slugError);
          throw slugError;
        }
        categoriesFromSlugs?.forEach(cat => categoryValuesToFilterBy.push(cat.id));
      }
      
      const finalSelectedCategoryIds = categoryValuesToFilterBy.filter(catId => catId !== 'all' && catId); // Ensure no empty strings if any slip through

      if (finalSelectedCategoryIds.length > 0) {
        const { data: memeIdsFromCategories, error: categoryFilterError } = await supabase
          .from('meme_categories')
          .select('meme_id')
          .in('category_id', finalSelectedCategoryIds);

        if (categoryFilterError) {
          console.error("Supabase error fetching meme IDs for categories:", categoryFilterError);
          throw categoryFilterError;
        }
        
        const distinctMemeIds = memeIdsFromCategories?.map(mc => mc.meme_id) || [];
        if (distinctMemeIds.length > 0) {
          query = query.in('id', distinctMemeIds);
        } else {
          return NextResponse.json([]);
        }
      }

      // Apply search filter (if provided)
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
      }
    }

    // Apply sorting
    if (sortBy === 'mostLiked') {
      query = query.order('like_count', { ascending: false })
                     .order('id', { ascending: true });
    } else { // Default to newest
      query = query.order('created_at', { ascending: false })
                     .order('id', { ascending: true });
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
      createdAt: item.created_at,
      twitter: item.twitter,
      website: item.website
    })) || [];

    return NextResponse.json(memes)

  } catch (error: unknown) {
    console.error("API Search Error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch search results';
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
} 