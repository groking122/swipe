import { NextResponse } from 'next/server'
// Import the specific helper
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers'; 
import type { Meme } from "@/types/meme"; // Import the Meme type
import { type NextRequest } from 'next/server' 

// Ensure GET receives NextRequest type
export async function GET(request: NextRequest) { 
  const cookieStore = cookies()
  // Use the auth-helper client directly
  const supabase = createServerComponentClient({ cookies: () => cookieStore }); 

  // Get search params for potential pagination/limit (optional for top memes)
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '9') // Default limit 9

  try {
    const { data, error } = await supabase
      .from('memes') // Your table name
      .select('id, title, description, image_url, like_count, created_at') // Select necessary columns
      .order('like_count', { ascending: false }) // Order by likes (descending)
      .limit(limit) // Apply limit

    if (error) {
      console.error("Supabase error fetching top memes:", error)
      throw error; // Throw error to be caught below
    }

    // Map Supabase data to the frontend Meme type
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
    // Type check before accessing message property
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch top memes';
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

// Optional: Add revalidation configuration if needed
// export const revalidate = 60; // Revalidate every 60 seconds 