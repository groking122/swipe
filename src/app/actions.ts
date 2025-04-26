'use server'; // Mark this file as containing Server Actions

import { cookies } from 'next/headers';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache'; // To refresh the home page data

// --- Action to save meme metadata --- 
export async function saveMemeData(imageUrl: string) {
  console.log("[Server Action] saveMemeData invoked with imageUrl:", imageUrl);
  
  let userId: string | null = null;
  try {
    const authResult = await auth();
    userId = authResult.userId;
    console.log("[Server Action] Obtained Clerk userId:", userId);
  } catch (error) {
    console.error("[Server Action] Error getting auth:", error);
    return { error: "Authentication error." };
  }

  if (!userId) {
    console.error("[Server Action] Save Meme Error: User not authenticated after auth() call.");
    return { error: "User not authenticated." };
  }

  if (!imageUrl || typeof imageUrl !== 'string' || imageUrl.trim() === '') {
    console.error("[Server Action] Save Meme Error: Invalid image URL provided");
    return { error: "Invalid image URL." };
  }

  let supabase;
  try {
    const cookieStore = await cookies();
    supabase = createClient(cookieStore);
    console.log("[Server Action] Supabase server client created for saveMemeData.");
  } catch (error) {
    console.error("[Server Action] Error creating Supabase client:", error);
    return { error: "Failed to initialize database client." };
  }
  
  console.log(`[Server Action] Attempting DB insert for user: ${userId}`);

  const { data, error } = await supabase
    .from('memes')
    .insert([
      {
        image_url: imageUrl,
        user_id: userId
      }
    ])
    .select();

  if (error) {
    console.error("[Server Action] Error inserting meme into database:", error);
    // Log specifically if it's an RLS error
    if (error.message.includes('security policy')) {
        console.error("[Server Action] RLS policy violation detected during insert.");
    }
    return { error: `Database error: ${error.message}` };
  }

  console.log("[Server Action] Meme saved successfully to DB:", data);
  try {
      revalidatePath('/');
      console.log("[Server Action] Revalidated path '/'.");
  } catch (revalError) {
      console.error("[Server Action] Error during revalidatePath:", revalError);
      // Continue even if revalidation fails for now
  }
  return { success: true, data };
}

// --- Action to handle swipe --- 
export async function handleSwipeAction(memeId: string, direction: 'left' | 'right') {
  console.log(`[Server Action] handleSwipeAction invoked for memeId: ${memeId}, direction: ${direction}`);
  
  // Note: No direct user auth check needed here usually,
  // as the action itself relies on the user's cookie context implicitly.
  // RLS policies on UPDATE should handle permissions if needed.

  if (!memeId || !direction) {
      console.error("[Server Action] Invalid input for handleSwipeAction");
      return { error: "Invalid input." };
  }

  let supabase;
  try {
      const cookieStore = await cookies();
      supabase = createClient(cookieStore);
      console.log("[Server Action] Supabase server client created for handleSwipeAction.");
  } catch (error) {
      console.error("[Server Action] Error creating Supabase client:", error);
      return { error: "Failed to initialize database client." };
  }

  const column = direction === 'right' ? 'like_count' : 'dislike_count';

  // Use the increment function you created in SQL
  const { error } = await supabase.rpc('increment', { row_id: memeId, column_name: column });

  if (error) {
    console.error("[Server Action] Error calling increment function:", error);
    // Check specifically for RLS errors on the rpc call if applicable
    if (error.message.includes('security policy')) {
        console.error("[Server Action] RLS policy violation detected during RPC call.");
    }
    return { error: `Database RPC error: ${error.message}` };
  }

  console.log(`[Server Action] Increment successful for meme ${memeId}, column ${column}`);

  // Optional: Revalidate if needed, but maybe not necessary just for count updates
  // revalidatePath('/'); 

  return { success: true };
} 