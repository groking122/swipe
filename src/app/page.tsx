// import { cookies } from 'next/headers'
// import Image from 'next/image'
// import { SwipeCard } from '@/components/SwipeCard'
import { auth } from '@clerk/nextjs/server'
// import type { User as ClerkUser } from '@clerk/nextjs/api';
// import { createClient } from '@/lib/supabase/server'
// import type { Database } from '@/types/supabase'
// import { UploadButton } from '@/components/UploadButton'
import { MemeFeed } from '@/components/MemeFeed'

// Define Meme type based on the memes table definition
// Add optional 'author' field
// This type might not be needed here anymore if not fetching initialMemes
// type Meme = Database['public']['Tables']['memes']['Row'] & {
//   author?: string | null;
// }

// Helper function no longer needed here if not fetching authors server-side
// function getUserDisplayName(user: { id: string; username: string | null; firstName: string | null; } | null): string | null {
//   if (!user) return null;
//   return user.username || user.firstName || null;
// }

// Type guard is no longer needed

export default async function Home() {
  console.log('[Page] Rendering Home page...'); // Log page render start
  // No need for cookieStore or Supabase client here anymore
  // const cookieStore = await cookies()
  // const supabase = createClient(cookieStore)
  await auth(); // Call auth() if needed for its side effects/checks

  // Remove all server-side fetching logic for initialMemes
  // console.log('[Page] Fetching initial memes from Supabase...');
  // const { data: memesData, error: memesError } = await supabase ...
  // ... lines 39-95 removed ...
  // console.log('[Page] No initial memes found.');

  // Supabase URL is not needed here

  return (
    // Simplify wrapper: remove flex items-center, let MemeFeed handle centering
    <div className="w-full h-full">
      {/* Removed conditional UploadButton block */}

      {/* Render the Client Component for the feed */}
      {/* Remove the initialMemes prop */}
      <MemeFeed />
      {/* Removed conditional rendering logic */}
    </div>
  )
}