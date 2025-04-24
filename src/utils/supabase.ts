import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

// Initialize the Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create a single supabase client for the entire app
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

/**
 * Ensure that a bucket exists, creating it if it doesn't
 */
export async function ensureBucketExists(bucket: string): Promise<boolean> {
  try {
    // Check if bucket exists
    const { data, error } = await supabase.storage.getBucket(bucket);
    
    // If bucket exists, return true
    if (!error) {
      console.log(`Bucket ${bucket} already exists`);
      return true;
    }
    
    // If error is not "Bucket not found", log and return false
    if (error && !error.message.includes('not found')) {
      console.error(`Error checking bucket ${bucket}:`, error);
      return false;
    }
    
    // Bucket not found, try to create it
    console.log(`Creating bucket: ${bucket}`);
    
    // Create the bucket
    const { error: createError } = await supabase.storage.createBucket(bucket, {
      public: true,
      fileSizeLimit: 5242880, // 5MB
    });
    
    if (createError) {
      console.error(`Error creating bucket ${bucket}:`, createError);
      return false;
    }
    
    // Set up public access policy for the bucket
    try {
      // Create a dummy signed URL to trigger policy creation
      const { error: signedUrlError } = await supabase.storage.from(bucket).createSignedUrl('dummy.txt', 60);
      
      if (signedUrlError) {
        console.warn(`Warning: Could not create signed URL for bucket ${bucket}:`, signedUrlError);
      }
      
      // Get public URL (this doesn't return an error, just checking if it works)
      const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl('dummy.txt');
      
      if (!publicUrlData || !publicUrlData.publicUrl) {
        console.warn(`Warning: Could not get public URL for bucket ${bucket}`);
      }
    } catch (policyError) {
      // Policy creation might fail but bucket could still be usable
      console.warn(`Warning: Could not set public access policy for bucket ${bucket}:`, policyError);
    }
    
    // Verify bucket was created successfully
    const { error: verifyError } = await supabase.storage.getBucket(bucket);
    if (verifyError) {
      console.error(`Bucket ${bucket} creation verification failed:`, verifyError);
      return false;
    }
    
    console.log(`Bucket ${bucket} created successfully`);
    return true;
  } catch (error) {
    console.error(`Error ensuring bucket ${bucket} exists:`, error);
    return false;
  }
}

/**
 * Get a URL for a file in Supabase Storage
 */
export function getFileUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Upload a file to Supabase Storage
 * @returns The file path if successful, null if failed
 */
export async function uploadFile(
  bucket: string,
  path: string,
  file: File
): Promise<string | null> {
  try {
    // Ensure the bucket exists before uploading
    const bucketExists = await ensureBucketExists(bucket);
    
    if (!bucketExists) {
      console.error(`Cannot upload to non-existent bucket: ${bucket}`);
      return null;
    }

    // Convert file to ArrayBuffer for more reliable uploads
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Try to upload with upsert true to handle potential conflicts
    const { data, error } = await supabase.storage.from(bucket).upload(path, buffer, {
      cacheControl: '3600',
      upsert: true, // Changed to true to overwrite if file exists
      contentType: file.type, // Explicitly set content type
    });

    if (error) {
      console.error('Error uploading file:', error);
      
      // If the error is about the bucket not existing, try to create it again
      if (error.message && error.message.includes('bucket') && error.message.includes('not found')) {
        console.log('Bucket not found, attempting to create it...');
        const retryBucketExists = await ensureBucketExists(bucket);
        
        if (retryBucketExists) {
          // Try upload again
          const retryUpload = await supabase.storage.from(bucket).upload(path, buffer, {
            cacheControl: '3600',
            upsert: true,
            contentType: file.type,
          });
          
          if (retryUpload.error) {
            console.error('Retry upload failed:', retryUpload.error);
            return null;
          }
          
          return retryUpload.data.path;
        }
      }
      
      return null;
    }

    return data.path;
  } catch (error) {
    console.error('Unexpected error in uploadFile:', error);
    return null;
  }
}

/**
 * Delete a file from Supabase Storage
 * @returns true if successful, false if failed
 */
export async function deleteFile(bucket: string, path: string): Promise<boolean> {
  const { error } = await supabase.storage.from(bucket).remove([path]);

  if (error) {
    console.error('Error deleting file:', error);
    return false;
  }

  return true;
} 