import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Initialize Supabase client with environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Bucket name for storing meme images - ensure this is consistent across the application
const MEME_BUCKET = 'meme-images';

// Ensure the bucket exists before trying to upload
async function ensureBucketExists(bucketName: string): Promise<boolean> {
  try {
    console.log(`Checking if bucket ${bucketName} exists...`);
    
    // Check if the bucket exists
    const { data: bucket, error: getBucketError } = await supabase.storage
      .getBucket(bucketName);
    
    // If bucket exists, return true
    if (!getBucketError) {
      console.log(`Bucket ${bucketName} already exists`);
      return true;
    }
    
    // If error is not "Bucket not found", log and return false
    if (getBucketError && !getBucketError.message.includes('not found')) {
      console.error(`Error checking bucket ${bucketName}:`, getBucketError);
      return false;
    }
    
    // Bucket not found, try to create it
    console.log(`Creating bucket: ${bucketName}`);
    
    // Create the bucket
    const { error: createError } = await supabase.storage
      .createBucket(bucketName, {
        public: true,
        fileSizeLimit: 5 * 1024 * 1024 // 5MB limit
      });
    
    if (createError) {
      console.error(`Failed to create bucket ${bucketName}:`, createError);
      return false;
    }
    
    // Set up public access policy for the bucket
    try {
      // Create a dummy signed URL to trigger policy creation
      const { error: signedUrlError } = await supabase.storage
        .from(bucketName)
        .createSignedUrl('dummy.txt', 60);
      
      if (signedUrlError) {
        console.warn(`Warning: Could not create signed URL for bucket ${bucketName}:`, signedUrlError);
      }
      
      // Get public URL to verify public access
      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl('dummy.txt');
      
      if (!publicUrlData || !publicUrlData.publicUrl) {
        console.warn(`Warning: Could not get public URL for bucket ${bucketName}`);
      }
    } catch (policyError) {
      // Policy creation might fail but bucket could still be usable
      console.warn(`Warning: Could not set public access policy for bucket ${bucketName}:`, policyError);
    }
    
    // Verify bucket was created successfully
    const { error: verifyError } = await supabase.storage.getBucket(bucketName);
    if (verifyError) {
      console.error(`Bucket ${bucketName} creation verification failed:`, verifyError);
      return false;
    }
    
    console.log(`Bucket ${bucketName} created successfully`);
    return true;
  } catch (error) {
    console.error(`Error in ensureBucketExists for ${bucketName}:`, error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated using Clerk
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const title = formData.get('title') as string;
    const file = formData.get('file') as File;

    // Validate title
    if (!title || title.length < 5 || title.length > 100) {
      return NextResponse.json(
        { error: 'Title must be between 5 and 100 characters' },
        { status: 400 }
      );
    }

    // Validate file
    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file type
    const acceptedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!acceptedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'File type not supported. Please upload JPEG, PNG, GIF, or WebP.' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 5MB limit' },
        { status: 400 }
      );
    }

    // Ensure the bucket exists before uploading
    const bucketExists = await ensureBucketExists(MEME_BUCKET);
    if (!bucketExists) {
      return NextResponse.json(
        { error: 'Failed to create storage bucket' },
        { status: 500 }
      );
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Upload file to Supabase Storage with retry logic
    let uploadError;
    let uploadSuccess = false;
    
    // First attempt
    const uploadResult = await supabase.storage
      .from(MEME_BUCKET)
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: true, // Use upsert to handle potential conflicts
      });
    
    uploadError = uploadResult.error;
    
    // If first attempt failed, try to initialize the bucket and retry
    if (uploadError) {
      console.error('Initial upload attempt failed:', uploadError);
      
      // Try to ensure the bucket exists again
      const bucketReinitialized = await ensureBucketExists(MEME_BUCKET);
      
      if (bucketReinitialized) {
        console.log('Bucket reinitialized, retrying upload...');
        
        // Retry the upload
        const retryResult = await supabase.storage
          .from(MEME_BUCKET)
          .upload(filePath, buffer, {
            contentType: file.type,
            cacheControl: '3600',
            upsert: true,
          });
        
        if (!retryResult.error) {
          console.log('Retry upload successful');
          uploadSuccess = true;
        } else {
          console.error('Retry upload failed:', retryResult.error);
          uploadError = retryResult.error;
        }
      }
    } else {
      uploadSuccess = true;
    }

    if (!uploadSuccess) {
      console.error('Error uploading file after retries:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload image', details: uploadError?.message },
        { status: 500 }
      );
    }

    // Get the public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from(MEME_BUCKET)
      .getPublicUrl(filePath);

    // Create meme record in database
    const { data: meme, error: dbError } = await supabase
      .from('memes')
      .insert([
        {
          title,
          image_path: filePath,
          user_id: userId,
          status: 'active',
        },
      ])
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to create meme record' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Meme uploaded successfully',
      meme,
    }, { status: 201 });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 