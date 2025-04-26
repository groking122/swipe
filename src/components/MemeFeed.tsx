'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { SwipeCard } from './SwipeCard';
import { handleSwipeAction } from '../app/actions';
import type { Database } from '@/types/supabase'; // Use alias

// Re-define Meme type here or import from a shared types file
type Meme = Database['public']['Tables']['memes']['Row'];

interface MemeFeedProps {
  initialMemes: Meme[];
  initialSupabaseUrl: string; // Pass Supabase URL for image construction
}

export function MemeFeed({ initialMemes, initialSupabaseUrl }: MemeFeedProps) {
  const [visibleMemes, setVisibleMemes] = useState<Meme[]>(initialMemes);
  const [currentIndex, setCurrentIndex] = useState(0); // Index of the top card

  // Function to construct the public URL (can't use server client here)
  const getMemePublicUrl = (filename: string | null): string | null => {
    if (!filename || !initialSupabaseUrl) return null;
    // Construct URL manually for client component
    return `${initialSupabaseUrl}/storage/v1/object/public/meme-images/${filename}`;
  };

  const handleSwipe = async (memeId: string, direction: 'left' | 'right') => {
    console.log(`[Client] Meme ${memeId} swiped ${direction}. Calling action...`);
    try {
      const result = await handleSwipeAction(memeId, direction);
      if (result?.error) {
        console.error("[Client] Swipe action failed:", result.error);
        // Optional: Handle error - maybe don't remove card?
      } else {
        console.log("[Client] Swipe action successful. Removing card.");
        // Remove the swiped meme from the visible stack
        setVisibleMemes((prevMemes) => prevMemes.filter(meme => meme.id !== memeId));
        // You might want to advance currentIndex here as well if needed 
        // depending on how you implement loading more
      }
    } catch (error) {
      console.error("[Client] Error calling swipe action:", error);
      // Optional: Handle error
    }
  };

  // Handle case where memes run out
  if (!visibleMemes || visibleMemes.length === 0) {
      return <p className="text-center text-gray-500 mt-10">No more memes for now!</p>;
  }

  // Get the top meme to render
  const topMeme = visibleMemes[0]; 
  const topMemeImageUrl = getMemePublicUrl(topMeme.image_url);

  return (
    <div className="w-full max-w-md h-[60vh] relative"> {/* Give stack a defined height */} 
      {/* Render only the top card for interaction */} 
      <div
          key={topMeme.id}
          className={`absolute top-0 left-0 w-full h-full transition-opacity duration-300`}
      >
        <SwipeCard memeId={topMeme.id} onSwipe={handleSwipe}> {/* Pass callback */} 
          <div className="relative w-full h-full bg-gray-200 rounded-lg shadow-xl overflow-hidden">
            {topMemeImageUrl && 
              <Image
                src={topMemeImageUrl} 
                alt={topMeme.id}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority={true} // Always prioritize the top card
              />
            }
            {/* Placeholder for Like/Dislike counts */}
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white text-xs p-1 rounded">
                👍 {topMeme.like_count} | 👎 {topMeme.dislike_count}
            </div>
          </div>
        </SwipeCard>
      </div>

      {/* Optional: Render a visual representation of the next card */}
      {visibleMemes.length > 1 && (
        <div 
          key={visibleMemes[1].id} 
          className="absolute top-0 left-0 w-full h-full bg-gray-300 rounded-lg shadow-md transform scale-95 -z-10"
        >
          {/* You could put a placeholder or a blurred version of the next image here */}
        </div>
      )}
    </div>
  );
} 