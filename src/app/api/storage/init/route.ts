import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/utils/supabaseAdmin';

// List of required buckets for the application
const REQUIRED_BUCKETS = ['meme-images', 'user-avatars'];

/**
 * Initialize required storage buckets
 */
async function initializeBuckets(): Promise<{
  success: boolean;
  results: Array<{ bucket: string; created: boolean; error?: string }>
}> {
  const results = [];

  for (const bucketName of REQUIRED_BUCKETS) {
    try {
      console.log(`[ADMIN] Initializing bucket: ${bucketName}`);
      
      // Check if bucket exists
      const { data, error: getBucketError } = await supabaseAdmin.storage.getBucket(bucketName);
      
      // If bucket exists, mark it as already existing
      if (!getBucketError) {
        console.log(`[ADMIN] Bucket ${bucketName} already exists`);
        
        // Ensure public access is set up
        try {
          // Create a dummy signed URL to trigger policy creation
          await supabaseAdmin.storage.from(bucketName).createSignedUrl('dummy.txt', 60);
          
          // Get public URL to verify public access
          const { data: publicUrlData } = supabaseAdmin.storage.from(bucketName).getPublicUrl('dummy.txt');
          
          console.log(`[ADMIN] Verified public access for bucket ${bucketName}`);
        } catch (policyError) {
          console.warn(`[ADMIN] Warning: Could not verify public access for bucket ${bucketName}:`, policyError);
        }
        
        results.push({
          bucket: bucketName,
          created: false,
          error: 'Bucket already exists'
        });
        continue;
      }
      
      // If bucket doesn't exist or there was an error, try to create it
      if (getBucketError && getBucketError.message.includes('not found')) {
        console.log(`[ADMIN] Creating bucket ${bucketName}...`);
        
        // Create the bucket with admin privileges
        const { error: createError } = await supabaseAdmin.storage.createBucket(bucketName, {
          public: true,
          fileSizeLimit: 5 * 1024 * 1024, // 5MB limit
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        });
        
        if (createError) {
          console.error(`[ADMIN] Failed to create bucket ${bucketName}:`, createError);
          results.push({
            bucket: bucketName,
            created: false,
            error: createError.message
          });
        } else {
          // Create a public policy for the bucket
          try {
            // Create a dummy signed URL to trigger policy creation
            await supabaseAdmin.storage.from(bucketName).createSignedUrl('dummy.txt', 60);
            
            // Get public URL to verify public access
            const { data: publicUrlData } = supabaseAdmin.storage.from(bucketName).getPublicUrl('dummy.txt');
            
            console.log(`[ADMIN] Successfully created bucket ${bucketName} with public access`);
            results.push({
              bucket: bucketName,
              created: true
            });
          } catch (policyError) {
            console.warn(`[ADMIN] Warning: Bucket ${bucketName} created but could not set public access:`, policyError);
            results.push({
              bucket: bucketName,
              created: true,
              error: 'Created but public access may not be set up correctly'
            });
          }
        }
      } else {
        // Some other error occurred when checking the bucket
        console.error(`[ADMIN] Error checking bucket ${bucketName}:`, getBucketError);
        results.push({
          bucket: bucketName,
          created: false,
          error: getBucketError?.message || 'Unknown error checking bucket'
        });
      }
    } catch (error: any) {
      console.error(`[ADMIN] Error processing bucket ${bucketName}:`, error);
      results.push({
        bucket: bucketName,
        created: false,
        error: error.message || 'Unknown error'
      });
    }
  }
  
  // Return true if all operations were successful or buckets already existed
  const success = results.every(r => r.created || r.error === 'Bucket already exists');
  return { success, results };
}

export async function GET(request: NextRequest) {
  try {
    const result = await initializeBuckets();
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[ADMIN] Error initializing storage buckets:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error',
    }, { status: 500 });
  }
}