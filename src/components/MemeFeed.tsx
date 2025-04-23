'use client';

import { useState, useEffect, useCallback } from 'react';
import { getRandomMemes } from '@/services/memeDiscoveryService';
import { createInteraction } from '@/services/interactionService';
import SwipeCard from './SwipeCard';
import { useAuth } from '@/hooks/useAuth';
import type { Meme } from '@/types';

interface MemeFeedProps {
  initialMemes?: Meme[];
  batchSize?: number;
}

export default function MemeFeed({ initialMemes = [], batchSize = 10 }: MemeFeedProps) {
  const [memes, setMemes] = useState<Meme[]>(initialMemes);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [allMemesViewed, setAllMemesViewed] = useState(false);
  const { isAuthenticated, user } = useAuth();

  // Function to load more memes
  const loadMoreMemes = useCallback(async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      // Get IDs of memes already in the stack
      const seenMemeIds = memes.map(meme => meme.id);
      // Fetch new unique memes
      const newMemes = await getRandomMemes(batchSize, seenMemeIds);
      
      if (newMemes.length === 0) {
        setAllMemesViewed(true);
      } else {
        setMemes(prevMemes => [...prevMemes, ...newMemes]);
      }
    } catch (error) {
      console.error('Error loading memes:', error);
    } finally {
      setLoading(false);
    }
  }, [memes, batchSize, loading]);

  // Load initial memes if none provided
  useEffect(() => {
    if (initialMemes.length === 0) {
      loadMoreMemes();
    }
  }, [initialMemes.length, loadMoreMemes]);

  // Check if we need to load more memes
  useEffect(() => {
    if (memes.length > 0 && currentIndex >= memes.length - 3 && !allMemesViewed) {
      loadMoreMemes();
    }
  }, [currentIndex, memes.length, loadMoreMemes, allMemesViewed]);

  // Handle swipe actions
  const handleSwipe = useCallback(async (direction: 'left' | 'right') => {
    if (currentIndex >= memes.length) return;
    
    const meme = memes[currentIndex];
    
    // Record interaction if user is authenticated
    if (isAuthenticated && user) {
      try {
        await createInteraction({
          userId: user.id,
          memeId: meme.id,
          type: direction === 'right' ? 'like' : 'dislike',
        });
      } catch (error) {
        console.error('Error recording interaction:', error);
      }
    }
    
    // Move to next meme
    setCurrentIndex(prev => prev + 1);
  }, [currentIndex, memes, isAuthenticated, user]);

  // Current and next meme to display
  const currentMeme = memes[currentIndex];
  const nextMeme = memes[currentIndex + 1];

  // If all memes have been viewed
  if (memes.length > 0 && currentIndex >= memes.length) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">You've seen all the memes!</h2>
        <p className="text-lg text-gray-600 mb-6">Check back later for more content</p>
        <button 
          onClick={() => {
            setCurrentIndex(0);
            setAllMemesViewed(false);
            loadMoreMemes();
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Start Over
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-md mx-auto h-[500px]">
      {loading && memes.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* Next card (displayed underneath) */}
          {nextMeme && (
            <div className="absolute top-4 w-full">
              <SwipeCard meme={nextMeme} isActive={false} />
            </div>
          )}
          
          {/* Current card (on top, swipeable) */}
          {currentMeme && (
            <div className="absolute top-0 w-full z-10">
              <SwipeCard
                meme={currentMeme}
                isActive={true}
                onSwipe={handleSwipe}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
} 