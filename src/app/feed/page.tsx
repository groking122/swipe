'use client';

import { useEffect, useState } from 'react';
import MemeFeed from '@/components/MemeFeed';
import { getRandomMemes } from '@/services/memeDiscoveryService';
import type { Meme } from '@/types';

export default function FeedPage() {
  const [initialMemes, setInitialMemes] = useState<Meme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadInitialMemes() {
      try {
        const memes = await getRandomMemes(10);
        setInitialMemes(memes);
      } catch (err) {
        console.error('Error loading initial memes:', err);
        setError('Failed to load memes. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    loadInitialMemes();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Meme Feed</h1>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="text-center text-red-500 py-8">
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md"
          >
            Try Again
          </button>
        </div>
      ) : (
        <div className="flex justify-center">
          <MemeFeed initialMemes={initialMemes} />
        </div>
      )}
      
      <div className="mt-8 text-center text-gray-500">
        <p>Swipe right to like, swipe left to skip</p>
      </div>
    </div>
  );
} 