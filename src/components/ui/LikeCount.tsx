'use client';

import { useState, useEffect } from 'react';

interface LikeCountProps {
  memeId: string;
}

export default function LikeCount({ memeId }: LikeCountProps) {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLikeCount = async () => {
      try {
        const response = await fetch(`/api/interactions/count?memeId=${memeId}&type=like`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch like count');
        }
        
        const data = await response.json();
        setCount(data.count);
      } catch (error) {
        console.error('Error fetching like count:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLikeCount();

    // Set up polling to update the like count periodically
    const intervalId = setInterval(fetchLikeCount, 10000); // Poll every 10 seconds
    
    return () => clearInterval(intervalId);
  }, [memeId]);

  if (isLoading) {
    return <span className="text-gray-400">...</span>;
  }

  return (
    <span className="font-medium">
      {count}
    </span>
  );
} 