"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { motion, useMotionValue, useTransform, useAnimation, PanInfo } from "framer-motion";
import { Button } from "./ui/button";
import { Share2, ThumbsDown, ThumbsUp, User as UserIcon } from "lucide-react";
import { Meme } from "@/types/types"; // Updated path

interface SwipeCardProps {
  meme: Meme;
  onSwipe: (direction: "left" | "right") => void;
  onRemove: () => void; // Callback to remove the card from the stack
  isTopCard: boolean; // To enable interaction only for the top card
}

const SwipeCard: React.FC<SwipeCardProps> = ({
  meme,
  onSwipe,
  onRemove,
  isTopCard,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const controls = useAnimation();
  const [constrained, setConstrained] = useState(true);

  // Reintroduce rotate transform if needed for visual effect during drag
  const rotate = useTransform(x, [-300, 0, 300], [-20, 0, 20]); // Adjust range/degree as needed
  // Scale effect during drag
  const scale = useTransform(x, [-300, -150, 0, 150, 300], [0.9, 0.95, 1, 0.95, 0.9]); 

  const swipeThreshold = 100;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  const getVote = (childNode: HTMLDivElement, parentNode: HTMLDivElement) => {
    const childRect = childNode.getBoundingClientRect();
    const parentRect = parentNode.getBoundingClientRect();
    let result: "left" | "right" | null = null;

    if (parentRect.left >= childRect.right - swipeThreshold) {
      result = "left";
    } else if (childRect.left + swipeThreshold >= parentRect.right) {
      result = "right";
    }
    return result;
  };

  const flyAway = (decisionDirection: "left" | "right") => {
    setConstrained(false); // Allow card to move freely
    const flyAwayDistance = (direction: number) => {
      // Use a fixed large distance for consistent exit animation
      const parentWidth = cardRef.current?.parentElement?.clientWidth || window.innerWidth;
      return direction * (parentWidth * 1.5);
    };

    controls.start({
      x: flyAwayDistance(decisionDirection === "left" ? -1 : 1),
      transition: { duration: 0.5, ease: "easeOut" },
    });

    setTimeout(() => {
        onRemove(); // Call the remove callback after animation
    }, 300); // Slightly less than animation duration
  };

  const handleDragEnd = (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    if (!isTopCard) return;

    const decisionDirection = getVote(
      cardRef.current as HTMLDivElement,
      cardRef.current?.parentNode as HTMLDivElement
    );
    const swipeConfidence = swipePower(info.offset.x, info.velocity.x);

    // Min velocity requirement or if dragged beyond threshold
    if (
      decisionDirection &&
      (swipeConfidence > 10000 || Math.abs(info.offset.x) > swipeThreshold)
    ) {
      // Swipe confirmed
      flyAway(decisionDirection);
      onSwipe(decisionDirection); // Notify parent of the vote
    } else {
      // Return card to center
      controls.start({
        x: 0,
        transition: { duration: 0.3, ease: "easeOut" },
      });
    }
  };

  const handleVoteClick = (decisionDirection: "left" | "right") => {
    if (!isTopCard) return;
    flyAway(decisionDirection);
    onSwipe(decisionDirection); // Notify parent of the vote
  };

  // Dynamic style calculations for non-transform props
  const getBackgroundColor = () => {
    const currentX = x.get();
    if (currentX < -swipeThreshold / 2) return "rgba(239, 68, 68, 0.1)"; 
    if (currentX > swipeThreshold / 2) return "rgba(34, 197, 94, 0.1)"; 
    return "rgba(255, 255, 255, 0)"; 
  };

  const getIconOpacity = (targetDirection: "left" | "right") => {
    const currentX = x.get();
    const threshold = swipeThreshold * 0.8;
    if (targetDirection === "left" && currentX < -threshold) return 1;
    if (targetDirection === "right" && currentX > threshold) return 1;
    return Math.max(0, Math.abs(currentX) / threshold - 1) * 2; // Fade in faster
  };

  // TODO: Implement actual share functionality
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: meme.title || 'Check out this meme!',
        url: window.location.href, // Or a specific meme URL if available
      }).then(() => {
        console.log('Thanks for sharing!');
      })
      .catch(console.error);
    } else {
      // Fallback for browsers that don't support navigator.share
      alert('Share functionality not supported on this browser.');
    }
  };

  return (
    <motion.div
      ref={cardRef}
      className={`absolute inset-0 flex w-full h-full cursor-grab flex-col overflow-hidden rounded-xl bg-white shadow-lg origin-bottom dark:bg-neutral-800 ${isTopCard ? "pointer-events-auto" : "pointer-events-none"}`}
      drag={isTopCard ? "x" : false}
      dragConstraints={constrained ? { left: 0, right: 0, top: 0, bottom: 0 } : false}
      dragElastic={1}
      style={{ 
        x, 
        rotate, // Use the useTransform value
        scale: isTopCard ? scale : 1, // Apply scale effect only to top card during drag
      }} 
      animate={controls}
      onDrag={() => {
        if (!isTopCard) return;
        cardRef.current?.style.setProperty("--bg-color", getBackgroundColor());
      }}
      onDragEnd={handleDragEnd}
    >
      {/* Background color overlay */}
      <motion.div
        className="absolute inset-0 z-0"
        style={{
          backgroundColor: "var(--bg-color, rgba(255, 255, 255, 0))",
          transition: 'background-color 0.1s ease-out'
        }}
      />

      {/* Card Header */}
      <div className="z-10 flex items-center justify-between border-b border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-800">
        <h3 className="flex-1 truncate text-sm font-semibold">{meme.title || "Untitled Meme"}</h3>
        {meme.user && (
            <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                <UserIcon className="h-3.5 w-3.5" />
                <span>{meme.user.username || 'Anonymous'}</span>
            </div>
        )}
      </div>

      {/* Meme Image */}
      <div className="relative flex-grow overflow-hidden bg-neutral-100 dark:bg-neutral-700"> {/* Added background color for image container */}
        <Image
          src={meme.image_url || "/placeholder.svg"} // Use placeholder if no image
          alt={meme.title || "Meme"}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="pointer-events-none object-contain"
          priority={isTopCard} // Prioritize loading the top card image
        />
        {/* Swipe direction indicators (subtle) */}
         <motion.div
          className="absolute left-4 top-1/2 -translate-y-1/2 transform rounded-full bg-rose-500/80 p-3 text-white shadow-lg"
          style={{ opacity: getIconOpacity("left") }}
        >
          <ThumbsDown className="h-6 w-6" />
        </motion.div>
        <motion.div
          className="absolute right-4 top-1/2 -translate-y-1/2 transform rounded-full bg-emerald-500/80 p-3 text-white shadow-lg"
          style={{ opacity: getIconOpacity("right") }}
        >
          <ThumbsUp className="h-6 w-6" />
        </motion.div>
      </div>

      {/* Action Buttons Row - Updated Layout */}
      <div className="z-10 flex items-center justify-between border-t border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-800">
        {/* Like/Dislike Buttons & Counts */}
        <div className="flex items-center gap-3">
          {/* Like Button + Count */}
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full text-emerald-500 hover:bg-emerald-100/50 hover:text-emerald-600 active:scale-90 dark:hover:bg-emerald-900/20 dark:active:bg-emerald-900/30"
            onClick={() => handleVoteClick("right")}
            disabled={!isTopCard}
            aria-label="Like meme"
          >
            <ThumbsUp className="h-5 w-5" />
          </Button>
          <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{meme.like_count ?? 0}</span>

          {/* Dislike Button + Count */}
          <Button
            variant="ghost"
            size="icon"
            className="ml-2 h-10 w-10 rounded-full text-rose-500 hover:bg-rose-100/50 hover:text-rose-600 active:scale-90 dark:hover:bg-rose-900/20 dark:active:bg-rose-900/30"
            onClick={() => handleVoteClick("left")}
            disabled={!isTopCard}
            aria-label="Dislike meme"
          >
            <ThumbsDown className="h-5 w-5" />
          </Button>
          <span className="text-sm font-medium text-rose-600 dark:text-rose-400">{meme.dislike_count ?? 0}</span>
        </div>

        {/* Share Button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full text-neutral-500 hover:bg-neutral-100 hover:text-neutral-600 active:scale-90 dark:text-neutral-400 dark:hover:bg-neutral-700/50 dark:active:bg-neutral-700/70"
          onClick={handleShare} // Use the new share handler
          disabled={!isTopCard}
          aria-label="Share meme"
        >
          <Share2 className="h-5 w-5" />
        </Button>
      </div>
    </motion.div>
  );
};

export default SwipeCard; 