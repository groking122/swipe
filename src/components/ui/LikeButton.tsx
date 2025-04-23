'use client';

import { useState } from 'react';
import Button from './Button';
import { InteractionType } from '@/types';

interface LikeButtonProps {
  memeId: string;
  initialLiked: boolean;
}

export default function LikeButton({ memeId, initialLiked }: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [isLoading, setIsLoading] = useState(false);

  const handleLikeToggle = async () => {
    setIsLoading(true);
    
    try {
      const action = isLiked ? 'delete' : 'create';
      const response = await fetch(`/api/interactions/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          memeId,
          type: 'like' as InteractionType
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to toggle like');
      }

      setIsLiked(!isLiked);
    } catch (error) {
      console.error('Error toggling like:', error);
      // Could add toast notification here
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLikeToggle}
      isLoading={isLoading}
      className={isLiked ? 'text-blue-600' : ''}
    >
      <span className="mr-1">{isLiked ? '❤️' : '👍'}</span>
      {isLiked ? 'Liked' : 'Like'}
    </Button>
  );
} 