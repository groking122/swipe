import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createMeme, checkMonthlyUploadLimit } from '@/services/memeService';
import { uploadFile } from '@/utils/supabase';
import { generateImageHash } from '@/utils/imageHash';
import { checkUserExists } from '@/services/serverUserService';

// This config is needed for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

// Define upload limits (should match those in memeService.ts)
const UPLOAD_LIMITS = {
  free: 10,   // Free users: 10 uploads per month
  premium: 50 // Premium users: 50 uploads per month
};

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Process the Clerk user ID - remove 'user_' prefix if it exists
    // This ensures compatibility between Clerk IDs and your database UUID format
    const dbUserId = userId.startsWith('user_') ? userId.replace('user_', '') : userId;

    // Verify user exists in our database
    const userExists = await checkUserExists(dbUserId);
    if (!userExists) {
      console.error(`User ${dbUserId} not found in database. This may be a Clerk ID that hasn't been synced to Supabase yet.`);
      return NextResponse.json(
        { error: 'User account not fully set up in our system. Please try again in a moment.' },
        { status: 400 }
      );
    }

    // Check monthly upload limit - use the processed dbUserId
    const { allowed, limit, count, remaining } = await checkMonthlyUploadLimit(dbUserId);
    
    if (!allowed) {
      return NextResponse.json(
        { 
          error: `Monthly upload limit reached (${count}/${limit})`,
          details: {
            limit,
            count,
            remaining: 0
          },
          isPremiumFeature: count >= UPLOAD_LIMITS.free
        },
        { status: 403 }
      );
    }

    // Parse form data with file
    const formData = await request.formData();
    const title = formData.get('title') as string;
    const file = formData.get('file') as File;
    
    if (!title || !file) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, GIF, and WEBP are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    // 1. Upload image to storage - use the processed dbUserId for the path
    const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
    const path = `${dbUserId}/${filename}`;
    
    // Use 'meme-images' bucket name to match the bucket name in init-storage.js
    const bucketName = 'meme-images';
    
    // Try to upload the file - use let instead of const so we can reassign it if needed
    let imagePath = await uploadFile(bucketName, path, file);

    if (!imagePath) {
      console.error(`Failed to upload image to ${bucketName}/${path}`);
      
      // Try to initialize the storage bucket explicitly
      try {
        const initResponse = await fetch('/api/storage/init', { method: 'GET' });
        const initData = await initResponse.json();
        
        if (initData.success) {
          console.log('Storage buckets initialized, retrying upload...');
          
          // Retry the upload after bucket initialization
          const retryImagePath = await uploadFile(bucketName, path, file);
          
          if (!retryImagePath) {
            return NextResponse.json(
              { error: 'Failed to upload image after storage initialization' },
              { status: 500 }
            );
          }
          
          // Continue with the retry path
          imagePath = retryImagePath;
        } else {
          return NextResponse.json(
            { error: 'Failed to initialize storage buckets' },
            { status: 500 }
          );
        }
      } catch (initError) {
        console.error('Error initializing storage:', initError);
        return NextResponse.json(
          { error: 'Failed to upload image and could not initialize storage' },
          { status: 500 }
        );
      }
    }

    // 2. Generate image hash for duplicate detection
    let imageHash;
    try {
      imageHash = await generateImageHash(file);
    } catch (error) {
      console.error('Error generating image hash:', error);
    }

    // Create the meme with new parameter format - use the processed dbUserId
    const meme = await createMeme({
      userId: dbUserId,
      title,
      imagePath,
      imageHash
    });
    
    if (!meme) {
      return NextResponse.json(
        { error: 'Failed to create meme' },
        { status: 500 }
      );
    }

    // Return success response with upload stats
    return NextResponse.json(
      { 
        success: true,
        message: 'Meme created successfully',
        meme,
        uploadStats: {
          count: count + 1,
          limit,
          remaining: remaining - 1
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating meme:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 