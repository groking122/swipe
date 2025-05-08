import { NextResponse } from 'next/server'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers'; 

// Define the structure of a category object we want to return
export interface CategoryInfo {
  id: string; // Assuming uuid
  name: string;
  slug: string;
}

export async function GET() {
  const cookieStore = cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  try {
    // Fetch id, name, and slug from the categories table
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, slug')
      .order('name', { ascending: true }); // Order alphabetically by name

    if (error) {
      console.error("Supabase error fetching categories:", error)
      throw error;
    }

    const categories: CategoryInfo[] = data || [];

    // The frontend CategoryExplorer expects "All" as an option.
    // We prepend it here as it doesn't exist in the database table.
    const categoriesWithAll: (CategoryInfo | { id: string, name: string, slug: string })[] = [
      { id: 'all', name: 'All', slug: 'all' }, // Add a special "All" category object
      ...categories,
    ];

    return NextResponse.json(categoriesWithAll);

  } catch (error: unknown) {
    console.error("API Categories Error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch categories';
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
} 