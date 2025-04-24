import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createInteraction } from '@/services/interactionService';
import type { InteractionType } from '@/types';

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

    // Get request body
    const body = await request.json();
    const { memeId, type } = body;
    
    if (!memeId || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate interaction type
    const validTypes: InteractionType[] = ['like', 'share', 'save'];
    if (!validTypes.includes(type as InteractionType)) {
      return NextResponse.json(
        { error: 'Invalid interaction type' },
        { status: 400 }
      );
    }

    // Create the interaction
    const interaction = await createInteraction({
      userId,
      memeId,
      type: type as InteractionType
    });
    
    if (!interaction) {
      return NextResponse.json(
        { error: 'Failed to create interaction' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        success: true,
        message: 'Interaction created successfully',
        interaction
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating interaction:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 