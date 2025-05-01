'use client';

import React, { useState, useEffect } from 'react';
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
  const [isLoading, setIsLoading] = useState(true); // Add loading state
  const [error, setError] = useState<string | null>(null); // Add error state
  const { toast } = useToast(); // Initialize toast
  const isMobile = useMobile(); // Initialize mobile hook
  const { user, isLoaded, isSignedIn } = useUser(); // Get user object
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false); // State for modal

  // --- Fetch Feed Data ---
  useEffect(() => {
    // Ensure Clerk is loaded and user is signed in
    if (isLoaded && !isSignedIn) {
      console.log("[MemeFeed] User not signed in. Not fetching feed.");
      setIsLoading(false); // Stop loading if user isn't signed in
      // Optionally clear memes if they shouldn't see any when logged out
      // setVisibleMemes([]);
      return;
    }

    if (isLoaded && isSignedIn && user) {
      const fetchFeed = async () => {
        setIsLoading(true);
        setError(null);
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;

        if (!backendUrl) {
          console.error("[MemeFeed] NEXT_PUBLIC_BACKEND_API_URL is not defined.");
          setError("Configuration error: Backend URL missing.");
          setIsLoading(false);
          return;
        }

        try {
          const userId = user.id; // Get user ID from Clerk's user object
          const url = `${backendUrl}/feed/${userId}`;
          console.log(`[MemeFeed] USING BACKEND URL: ${backendUrl}`);
          console.log(`[MemeFeed] Fetching feed from: ${url}`);

          const response = await fetch(url);

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch feed: ${response.status} ${response.statusText}. Body: ${errorText}`);
          }

          const memesData: Meme[] = await response.json();
          console.log(`[MemeFeed] Received ${memesData.length} memes from backend.`);
          setVisibleMemes(memesData); // Set the fetched memes

        } catch (err) {
          console.error("[MemeFeed] Error fetching feed:", err);
          setError(err instanceof Error ? err.message : "An unknown error occurred while fetching the feed.");
          setVisibleMemes([]); // Clear memes on error
        } finally {
          setIsLoading(false);
        }
      };

      fetchFeed();
    }
    // Dependencies: Run when Clerk status changes or user object becomes available
  }, [isLoaded, isSignedIn, user]);
  // --- End Fetch Feed Data ---

  const handleSwipe = async (memeId: string, direction: 'left' | 'right') => {
    if (!isLoaded) return; // Don't do anything if Clerk hasn't loaded

    if (!isSignedIn) {
      setIsLoginModalOpen(true); // Open the modal if not signed in
      return;
    }

    const swipedMeme = visibleMemes.find(m => m.id === memeId);
    console.log(`[Client] Meme ${memeId} (${swipedMeme?.title || 'no title'}) swiped ${direction}.`); // Improved log
    // Optimistically remove the card from the UI
    setVisibleMemes((prevMemes) => prevMemes.filter(meme => meme.id !== memeId));

    toast({
      title: direction === 'right' ? "Liked!" : "Noped!",
      description: `You ${direction === 'right' ? 'liked' : 'passed on'} "${swipedMeme?.title || 'this meme'}"`, // Use title in toast
      variant: direction === 'right' ? "default" : "destructive",
    });

    try {
      // Call the server action (or potentially a direct backend call if preferred)
      const result = await handleSwipeAction(memeId, direction);
      if (result?.error) {
        console.error("[Client] Swipe action failed:", result.error);
        // Revert state if the action failed
        if (swipedMeme) {
             setVisibleMemes(prev => [swipedMeme, ...prev.filter(m => m.id !== memeId)]);
        }
        toast({ title: "Swipe Error", description: result.error, variant: "destructive" });
      } else {
        console.log("[Client] Swipe action successful.");
        // Potentially fetch more memes if the stack is low after a successful swipe
        if (visibleMemes.length <= 3) { // Check length *before* the filter in setVisibleMemes completed
             // fetchMoreMemes(); // Uncomment or implement fetchMore logic here
             console.log("[MemeFeed] Feed low, consider fetching more memes.")
        }
      }
    } catch (error) {
      console.error("[Client] Error calling swipe action:", error);
       // Revert state on unexpected error
      if (swipedMeme) {
           setVisibleMemes(prev => [swipedMeme, ...prev.filter(m => m.id !== memeId)]);
      }
      toast({ title: "Error", description: "Failed to process swipe.", variant: "destructive" });
    }
  };

  // --- Render Loading State ---
  if (isLoading) {
    return (
      <div className="flex h-[70vh] w-full items-center justify-center">
        {/* You can use a Spinner component here */}
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
          <button onClick={() => window.location.reload()} className="mt-4 rounded bg-blue-500 px-4 py-2 text-white">
             Retry
          </button>
        </div>
      </div>
    );
  }
  // --- End Render Error State ---

  // Handle empty state (after loading and no error)
  if (!visibleMemes || visibleMemes.length === 0) {
      return <EmptyFeed />; // Use EmptyFeed component
  }

  return (
    // Adjust container: remove bottom padding
    <>
      <div className={`relative mx-auto ${isMobile ? "h-[70vh] w-full" : "h-[80vh] w-full max-w-2xl"} pt-3 md:pb-24`}>
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
                // Pass the handleSwipe function directly as it matches the expected signature
                onSwipe={handleSwipe}
                // The first item in the *current* visibleMemes array is the top card
                isTop={index === 0}
                // Index for stacking visual (0 = top)
                index={index}
                // Add onRemove prop to handle visual removal in SwipeCard if needed
                // onRemove={() => { /* Logic in SwipeCard handles removal */ }}
              />
            );
          })
        }
      </div>
      {/* Render the modal */}
      <LoginRequiredModal isOpen={isLoginModalOpen} onOpenChange={setIsLoginModalOpen} />
    </>
  );
} 