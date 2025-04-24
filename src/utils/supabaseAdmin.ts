import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

// Initialize the Supabase admin client with service role key
// This has admin privileges and should only be used in trusted server environments
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

// Create a Supabase admin client with the service role key
export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Ensure that a bucket exists, creating it if it doesn't
 * Uses admin privileges to bypass RLS policies
 */
export async function ensureBucketExistsAdmin(bucket: string): Promise<boolean> {
  try {
    console.log(`[ADMIN] Checking if bucket ${bucket} exists...`);
    
    // Check if bucket exists
    const { data, error } = await supabaseAdmin.storage.getBucket(bucket);
    
    // If bucket exists, return true
    if (!error) {
      console.log(`[ADMIN] Bucket ${bucket} already exists`);
      return true;
    }
    
    // If error is not "Bucket not found", log and return false
    if (error && !error.message.includes('not found')) {
      console.error(`[ADMIN] Error checking bucket ${bucket}:`, error);
      return false;
    }
    
    // Bucket not found, try to create it
    console.log(`[ADMIN] Creating bucket: ${bucket}`);
    
    // Create the bucket with admin privileges
    const { error: createError } = await supabaseAdmin.storage.createBucket(bucket, {
      public: true,
      fileSizeLimit: 5242880, // 5MB
    });
    
    if (createError) {
      console.error(`[ADMIN] Error creating bucket ${bucket}:`, createError);
      return false;
    }
    
    // Set up public access policy for the bucket
    try {
      // Create a dummy signed URL to trigger policy creation
      const { error: signedUrlError } = await supabaseAdmin.storage.from(bucket).createSignedUrl('dummy.txt', 60);
      
      if (signedUrlError && !signedUrlError.message.includes('not found')) {
        console.warn(`[ADMIN] Warning: Could not create signed URL for bucket ${bucket}:`, signedUrlError);
      }
      
      // Get public URL (this doesn't return an error, just checking if it works)
      const { data: publicUrlData } = supabaseAdmin.storage.from(bucket).getPublicUrl('dummy.txt');
      
      if (!publicUrlData || !publicUrlData.publicUrl) {
        console.warn(`[ADMIN] Warning: Could not get public URL for bucket ${bucket}`);
      }
    } catch (policyError) {
      // Policy creation might fail but bucket could still be usable
      console.warn(`[ADMIN] Warning: Could not set public access policy for bucket ${bucket}:`, policyError);
    }
    
    // Verify bucket was created successfully
    const { error: verifyError } = await supabaseAdmin.storage.getBucket(bucket);
    if (verifyError) {
      console.error(`[ADMIN] Bucket ${bucket} creation verification failed:`, verifyError);
      return false;
    }
    
    console.log(`[ADMIN] Bucket ${bucket} created successfully`);
    return true;
  } catch (error) {
    console.error(`[ADMIN] Error ensuring bucket ${bucket} exists:`, error);
    return false;
  }
}

/**
 * Upload a file to Supabase Storage using admin privileges
 * @returns The file path if successful, null if failed
 */
export async function uploadFileAdmin(
  bucket: string,
  path: string,
  buffer: Uint8Array,
  contentType: string
): Promise<string | null> {
  try {
    // Ensure the bucket exists before uploading
    const bucketExists = await ensureBucketExistsAdmin(bucket);
    
    if (!bucketExists) {
      console.error(`[ADMIN] Cannot upload to non-existent bucket: ${bucket}`);
      return null;
    }

    // Try to upload with upsert true to handle potential conflicts
    const { data, error } = await supabaseAdmin.storage.from(bucket).upload(path, buffer, {
      cacheControl: '3600',
      upsert: true,
      contentType: contentType,
    });

    if (error) {
      console.error('[ADMIN] Error uploading file:', error);
      
      // If the error is about the bucket not existing, try to create it again
      if (error.message && error.message.includes('bucket') && error.message.includes('not found')) {
        console.log('[ADMIN] Bucket not found, attempting to create it...');
        const retryBucketExists = await ensureBucketExistsAdmin(bucket);
        
        if (retryBucketExists) {
          // Try upload again
          const retryUpload = await supabaseAdmin.storage.from(bucket).upload(path, buffer, {
            cacheControl: '3600',
            upsert: true,
            contentType: contentType,
          });
          
          if (retryUpload.error) {
            console.error('[ADMIN] Retry upload failed:', retryUpload.error);
            return null;
          }
          
          return retryUpload.data.path;
        }
      }
      
      return null;
    }

    return data.path;
  } catch (error) {
    console.error('[ADMIN] Unexpected error in uploadFileAdmin:', error);
    return null;
  }
}

/**
 * Delete a file from Supabase Storage using admin privileges
 * @returns true if successful, false if failed
 */
export async function deleteFileAdmin(bucket: string, path: string): Promise<boolean> {
  const { error } = await supabaseAdmin.storage.from(bucket).remove([path]);

  if (error) {
    console.error('[ADMIN] Error deleting file:', error);
    return false;
  }

  return true;
}