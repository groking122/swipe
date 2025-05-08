"use server"

import { revalidatePath } from "next/cache"
import { cookies } from 'next/headers'
import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { auth } from '@clerk/nextjs/server'; // Import Clerk auth helper

export async function likeMeme(memeId: string) { // Renamed id to memeId for clarity
  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore });
  
  // 1. Get User ID from Clerk - Await the auth() call
  const { userId } = await auth();
  if (!userId) {
    console.error("User not authenticated to like meme.");
    return { success: false, error: "Authentication required." };
  }

  console.log(`User ${userId} attempting to like meme ${memeId}`);
  
  try {
    // 2. Check if the user already liked this meme
    const { data: existingLike, error: likeCheckError } = await supabase
      .from('user_likes')
      .select('user_id') // Select minimal data
      .eq('user_id', userId)
      .eq('meme_id', memeId)
      .maybeSingle(); // Use maybeSingle to get one record or null

    if (likeCheckError) {
      console.error("Supabase error checking existing like:", likeCheckError);
      throw new Error("Database error checking like status: " + likeCheckError.message);
    }

    if (existingLike) {
      console.log(`User ${userId} already liked meme ${memeId}. No action taken.`);
      // Optionally return a specific message or just success: true
      return { success: true, message: "Already liked", memeId: memeId }; 
    }

    // 3. If not already liked, proceed to increment and record the like
    console.log(`User ${userId} has not liked meme ${memeId} before. Proceeding...`);

    // 3a. Increment like_count using RPC
    const { error: rpcError } = await supabase
      .rpc('increment_like_count', { meme_id_param: memeId });

    if (rpcError) {
      console.error("Supabase RPC error incrementing like count:", rpcError);
      // Don't insert into user_likes if RPC failed
      throw new Error("Database error incrementing like count: " + rpcError.message);
    }
    console.log(`Meme ${memeId} like count incremented via RPC.`);

    // 3b. Insert record into user_likes
    const { error: insertError } = await supabase
      .from('user_likes')
      .insert({ user_id: userId, meme_id: memeId });

    if (insertError) {
      // This is tricky - the count was incremented but the like wasn't recorded.
      // Log this specific inconsistency.
      console.error(`CRITICAL: Like count for meme ${memeId} incremented, but failed to insert into user_likes for user ${userId}:`, insertError);
      // Decide on recovery strategy - maybe attempt to decrement? For now, just report error.
      throw new Error("Database error recording like: " + insertError.message);
    }
    console.log(`Like recorded for user ${userId} and meme ${memeId}.`);

    // 4. Revalidate paths on successful *new* like
    revalidatePath("/") 
    revalidatePath("/top-memes") // Although likes are disabled here now, revalidate for consistency
    revalidatePath("/categories")
    // Potentially revalidate specific meme page if one exists e.g., revalidatePath(`/meme/${memeId}`)

    return { success: true, message: "Liked successfully", memeId: memeId };

  } catch (error: unknown) {
    console.error(`Failed processing like for meme ${memeId} by user ${userId}:`, error);
    // Ensure a generic error message is returned to the client
    const errorMessage = error instanceof Error ? error.message : "Failed to process like action";
    return { success: false, error: errorMessage };
  }
}

// TODO: Add other actions from meme-leaderboard if needed 