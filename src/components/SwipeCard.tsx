'use client';

import { useState } from 'react';
import { useSwipeable } from 'react-swipeable';
import Image from 'next/image';
import { Meme } from '@/types';
import { formatDistanceToNow } from 'date-fns';

interface SwipeCardProps {
  meme: Meme;
  isActive: boolean;
  onSwipe?: (direction: 'left' | 'right') => void;
  className?: string;
}

export default function SwipeCard({ meme, isActive, onSwipe, className = '' }: SwipeCardProps) {
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [exitX, setExitX] = useState<number>(0);
  const [exitY, setExitY] = useState<number>(0);
  
  // Configure swipe handlers
  const handlers = useSwipeable({
    onSwiping: (event) => {
      // Only allow swiping if the card is active
      if (!isActive) return;
      
      // Update card position as user swipes
      setExitX(event.deltaX);
      setExitY(event.deltaY / 10); // Reduce vertical movement
      
      // Determine swipe direction for visual indication
      if (event.deltaX > 30) {
        setSwipeDirection('right');
      } else if (event.deltaX < -30) {
        setSwipeDirection('left');
      } else {
        setSwipeDirection(null);
      }
    },
    onSwiped: (event) => {
      // Only handle swipes if this card is active
      if (!isActive) return;
      
      // If swiped far enough, consider it a full swipe
      if (Math.abs(event.deltaX) > 100) {
        const direction = event.deltaX > 0 ? 'right' : 'left';
        // Trigger the parent component's onSwipe callback
        if (onSwipe) {
          onSwipe(direction);
        }
      } else {
        // Not swiped far enough, reset position
        setExitX(0);
        setExitY(0);
        setSwipeDirection(null);
      }
    },
    preventScrollOnSwipe: true,
    trackMouse: true,
  });

  // Calculate rotation and position based on swipe
  const rotate = exitX * 0.1; // Rotate slightly as user swipes
  const swipeStyle = {
    transform: `translate(${exitX}px, ${exitY}px) rotate(${rotate}deg)`,
    transition: exitX === 0 ? 'transform 0.5s ease' : 'none',
  };
  
  // Add color overlay based on swipe direction
  const overlayClass = 
    swipeDirection === 'right' ? 'bg-green-500 bg-opacity-30' :
    swipeDirection === 'left' ? 'bg-red-500 bg-opacity-30' : '';

  // Calculate time ago
  const timeAgo = formatDistanceToNow(new Date(meme.createdAt), { addSuffix: true });

  return (
    <div 
      {...handlers}
      className={`relative w-full bg-white rounded-xl shadow-lg overflow-hidden cursor-grab ${className}`}
      style={swipeStyle}
    >
      {/* Swipe direction overlay */}
      {swipeDirection && (
        <div className={`absolute inset-0 z-20 ${overlayClass} rounded-xl`}></div>
      )}
      
      {/* Like/Dislike indicators */}
      {swipeDirection === 'right' && (
        <div className="absolute top-4 left-4 z-30 bg-green-500 text-white p-2 rounded-lg font-bold transform -rotate-12">
          LIKE
        </div>
      )}
      {swipeDirection === 'left' && (
        <div className="absolute top-4 right-4 z-30 bg-red-500 text-white p-2 rounded-lg font-bold transform rotate-12">
          NOPE
        </div>
      )}
      
      {/* Meme image */}
      <div className="relative w-full h-96">
        <Image 
          src={meme.imagePath}
          alt={meme.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 500px"
          priority={isActive}
        />
      </div>
      
      {/* Meme info */}
      <div className="p-4">
        <h3 className="font-bold text-lg mb-1">{meme.title}</h3>
        <div className="flex justify-between text-sm text-gray-500">
          <span>by {meme.creator?.username || 'Unknown'}</span>
          <span>{timeAgo}</span>
        </div>
      </div>
    </div>
  );
} 