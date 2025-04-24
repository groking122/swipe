import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createMeme, checkMonthlyUploadLimit } from '@/services/memeService';
import { uploadFile } from '@/utils/supabase';
import { generateImageHash } from '@/utils/imageHash';

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

    // Check monthly upload limit
    const { allowed, limit, count, remaining } = await checkMonthlyUploadLimit(userId);
    
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

    // 1. Upload image to storage
    const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
    const path = `${userId}/${filename}`;
    const imagePath = await uploadFile('memes', path, file);

    if (!imagePath) {
      return NextResponse.json(
        { error: 'Failed to upload image' },
        { status: 500 }
      );
    }

    // 2. Generate image hash for duplicate detection
    let imageHash;
    try {
      imageHash = await generateImageHash(file);
    } catch (error) {
      console.error('Error generating image hash:', error);
    }

    // Create the meme with new parameter format
    const meme = await createMeme({
      userId,
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