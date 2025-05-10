"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { getAICategoryForMeme } from "@/lib/aiCategorizer";

// Define the type for the return value
type ActionResult = {
  error?: string;
  success?: boolean;
};

// Helper function to slugify a category name
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-')   // Replace multiple - with single -
    .replace(/^-+/, '')       // Trim - from start of text
    .replace(/-+$/, '');      // Trim - from end of text
}

export async function uploadMemeAction(formData: FormData): Promise<ActionResult> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { userId } = await auth();

  if (!userId) {
    return { error: "User not authenticated." };
  }

  // SAFETY FEATURE 1: Rate limiting - Check for daily upload limits
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error: countError } = await supabase
    .from("memes")
    .select("id", { count: 'exact' })
    .eq("user_id", userId)
    .gte("created_at", oneDayAgo);
    
  if (!countError && (count || 0) >= 30) {
    console.log(`[Action] Rate limit reached for user ${userId}: ${count} uploads in 24h`);
    return { error: "Daily upload limit reached (30 memes per day). Try again tomorrow." };
  }

  const title = formData.get("title") as string;
  const description = formData.get("description") as string | null;
  const twitter = formData.get("twitter") as string | null;
  const website = formData.get("website") as string | null;
  const imageFile = formData.get("image") as File | null;

  // Basic validation
  if (!title) {
    return { error: "Title is required." };
  }
  if (!imageFile || imageFile.size === 0) {
    return { error: "Image file is required." };
  }

  // SAFETY FEATURE 2: File validation - size and type
  if (imageFile.size > 5 * 1024 * 1024) { // 5MB limit
    return { error: "File too large. Maximum size is 5MB." };
  }
  
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!validTypes.includes(imageFile.type)) {
    return { error: "Invalid file type. Only JPEG, PNG, GIF and WebP are accepted." };
  }

  // Generate a unique file path: userId/timestamp-filename
  const fileName = `${Date.now()}-${imageFile.name}`;
  const filePath = `${userId}/${fileName}`;

  let imageUrl: string | null = null; // Define imageUrl variable
  let p_hash: string | null = null; // Define p_hash variable
  let memeId: string | null = null; // Define memeId for later use with categories

  try {
    // 1. Upload image to Supabase Storage
    console.log(`[Action] Uploading image to storage: ${filePath}`);
    const { error: storageError } = await supabase.storage
      .from("memes") // Ensure you have a 'memes' bucket in Supabase Storage
      .upload(filePath, imageFile);

    if (storageError) {
      console.error("[Action] Storage Error:", storageError);
      throw new Error(`Storage Error: ${storageError.message}`);
    }
    console.log("[Action] Image uploaded successfully.");

    // 2. Get public URL for the uploaded image
    const { data: urlData } = supabase.storage
      .from("memes")
      .getPublicUrl(filePath);
    
    imageUrl = urlData?.publicUrl; // Assign to outer variable
    if (!imageUrl) {
      console.error("[Action] Failed to get public URL for:", filePath);
      throw new Error("Failed to get image public URL after upload.");
    }
    console.log(`[Action] Public URL: ${imageUrl}`);

    // --- START: Call FastAPI to generate hash ---
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;
    if (!backendUrl) {
        console.error("[Action] NEXT_PUBLIC_BACKEND_API_URL is not set. Cannot generate hash.");
        p_hash = null; // Continue without hash for now
    } else {
        try {
            console.log(`[Action] Calling FastAPI hash endpoint: ${backendUrl}/generate-phash`);
            const hashResponse = await fetch(`${backendUrl}/generate-phash`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ image_url: imageUrl })
            });
            
            if (!hashResponse.ok) {
                const errorText = await hashResponse.text();
                throw new Error(`Failed to generate phash (${hashResponse.status}): ${errorText}`);
            }
            
            const hashData = await hashResponse.json();
            p_hash = hashData.phash; // Assign to outer variable
            console.log(`[Action] Generated perceptual hash: ${p_hash}`);

            // SAFETY FEATURE 3: Duplicate detection using perceptual hash
            if (p_hash) {
              const { data: existingMemes, error: dupeError } = await supabase
                .from("memes")
                .select("id, title")
                .eq("perceptual_hash", p_hash)
                .limit(1);
                
              if (!dupeError && existingMemes && existingMemes.length > 0) {
                console.log(`[Action] Duplicate detected with hash ${p_hash}, matching meme ID: ${existingMemes[0].id}`);
                // Clean up the uploaded file since we're rejecting it
                await supabase.storage.from("memes").remove([filePath]);
                throw new Error("This image (or one very similar) has already been uploaded.");
              }
            }

        } catch (hashError) {
            console.error("[Action] Failed to generate perceptual hash via FastAPI:", hashError);
            p_hash = null; // Continue without hash if FastAPI call fails
        }
    }
    // --- END: Call FastAPI to generate hash ---

    // --- START: Call AI Categorization Function ---
    let categoryName: string | null = null;
    if (imageUrl) {
      console.log("[Action] Calling getAICategoryForMeme function...");
      const categorizationResult = await getAICategoryForMeme(imageUrl);
      if (categorizationResult.suggestedCategory && !categorizationResult.error) {
        categoryName = categorizationResult.suggestedCategory;
        console.log(`[Action] AI Suggested Category: ${categoryName}`);
      } else if (categorizationResult.error) {
        console.warn(`[Action] AI categorization failed: ${categorizationResult.error}`);
      }
    } else {
      console.warn("[Action] Cannot call AI categorization without a valid image URL.");
    }
    // --- END: Call AI Categorization Function ---

    // 3. Insert meme data into Supabase Database (without category)
    console.log("[Action] Inserting meme data into database...");
    const memeData = {
      user_id: userId,
      title: title,
      description: description,
      twitter: twitter,
      website: website,
      image_url: imageUrl,
      perceptual_hash: p_hash,
      cluster_id: p_hash
    }; 

    const { data: memeInsertData, error: dbError } = await supabase
      .from("memes")
      .insert(memeData)
      .select('id')
      .single();

    if (dbError) {
      console.error("[Action] Database Error:", dbError);
      // Attempt to clean up storage if DB insert fails
      console.log(`[Action] Cleaning up storage: ${filePath}`);
      await supabase.storage.from("memes").remove([filePath]);
      throw new Error(`Database Error: ${dbError.message}`);
    }

    memeId = memeInsertData?.id;
    console.log(`[Action] Meme inserted successfully with ID: ${memeId}`);

    // 4. Handle category - only if we have both a memeId and categoryName
    if (memeId && categoryName) {
      console.log(`[Action] Processing category: "${categoryName}"`);
      
      // Create slug from category name
      const categorySlug = slugify(categoryName);
      
      // Check if category already exists
      const { data: existingCategories, error: catSearchError } = await supabase
        .from('categories')
        .select('id, name')
        .ilike('name', categoryName)
        .limit(1);
        
      if (catSearchError) {
        console.error("[Action] Error searching for existing category:", catSearchError);
        // We'll continue without a category if there's an error
      }
      
      let categoryId: string | null = null;
      
      if (existingCategories && existingCategories.length > 0) {
        // Use existing category
        categoryId = existingCategories[0].id;
        console.log(`[Action] Using existing category: "${existingCategories[0].name}" (${categoryId})`);
      } else {
        // Create new category
        const { data: newCategory, error: catInsertError } = await supabase
          .from('categories')
          .insert({
            name: categoryName,
            slug: categorySlug
          })
          .select('id')
          .single();
          
        if (catInsertError) {
          console.error("[Action] Error creating new category:", catInsertError);
          // We'll continue without a category if there's an error
        } else if (newCategory) {
          categoryId = newCategory.id;
          console.log(`[Action] Created new category: "${categoryName}" (${categoryId})`);
        }
      }
      
      // Link meme to category in meme_categories table
      if (categoryId) {
        const { error: memeCatError } = await supabase
          .from('meme_categories')
          .insert({
            meme_id: memeId,
            category_id: categoryId
          });
          
        if (memeCatError) {
          console.error("[Action] Error linking meme to category:", memeCatError);
        } else {
          console.log(`[Action] Successfully linked meme ${memeId} to category ${categoryId}`);
        }
      }
    }

    // 5. Revalidate the feed page to show the new meme
    revalidatePath("/");

    return { success: true };

  } catch (error) {
    console.error("[Action] Upload Meme Action Failed:", error);
    // Attempt cleanup if URL was generated but something else failed
    if (imageUrl) {
        try {
             console.log(`[Action] Cleaning up storage due to error: ${filePath}`);
             await supabase.storage.from("memes").remove([filePath]);
        } catch (cleanupError) {
            console.error("[Action] Error during cleanup of storage:", cleanupError);
        }
    }
    return { error: error instanceof Error ? error.message : "An unknown error occurred during upload." };
  }
}
