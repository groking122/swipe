'use client';

import React, { useState } from 'react';
// Remove Image import if not directly used here anymore
// import Image from 'next/image';
import SwipeCard from './SwipeCard'; // Default import for the new SwipeCard
import { EmptyFeed } from './empty-feed'; // Import EmptyFeed
import { handleSwipeAction } from '../app/actions';
import type { Database } from '../types/supabase'; // Assuming path relative to src/components
import { useToast } from "./ui/use-toast" // Import useToast
import { useMobile } from "../hooks/use-mobile" // Import useMobile

// Re-define Meme type here or import from a shared types file
type Meme = Database['public']['Tables']['memes']['Row'];

interface MemeFeedProps {
  initialMemes: Meme[];
  // initialSupabaseUrl is no longer needed here
  // initialSupabaseUrl: string;
}

export function MemeFeed({ initialMemes }: MemeFeedProps) {
  const [visibleMemes, setVisibleMemes] = useState<Meme[]>(initialMemes);
  const { toast } = useToast(); // Initialize toast
  const isMobile = useMobile(); // Initialize mobile hook

  const handleSwipe = async (memeId: string, direction: 'left' | 'right') => {
    const swipedMeme = visibleMemes.find(m => m.id === memeId);
    console.log(`[Client] Meme ${memeId} (${swipedMeme?.title || 'no title'}) swiped ${direction}.`); // Improved log
    setVisibleMemes((prevMemes) => prevMemes.filter(meme => meme.id !== memeId));
    
    toast({
      title: direction === 'right' ? "Liked!" : "Noped!",
      description: `You ${direction === 'right' ? 'liked' : 'passed on'} "${swipedMeme?.title || 'this meme'}"`, // Use title in toast
      variant: direction === 'right' ? "default" : "destructive",
    });

    try {
      const result = await handleSwipeAction(memeId, direction);
      if (result?.error) {
        console.error("[Client] Swipe action failed:", result.error);
        // TODO: Consider reverting state and showing error toast
        // setVisibleMemes(prev => [swipedMeme, ...prev.filter(m => m.id !== memeId)]); // Example revert
        // toast({ title: "Swipe Error", description: result.error, variant: "destructive" });
      } else {
        console.log("[Client] Swipe action successful.");
      }
    } catch (error) {
      console.error("[Client] Error calling swipe action:", error);
      // TODO: Consider reverting state and showing error toast
    }
  };

  // TODO: Implement fetchMoreMemes logic when stack is low
  // useEffect(() => {
  //   if (visibleMemes.length < 3 && visibleMemes.length > 0) { 
  //     console.log("Would fetch more memes here");
  //     // fetchMoreMemes(); 
  //   }
  // }, [visibleMemes]);

  // Handle empty state
  if (!visibleMemes || visibleMemes.length === 0) {
      return <EmptyFeed />; // Use EmptyFeed component
  }

  return (
    // Adjust container: reduce bottom padding on mobile
    <div className={`relative mx-auto ${isMobile ? "h-[70vh] w-full" : "h-[80vh] w-full max-w-2xl"} pb-12 md:pb-24`}> 
      {visibleMemes.map((meme, index) => {
          // Use the image_url directly from the meme object
          const imageUrl = meme.image_url ?? "/placeholder.svg";

          // Log the direct URL for debugging if needed (only for top card)
          if (index === 0) {
            console.log("[MemeFeed] Using image URL for top card:", imageUrl);
          }

          // Pass the meme data directly (image_url is already correct)
          const memeForCard = { 
            ...meme,
            image_url: imageUrl
            // You can add other fields if needed, e.g., title, description
          };
          
          return (
            <SwipeCard
              key={meme.id}
              meme={memeForCard}
              onSwipe={handleSwipe}
              // The first item in the *current* visibleMemes array is the top card
              isTop={index === 0} 
              // Index for stacking visual (0 = top)
              index={index} 
            />
          );
        })
      }
    </div>
  );
} 