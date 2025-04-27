import { createServerClient } from '@supabase/ssr';

// Create a basic server client instance
// Note: This client won't handle cookies/auth context automatically
// Use the client from './supabase/server' within server components/actions for that.
const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { cookies: {} } // Provide an empty cookies object
);

// Function to get a single meme by ID
export async function getMemeById(id: number) {
  const { data, error } = await supabase
    .from('memes')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching meme by ID:', error)
    return null
  }

  return data
}

// Function to get memes within a range
export async function getMemes(from: number, to: number) {
  const { data: queryData, error } = await supabase
    .from('memes')
    .select('*')
    .range(from, to)

  if (error) {
    console.error('Error fetching memes:', error)
    return []
  }

  // Return the actual data fetched from Supabase
  return queryData || []
}

// Function to get the total number of memes
// ... existing code ...