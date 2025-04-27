"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";

// Define the type for the return value
type ActionResult = {
  error?: string;
  success?: boolean;
};

export async function uploadMemeAction(formData: FormData): Promise<ActionResult> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { userId } = await auth();

  if (!userId) {
    return { error: "User not authenticated." };
  }

  const title = formData.get("title") as string;
  const description = formData.get("description") as string | null;
  const imageFile = formData.get("image") as File | null;

  // Basic validation
  if (!title) {
    return { error: "Title is required." };
  }
  if (!imageFile || imageFile.size === 0) {
    return { error: "Image file is required." };
  }

  // Generate a unique file path: userId/timestamp-filename
  const fileExtension = imageFile.name.split(".").pop();
  const fileName = `${Date.now()}-${imageFile.name}`;
  const filePath = `${userId}/${fileName}`;

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
    
    const imageUrl = urlData?.publicUrl;
    if (!imageUrl) {
      console.error("[Action] Failed to get public URL for:", filePath);
      throw new Error("Failed to get image public URL after upload.");
    }
    console.log(`[Action] Public URL: ${imageUrl}`);

    // 3. Insert meme data into Supabase Database
    console.log("[Action] Inserting meme data into database...");
    const memeData: Database["public"]["Tables"]["memes"]["Insert"] = {
      user_id: userId,
      title: title,
      description: description, // Can be null
      image_url: imageUrl, // Store the public URL
      // 'created_at' and 'id' are usually handled by Supabase defaults
    };

    const { error: dbError } = await supabase.from("memes").insert(memeData);

    if (dbError) {
      console.error("[Action] Database Error:", dbError);
      // Attempt to clean up storage if DB insert fails
      console.log(`[Action] Cleaning up storage: ${filePath}`);
      await supabase.storage.from("memes").remove([filePath]);
      throw new Error(`Database Error: ${dbError.message}`);
    }
    console.log("[Action] Meme data inserted successfully.");

    // 4. Revalidate the feed page to show the new meme
    revalidatePath("/");

    return { success: true };

  } catch (error) {
    console.error("[Action] Upload Meme Action Failed:", error);
    return { error: error instanceof Error ? error.message : "An unknown error occurred during upload." };
  }
}
