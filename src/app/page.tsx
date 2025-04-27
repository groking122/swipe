import { cookies } from 'next/headers'
import Image from 'next/image'
// import { SwipeCard } from '@/components/SwipeCard'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'
// import { UploadButton } from '@/components/UploadButton'
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
  console.log('[Page] Rendering Home page...'); // Log page render start
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { userId } = await auth(); // We still get the user ID from Clerk

  console.log('[Page] Fetching initial memes from Supabase...'); // Log fetch start
  // Fetch initial memes
  const { data: memesData, error: memesError } = await supabase
    .from('memes')
    .select('*') // Select all columns from memes table ONLY
    .order('created_at', { ascending: false })
    .limit(10);

  if (memesError) {
    console.error("[Page] Error fetching initial memes:", memesError.message); // Log only error message
    // Handle error state appropriately - maybe return an error message
  }
  
  console.log(`[Page] Fetched ${memesData?.length ?? 0} memes from Supabase.`); // Log count fetched

  const initialMemes: Meme[] = memesData || [];
  console.log(`[Page] Passing ${initialMemes.length} memes to MemeFeed.`); // Log count being passed

  // Supabase URL is no longer needed for the MemeFeed component
  // const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // if (!supabaseUrl) {
  //     console.error("[Page] Missing NEXT_PUBLIC_SUPABASE_URL environment variable");
  // }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      {/* Remove this conditional block 
      {userId && (
        <div className="mb-6">
          <UploadButton />
        </div>
      )}
      */}
      
      {/* Render the Client Component for the feed */}
      {/* Pass only initialMemes */} 
      <MemeFeed 
        initialMemes={initialMemes} 
        // initialSupabaseUrl={supabaseUrl} // Remove this prop
      />
      {/* We can remove the conditional rendering based on supabaseUrl now, 
         as the MemeFeed component will handle missing image_url internally */}
      {/* {supabaseUrl ? (
        <MemeFeed 
          initialMemes={initialMemes} 
          initialSupabaseUrl={supabaseUrl}
        />
      ) : (
        <p className="text-red-500">Error: Supabase URL not configured.</p>
      )} */}
    </div>
  )
}