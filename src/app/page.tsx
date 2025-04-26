import { cookies } from 'next/headers'
import Image from 'next/image'
import { SwipeCard } from '@/components/SwipeCard'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'
import { UploadButton } from '@/components/UploadButton'
import { MemeFeed } from '@/components/MemeFeed'

// Define Meme type based *only* on the memes table definition
type Meme = Database['public']['Tables']['memes']['Row']
// Removed the attempt to add a 'user' field from a non-existent related table
// Removed the manually added 'image_path', as 'image_url' exists in the type

// Type guard is no longer needed as we are not fetching related user data here
// function memeHasUser(meme: Meme): meme is Meme & { user: NonNullable<Meme['user']> } {
//   return meme.user !== null;
// }

export default async function Home() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { userId } = await auth(); // We still get the user ID from Clerk

  // Fetch initial memes
  const { data: memesData, error: memesError } = await supabase
    .from('memes')
    .select('*') // Select all columns from memes table ONLY
    .order('created_at', { ascending: false })
    .limit(10);

  if (memesError) {
    console.error("Error fetching initial memes:", memesError);
    // Handle error state appropriately - maybe return an error message
  }
  const initialMemes: Meme[] = memesData as Meme[] || [];

  // Get Supabase URL for client-side image construction
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
      console.error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable");
      // Handle missing env var state
  }

  return (
    <div className="flex flex-col items-center pt-4">
      {userId && (
        <div className="mb-6">
          <UploadButton />
        </div>
      )}
      
      {/* Render the Client Component for the feed */} 
      {supabaseUrl ? (
        <MemeFeed 
          initialMemes={initialMemes} 
          initialSupabaseUrl={supabaseUrl}
        />
      ) : (
        <p className="text-red-500">Error: Supabase URL not configured.</p>
      )}
    </div>
  )
}