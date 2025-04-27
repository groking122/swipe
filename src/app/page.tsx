import { cookies } from 'next/headers'
import Image from 'next/image'
// import { SwipeCard } from '@/components/SwipeCard'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'
// import { UploadButton } from '@/components/UploadButton'
import { MemeFeed } from '@/components/MemeFeed'

// Define Meme type based on the memes table definition
// Add optional 'author' field
type Meme = Database['public']['Tables']['memes']['Row'] & {
  author?: string | null;
}

// Update Helper function to accept the inferred user type
function getUserDisplayName(user: { id: string; username: string | null; firstName: string | null; } | null): string | null {
  if (!user) return null;
  // Prioritize username, fallback to first name, then return null
  return user.username || user.firstName || null;
}

// Type guard is no longer needed as we are not fetching related user data here
// function memeHasUser(meme: Meme): meme is Meme & { user: NonNullable<Meme['user']> } {
//   return meme.user !== null;
// }

export default async function Home() {
  console.log('[Page] Rendering Home page...'); // Log page render start
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { userId: currentUserId } = await auth(); // Rename to avoid conflict

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

  let initialMemes: Meme[] = [];

  if (memesData && memesData.length > 0) {
    console.log(`[Page] Fetched ${memesData.length} memes. Fetching author details...`);
    
    // Get unique user IDs from memes
    const userIds = [...new Set(memesData.map(meme => meme.user_id).filter(Boolean) as string[])];

    let authorMap: Map<string, string | null> = new Map();

    if (userIds.length > 0) {
      try {
        // Fetch user details from Clerk in batch
        console.log(`[Page] Fetching Clerk details for ${userIds.length} users...`);
        // Await the client call first, then access users
        const client = await clerkClient(); 
        const usersResponse = await client.users.getUserList({ userId: userIds });
        console.log(`[Page] Fetched Clerk details for ${usersResponse.data.length} users successfully.`);
        
        // Create a map from userId to display name (rely on inference for user type)
        usersResponse.data.forEach(user => {
          authorMap.set(user.id, getUserDisplayName(user));
        });
      } catch (clerkError) {
        console.error("[Page] Error fetching user details from Clerk:", clerkError);
        // Proceed without author names if Clerk fetch fails
      }
    }

    // Add author details to each meme
    initialMemes = memesData.map(meme => ({
      ...meme,
      author: meme.user_id ? authorMap.get(meme.user_id) ?? null : null,
    }));

    console.log(`[Page] Passing ${initialMemes.length} memes with author info to MemeFeed.`);

  } else {
    console.log('[Page] No initial memes found.');
  }

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