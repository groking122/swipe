import { NextRequest, NextResponse } from 'next/server';
import { initializeStorageBuckets } from '@/services/memeService';

/**
 * API route to initialize application resources
 * This is called when the application starts
 */
export async function GET(request: NextRequest) {
  try {
    console.log('Initializing application resources...');
    
    // Initialize storage buckets
    const bucketsInitialized = await initializeStorageBuckets();
    
    if (!bucketsInitialized) {
      console.warn('Some storage buckets could not be initialized');
    }
    
    return NextResponse.json({
      success: true,
      message: 'Application resources initialized',
      details: {
        bucketsInitialized
      }
    });
  } catch (error: any) {
    console.error('Error initializing application resources:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error',
    }, { status: 500 });
  }
}