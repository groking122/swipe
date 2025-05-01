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
  
  let userId: string | null = null;
  try {
    const authResult = await auth();
    userId = authResult.userId;
  } catch (error) {
    console.error("[Server Action] Error getting auth:", error);
    return { error: "Authentication error." };
  }

  if (!userId) {
    console.error("[Server Action] Swipe Error: User not authenticated.");
    return { error: "User not authenticated." };
  }

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

  // --- START: Fetch cluster_id --- 
  let clusterId: string | null = null;
  try {
    console.log(`[Server Action] Fetching cluster_id for meme ${memeId}`);
    const { data: memeData, error: fetchError } = await supabase
      .from('memes')
      .select('cluster_id') // Only select the cluster_id
      .eq('id', memeId)
      .maybeSingle(); // Use maybeSingle() in case meme is somehow deleted

    if (fetchError) {
        console.error(`[Server Action] Error fetching meme ${memeId} data:`, fetchError);
        // Decide if you want to stop the whole action or just proceed without cluster_id
        // For now, let's proceed but log the error
    } else if (memeData?.cluster_id) {
        clusterId = memeData.cluster_id;
        console.log(`[Server Action] Found cluster_id: ${clusterId}`);
    } else {
        console.warn(`[Server Action] Meme ${memeId} found, but cluster_id is missing or null.`);
        // clusterId remains null
    }
  } catch (fetchCatchError) {
      console.error("[Server Action] Unexpected error fetching meme data:", fetchCatchError);
      // Proceed without clusterId if fetch fails unexpectedly
  }
  // --- END: Fetch cluster_id --- 

  // --- Update user_likes table --- 
  if (direction === 'right') {
      // Add like
      console.log(`[Server Action] Inserting like for user ${userId} on meme ${memeId}`);
      const { error: likeError } = await supabase
        .from('user_likes')
        .insert({ user_id: userId, meme_id: memeId })
        // Use upsert with ignoreDuplicates if you want to silently handle existing likes
        // .upsert({ user_id: userId, meme_id: memeId }, { ignoreDuplicates: true });
        
      if (likeError && likeError.code !== '23505') { // Ignore unique constraint violation (already liked)
        console.error("[Server Action] Error inserting like:", likeError);
        // Don't stop the whole action, but maybe log it
      } else if (!likeError) {
          console.log(`[Server Action] Like inserted for user ${userId} on meme ${memeId}`);
      } else {
          console.log(`[Server Action] User ${userId} already liked meme ${memeId}.`);
      }
  } else {
      // Remove like (if it exists)
      console.log(`[Server Action] Deleting like for user ${userId} on meme ${memeId}`);
      const { error: unlikeError } = await supabase
        .from('user_likes')
        .delete()
        .match({ user_id: userId, meme_id: memeId });

      if (unlikeError) {
        console.error("[Server Action] Error deleting like:", unlikeError);
        // Don't stop the whole action
      } else {
          console.log(`[Server Action] Like deleted (if existed) for user ${userId} on meme ${memeId}`);
      }
  }
  // --- End user_likes update ---

  const voteType = direction === 'right' ? 'like' : 'dislike';

  try {
    console.log(`[Server Action] Calling RPC handle_vote with: memeId=${memeId}, userId=${userId}, voteType=${voteType}, clusterId=${clusterId}`); // Updated log
    
    // Prepare parameters for RPC call, including cluster_id
    const rpcParams = {
        p_meme_id: memeId,
        p_user_id: userId,
        p_vote_type: voteType,
        p_cluster_id: clusterId // Pass the fetched clusterId (can be null)
    };

    // Call the database function with updated parameters
    const { error: rpcError } = await supabase.rpc('handle_vote', rpcParams);

    if (rpcError) {
      console.error("[Server Action] Error calling handle_vote RPC:", rpcError);
      // Return specific error if RPC fails
      return { error: `Database RPC error: ${rpcError.message}` };
    }

    console.log(`[Server Action] handle_vote RPC successful for meme ${memeId}`);
    
    // Revalidate paths (consider revalidating /account too)
    try {
      revalidatePath('/');
      revalidatePath('/account'); // Revalidate account page to potentially update liked list
      console.log("[Server Action] Revalidated paths '/' and '/account'.");
    } catch (revalError) {
        console.error("[Server Action] Error during revalidatePath:", revalError);
    }
    
    return { success: true, message: "Vote processed." };

  } catch (error) {
    console.error("[Server Action] Unexpected error handling swipe action:", error);
    return { error: "An unexpected error occurred." };
  }
} 