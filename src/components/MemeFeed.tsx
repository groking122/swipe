'use client';

import React, { useState, useEffect, useCallback } from 'react';
// Remove Image import if not directly used here anymore
// import Image from 'next/image';
import SwipeCard from './SwipeCard'; // Default import for the new SwipeCard
import { EmptyFeed } from './empty-feed'; // Import EmptyFeed
import { handleSwipeAction } from '../app/actions';
import type { Database } from '../types/supabase'; // Assuming path relative to src/components
import { useToast } from "./ui/use-toast" // Import useToast
import { useMobile } from "../hooks/use-mobile" // Import useMobile
import { useUser } from '@clerk/nextjs'; // Import useUser
import { LoginRequiredModal } from './login-required-modal'; // Import the modal

// Re-define Meme type here or import from a shared types file
type Meme = Database['public']['Tables']['memes']['Row'];

// Remove initialMemes prop if fetching client-side
// interface MemeFeedProps {
//   initialMemes: Meme[];
// }

// export function MemeFeed({ initialMemes }: MemeFeedProps) { // Adjust props if needed
export function MemeFeed() { // Fetching all client-side
  // const [visibleMemes, setVisibleMemes] = useState<Meme[]>(initialMemes); // Change initial state
  const [visibleMemes, setVisibleMemes] = useState<Meme[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Keep loading state
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const isMobile = useMobile();
  const { user, isLoaded, isSignedIn } = useUser();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // --- Refactored Fetch Feed Data Function ---
  // Wrap in useCallback
  const fetchFeedData = useCallback(async () => {
    // Now depends on user, isLoaded, isSignedIn from outside
    if (!isLoaded || !isSignedIn || !user) {
      setIsLoading(false);
      setVisibleMemes([]);
      console.log("[MemeFeed] Skipping fetch: User not ready or not signed in.");
      return;
    }

    console.log("[MemeFeed] Starting fetchFeedData...");
    setIsLoading(true); // Set loading true when starting fetch
    setError(null);
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;

    if (!backendUrl) {
      console.error("[MemeFeed] NEXT_PUBLIC_BACKEND_API_URL is not defined.");
      setError("Configuration error: Backend URL missing.");
      setIsLoading(false);
      return;
    }

    try {
      const userId = user.id;
      const url = `${backendUrl}/feed/${userId}`;
      console.log(`[MemeFeed] Fetching feed from: ${url}`);

      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch feed: ${response.status} ${response.statusText}. Body: ${errorText}`);
      }

      const memesData: Meme[] = await response.json();
      console.log(`[MemeFeed] Received ${memesData.length} memes from backend.`);
      if (memesData && memesData.length > 0) {
        console.log("[MemeFeed] Data for first received meme:", JSON.stringify(memesData[0]));
      }
      // Replace the current list with the new batch
      setVisibleMemes(memesData); 

    } catch (err) {
      console.error("[MemeFeed] Error fetching feed:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred while fetching the feed.");
      setVisibleMemes([]); // Clear memes on error
    } finally {
      setIsLoading(false); // Set loading false when fetch completes or fails
    }
  }, [user, isLoaded, isSignedIn]); // Add dependencies of fetchFeedData
  // --- End Refactored Fetch Feed Data Function ---

  // --- Initial Fetch Effect ---
  useEffect(() => {
    // Only run initial fetch when user context is loaded
    if (isLoaded) {
       fetchFeedData();
    }
    // Now depends on the memoized fetchFeedData and isLoaded
  }, [isLoaded, fetchFeedData]); 
  // --- End Initial Fetch Effect ---

  // --- REMOVE Effect to Fetch More When Stack is Low ---
  // useEffect(() => {
  //   const LOW_MEME_THRESHOLD = 5;
  //   if (!isLoading && visibleMemes.length > 0 && visibleMemes.length < LOW_MEME_THRESHOLD) {
  //       console.log(`[MemeFeed] Meme stack low (${visibleMemes.length}). Fetching more...`);
  //       fetchFeedData();
  //   }
  // }, [visibleMemes, isLoading]); 
  // --- End Fetch More Effect ---

  const handleSwipe = async (memeId: string, direction: 'left' | 'right') => {
    if (!isLoaded || !isSignedIn) {
      setIsLoginModalOpen(true); 
      return;
    }

    const originalMemes = [...visibleMemes];
    const swipedMeme = originalMemes.find(m => m.id === memeId);

    // Optimistically remove the card from the UI
    setVisibleMemes((prevMemes) => prevMemes.filter(meme => meme.id !== memeId));

    toast({
      title: direction === 'right' ? "Liked!" : "Noped!",
      description: `You ${direction === 'right' ? 'liked' : 'passed on'} "${swipedMeme?.title || 'this meme'}"`, 
      variant: direction === 'right' ? "default" : "destructive",
    });

    try {
      // Only send the swipe action to the backend
      const result = await handleSwipeAction(memeId, direction);
      
      if (result?.error) {
        console.error("[Client] Swipe action failed:", result.error);
        // Revert state if the action failed
        setVisibleMemes(originalMemes); // Revert to original state
        toast({ title: "Swipe Error", description: result.error, variant: "destructive" });
      } else {
        console.log("[Client] Swipe action successful (vote recorded).");
        // --- DO NOT re-fetch data immediately --- 
      }
    } catch (error) {
      console.error("[Client] Error calling swipe action:", error);
       // Revert state on unexpected error
      setVisibleMemes(originalMemes); // Revert to original state
      toast({ title: "Error", description: "Failed to process swipe.", variant: "destructive" });
    }
  };

  // --- Render Loading State --- 
  if (isLoading && visibleMemes.length === 0) { // Only show initial full load indicator
    return (
      <div className="flex h-[70vh] w-full items-center justify-center">
        <p>Loading your smart feed...</p>
      </div>
    );
  }

  // --- Render Error State ---
  if (error) {
    return (
      <div className="flex h-[70vh] w-full items-center justify-center text-center text-red-500">
        <div>
          <p>Failed to load feed:</p>
          <p className="text-sm">{error}</p>
          <button onClick={fetchFeedData} className="mt-4 rounded bg-blue-500 px-4 py-2 text-white">
             Retry Fetch
          </button>
        </div>
      </div>
    );
  }
  // --- End Render Error State ---

  // Handle empty state (after loading and no error)
  if (!isLoading && (!visibleMemes || visibleMemes.length === 0)) {
      // Pass fetchFeedData to EmptyFeed component
      return <EmptyFeed onRefresh={fetchFeedData} />; 
  }

  return (
    <>
     {/* Optional: Add a more subtle loading indicator for re-fetches */}
     {/* {isLoading && visibleMemes.length > 0 && <div className="absolute top-2 left-2 z-50"><Spinner/></div>} */}
      <div className={`relative mx-auto ${isMobile ? "h-[70vh] w-full" : "h-[80vh] w-full max-w-2xl"} pt-3 md:pb-24`}>
        {visibleMemes.map((meme, index) => {
            const imageUrl = meme.image_url ?? "/placeholder.svg";
            const memeForCard = { ...meme, image_url: imageUrl };
            
            return (
              <SwipeCard
                key={meme.id} // Using meme.id should be fine unless fetch returns same memes with diff order
                meme={memeForCard}
                onSwipe={handleSwipe}
                isTop={index === 0}
                index={index}
              />
            );
          })
        }
      </div>
      <LoginRequiredModal isOpen={isLoginModalOpen} onOpenChange={setIsLoginModalOpen} />
    </>
  );
} 