import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
      // Check if bucket exists
      const { data, error: getBucketError } = await supabase.storage.getBucket(bucketName);
      
      // If bucket doesn't exist or there was an error, try to create it
      if (getBucketError) {
        // Create the bucket
        const { error: createError } = await supabase.storage.createBucket(bucketName, {
          public: true,
          fileSizeLimit: 5 * 1024 * 1024 // 5MB limit
        });
        
        if (createError) {
          console.error(`Failed to create bucket ${bucketName}:`, createError);
          results.push({ 
            bucket: bucketName, 
            created: false, 
            error: createError.message 
          });
        } else {
          // Create a public policy for the bucket
          const { error: policyError } = await supabase.storage.from(bucketName)
            .createSignedUrl('__dummy__', 1); // Just to trigger policy creation
            
          results.push({ 
            bucket: bucketName, 
            created: true 
          });
        }
      } else {
        results.push({ 
          bucket: bucketName, 
          created: false, 
          error: 'Bucket already exists' 
        });
      }
    } catch (error: any) {
      console.error(`Error processing bucket ${bucketName}:`, error);
      results.push({ 
        bucket: bucketName, 
        created: false, 
        error: error.message || 'Unknown error' 
      });
    }
  }
  
  // Return true if all operations were successful
  const success = results.every(r => r.created || r.error === 'Bucket already exists');
  return { success, results };
}

export async function GET(request: NextRequest) {
  try {
    const result = await initializeBuckets();
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error initializing storage buckets:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error',
    }, { status: 500 });
  }
} 