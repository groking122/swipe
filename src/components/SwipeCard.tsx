'use client'

import React, { useState, ReactNode } from 'react';
import { useSwipeable } from 'react-swipeable';

interface SwipeCardProps {
  children: ReactNode;
  memeId: string;
  onSwipe: (memeId: string, direction: 'left' | 'right') => Promise<void> | void;
}

export const SwipeCard: React.FC<SwipeCardProps> = ({ children, memeId, onSwipe }) => {
  const [deltaX, setDeltaX] = useState(0);
  const [opacity, setOpacity] = useState(1);
  const [transition, setTransition] = useState('transform 0s ease-out'); // No transition during drag
  const [isSwiping, setIsSwiping] = useState(false); // Prevent multiple triggers

  const handlers = useSwipeable({
    onSwiping: (eventData) => {
      if (isSwiping) return;
      setTransition('transform 0s ease-out'); // Ensure no transition while dragging
      setDeltaX(eventData.deltaX);
      // Fade out slightly based on distance, adjust as needed
      const fade = Math.max(0, 1 - Math.abs(eventData.deltaX) / 200);
      setOpacity(fade);
    },
    onSwiped: async (eventData) => { // Mark as async
      if (isSwiping) return;
      setTransition('transform 0.3s ease-out, opacity 0.3s ease-out'); // Add transition for swipe animation
      let direction: 'left' | 'right' | null = null;

      if (Math.abs(eventData.deltaX) > 50) { // Threshold for swipe
        setIsSwiping(true); // Start swiping process
        if (eventData.deltaX > 0) {
          // Swiped Right
          direction = 'right';
          setDeltaX(500); // Animate off screen right
          setOpacity(0);
        } else {
          // Swiped Left
          direction = 'left';
          setDeltaX(-500); // Animate off screen left
          setOpacity(0);
        }

        // Wait for animation, then call the callback prop
        setTimeout(() => {
          if (direction) {
            console.log(`[SwipeCard] Swipe detected: ${direction}. Calling onSwipe prop.`);
            onSwipe(memeId, direction); // Call the function passed from MemeFeed
          } 
          // Don't reset setIsSwiping here, let the parent handle state removal
        }, 300); // Timeout matches animation duration

      } else {
        // Didn't swipe far enough, return to center
        setDeltaX(0);
        setOpacity(1);
      }
    },
    preventScrollOnSwipe: true,
    trackMouse: true,
  });

  const style = {
    transform: `translateX(${deltaX}px) rotate(${deltaX / 10}deg)`,
    opacity: opacity,
    transition: transition,
    touchAction: 'none', // Prevent default browser touch actions like scrolling
  };

  return (
    <div {...handlers} style={style} className="w-full h-full cursor-grab active:cursor-grabbing">
      {children}
    </div>
  );
};