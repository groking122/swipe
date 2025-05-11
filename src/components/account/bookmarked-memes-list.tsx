"use client";

import { useEffect, useState } from 'react';
import type { Meme as CanonicalMeme } from '@/types/meme'; // Use canonical Meme type
import { MemeCard } from '@/components/meme-card'; // Assuming you want to reuse MemeCard
import { SkeletonCard } from '@/components/skeleton-card'; // For loading state

// This type now extends the canonical Meme type
type BookmarkedMemeDisplay = CanonicalMeme; // The API already adds bookmarked_at if needed, and CanonicalMeme has it as optional

export default function BookmarkedMemesList() {
  const [bookmarkedMemes, setBookmarkedMemes] = useState<BookmarkedMemeDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookmarks = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/bookmarks');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch bookmarks');
        }
        const data = await response.json();
        setBookmarkedMemes(data as BookmarkedMemeDisplay[]);
      } catch (e: unknown) {
        const err = e as Error;
        console.error(err);
        setError(err.message || 'Could not load bookmarked memes.');
      }
      setIsLoading(false);
    };

    fetchBookmarks();
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (error) {
    return <p className="text-red-500">Error: {error}</p>;
  }

  if (bookmarkedMemes.length === 0) {
    return <p className="text-neutral-500 dark:text-neutral-400">You haven&apos;t bookmarked any memes yet.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {bookmarkedMemes.map((meme) => (
        <MemeCard key={meme.id} meme={meme} initialIsBookmarked={true} /> 
      ))}
    </div>
  );
} 