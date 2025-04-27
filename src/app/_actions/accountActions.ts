"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";

type Meme = Database["public"]["Tables"]["memes"]["Row"];

type ActionResult<T = null> = 
  | { success: true; data: T }
  | { success: false; error: string };

// --- Action to fetch user's uploaded memes ---
export async function getUserMemesAction(): Promise<ActionResult<Meme[]>> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: "User not authenticated." };
  }

  try {
    console.log(`[Action] Fetching memes for user: ${userId}`);
    const { data, error } = await supabase
      .from("memes")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[Action] Error fetching user memes:", error);
      throw new Error(error.message);
    }

    console.log(`[Action] Found ${data?.length ?? 0} memes for user ${userId}`);
    return { success: true, data: data || [] };

  } catch (error) {
    console.error("[Action] getUserMemesAction failed:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to fetch memes." };
  }
}

// --- Action to delete a meme ---
export async function deleteMemeAction(memeId: string): Promise<ActionResult> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: "User not authenticated." };
  }

  if (!memeId) {
    return { success: false, error: "Meme ID is required." };
  }

  try {
    console.log(`[Action] Attempting to delete meme ${memeId} by user ${userId}`);

    // 1. Get the meme details to verify ownership and get image URL
    const { data: memeData, error: fetchError } = await supabase
      .from("memes")
      .select("user_id, image_url") // image_url is no longer strictly needed for deletion if we keep the file
      .eq("id", memeId)
      .single();

    if (fetchError || !memeData) {
      console.error("[Action] Error fetching meme for deletion:", fetchError);
      return { success: false, error: "Meme not found or could not be fetched." };
    }

    // 2. Verify ownership
    if (memeData.user_id !== userId) {
      console.warn(`[Action] User ${userId} attempted to delete meme ${memeId} owned by ${memeData.user_id}`);
      return { success: false, error: "You do not have permission to delete this meme." };
    }

    // 3. Delete from Database ONLY
    console.log(`[Action] Deleting meme ${memeId} from database (Storage file will be kept)...`);
    const { error: dbError } = await supabase
      .from("memes")
      .delete()
      .eq("id", memeId);

    if (dbError) {
      console.error("[Action] Error deleting meme from database:", dbError);
      throw new Error(dbError.message);
    }
    console.log(`[Action] Meme ${memeId} deleted from database.`);

    // 4. Skip Storage Deletion
    /* 
    // --- COMMENTED OUT STORAGE DELETION --- 
    if (memeData.image_url) {
        try {
            const url = new URL(memeData.image_url);
            const filePath = url.pathname.split('/memes/').pop(); 
            if (filePath) {
                console.log(`[Action] Deleting image ${filePath} from storage bucket 'memes'...`);
                const { error: storageError } = await supabase.storage
                  .from("memes") 
                  .remove([filePath]);
                // ... (error handling for storage) ...
            }
        } catch (urlError) {
            console.error("[Action] Error parsing image URL for storage deletion:", urlError);
        }
    }
    */
    console.log(`[Action] Storage file for meme ${memeId} was intentionally kept.`);

    // 5. Revalidate account path to reflect changes
    revalidatePath("/account");

    return { success: true, data: null };

  } catch (error) {
    console.error("[Action] deleteMemeAction failed:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to delete meme." };
  }
}

// --- Action to fetch user's liked memes ---
export async function getLikedMemesAction(): Promise<ActionResult<Meme[]>> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: "User not authenticated." };
  }

  try {
    console.log(`[Action] Fetching liked meme IDs for user: ${userId}`);
    
    // 1. Get the IDs of memes liked by the user
    const { data: likedIdsData, error: idsError } = await supabase
      .from("user_likes")
      .select("meme_id") // Select only the meme ID
      .eq("user_id", userId)
      .order("created_at", { ascending: false }); 

    if (idsError) {
      console.error("[Action] Error fetching liked meme IDs:", idsError);
      throw new Error(idsError.message);
    }

    const memeIds = likedIdsData?.map(like => like.meme_id).filter(Boolean) as string[] || [];

    if (memeIds.length === 0) {
      console.log(`[Action] No liked memes found for user ${userId}`);
      return { success: true, data: [] }; // Return empty array if no likes
    }

    console.log(`[Action] Found ${memeIds.length} liked meme IDs. Fetching meme details...`);

    // 2. Fetch the actual meme details using the collected IDs
    const { data: memesData, error: memesError } = await supabase
      .from("memes")
      .select("*")
      .in("id", memeIds)
      // Optional: You might want a different order here, perhaps by original creation date?
      // .order("created_at", { ascending: false }); 

    if (memesError) {
      console.error("[Action] Error fetching meme details for liked memes:", memesError);
      throw new Error(memesError.message);
    }
    
    // The fetched memes might not be in the same order as the likes. 
    // If order matters (e.g., show most recently liked first), 
    // you might need to re-order memesData based on the memeIds order.
    // For simplicity, we'll return them as fetched for now.
    const likedMemes: Meme[] = memesData || [];

    console.log(`[Action] Fetched details for ${likedMemes.length} liked memes.`);
    return { success: true, data: likedMemes };

  } catch (error) {
    console.error("[Action] getLikedMemesAction failed:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to fetch liked memes." };
  }
} 