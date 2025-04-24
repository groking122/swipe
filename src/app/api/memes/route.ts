import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Initialize Supabase client with environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Bucket name for storing meme images
const MEME_BUCKET = 'meme-images';

// Ensure the bucket exists before trying to upload
async function ensureBucketExists(bucketName: string): Promise<boolean> {
  try {
    // Check if the bucket exists
    const { data: bucket, error: getBucketError } = await supabase.storage
      .getBucket(bucketName);
    
    // If bucket doesn't exist, create it
    if (getBucketError && getBucketError.message.includes('not found')) {
      console.log(`Creating bucket: ${bucketName}`);
      const { error: createError } = await supabase.storage
        .createBucket(bucketName, {
          public: true,
          fileSizeLimit: 5 * 1024 * 1024 // 5MB limit
        });
      
      if (createError) {
        console.error(`Failed to create bucket ${bucketName}:`, createError);
        return false;
      }
      
      // Set public access to the bucket
      const { error: policyError } = await supabase.storage
        .from(bucketName)
        .createSignedUrl('dummy.txt', 1); // This is just to trigger policy creation
      
      console.log(`Bucket ${bucketName} created successfully`);
      return true;
    } else if (getBucketError) {
      console.error(`Error checking bucket ${bucketName}:`, getBucketError);
      return false;
    }
    
    console.log(`Bucket ${bucketName} already exists`);
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

    // Upload file to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(MEME_BUCKET)
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: '3600',
      });

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload image' },
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