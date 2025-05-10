"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { motion, useMotionValue, useTransform, type PanInfo, animate } from "framer-motion"
import { Heart, X, ThumbsUp, ThumbsDown, User, Twitter, Globe } from "lucide-react"
import { useMobile } from "../hooks/use-mobile" // Corrected path
import type { Database } from "../types/supabase"; // Assuming path relative to src/components
import { cn } from "../lib/utils"

type Meme = Database['public']['Tables']['memes']['Row'] & { 
  description?: string | null;
  twitter?: string | null;
  website?: string | null;
  // Add optional pre-formatted URL properties
  twitterUrl?: string;
  websiteUrl?: string;
};

interface SwipeCardProps {
  meme: Meme & { title?: string; author?: string; image_url: string | null };
  onSwipe: (id: string, direction: "left" | "right") => void
  isTop: boolean
  index: number
}

export default function SwipeCard({ meme, onSwipe, isTop, index }: SwipeCardProps) {
  const [exitX, setExitX] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)
  const [isMounted, setIsMounted] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null)
  const isMobile = useMobile()

  // Motion values for the card's position, rotation and scale
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const scale = useMotionValue(1)
  const rotate = useTransform(x, [-300, 0, 300], [-30, 0, 30])

  // Transform values for the like/dislike indicators
  const likeOpacity = useTransform(x, [0, 100], [0, 1])
  const dislikeOpacity = useTransform(x, [-100, 0], [1, 0])

  // --- Add useEffect to track mount status ---
  useEffect(() => {
    setIsMounted(true);
  }, []);
  // --- End useEffect ---

  // Handle drag end for both mouse and touch events
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsSwiping(false)

    // Determine swipe threshold based on device type
    const swipeThreshold = isMobile ? 60 : 80

    if (info.offset.x > swipeThreshold) {
      // Swipe right - Like
      setExitX(window.innerWidth + 200)
      animate(scale, 0.8, { duration: 0.2, type: "tween" })
      onSwipe(meme.id, "right")
    } else if (info.offset.x < -swipeThreshold) {
      // Swipe left - Nope
      setExitX(-window.innerWidth - 200)
      animate(scale, 0.8, { duration: 0.2, type: "tween" })
      onSwipe(meme.id, "left")
    } else {
      // Return to center if not swiped far enough
      animate(x, 0, { type: "spring", stiffness: 600, damping: 30 })
      animate(y, 0, { type: "spring", stiffness: 600, damping: 30 })
      animate(scale, 1, { duration: 0.2, type: "tween" })
    }
  }

  // Handle drag start
  const handleDragStart = () => {
    setIsSwiping(true)
    animate(scale, 1.03, { duration: 0.15, type: "tween" })
  }

  // Handle drag movement
  const handleDrag = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // Adjust y position slightly based on x movement for a more natural feel
    const yOffset = Math.abs(info.offset.x) * 0.1
    y.set(yOffset)
  }

  // Reset card position when it's no longer the top card
  useEffect(() => {
    if (!isTop) {
      x.set(0)
      y.set(0)
      rotate.set(0)
      scale.set(1)
    }
  }, [isTop, x, y, rotate, scale])

  // Use fixed height values for better performance
  const imageHeight = isMobile 
    ? "65vh" 
    : "70vh" 

  const [showSwipeHint, setShowSwipeHint] = useState(true);

  // Effect to hide swipe hint after a delay, only for the first card on mobile
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isTop && index === 0 && isMobile && showSwipeHint) {
      timer = setTimeout(() => {
        setShowSwipeHint(false);
      }, 5000); // 5 seconds
    }
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [isTop, index, isMobile, showSwipeHint]);

  // Calculate z-index based on position in the stack (lower index = higher z-index)
  const zIndex = Math.max(0, 100 - index);

  // Apply subtle transforms to cards underneath the top one
  const cardStyle = isTop
    ? {
        x,
        rotate,
        scale,
        zIndex,
        willChange: "transform",
      }
    : {
        x: 0,
        rotate: 0,
        zIndex,
        opacity: isTop ? 1 : 0,
      };

  // Add helper functions for Twitter and Website URLs (similar to MemeCard)
  const getTwitterUrl = (twitter: string): string => {
    if (!twitter) return "";
    if (twitter.startsWith("http")) return twitter;
    // Handle @username format
    const username = twitter.startsWith("@") ? twitter.substring(1) : twitter;
    return `https://twitter.com/${username}`;
  }

  const getWebsiteUrl = (website: string): string => {
    if (!website) return "";
    return website.startsWith("http") ? website : `https://${website}`;
  }

  return (
    <motion.div
      ref={cardRef}
      style={cardStyle} 
      drag={isMounted && isTop}
      dragConstraints={isMounted && isTop ? { left: 0, right: 0, top: 0, bottom: 0 } : false}
      dragElastic={0.7}
      dragTransition={{ power: 0.1, timeConstant: 400 }}
      onDragStart={isMounted && isTop ? handleDragStart : undefined}
      onDrag={isMounted && isTop ? handleDrag : undefined}
      onDragEnd={isMounted && isTop ? handleDragEnd : undefined}
      animate={{ x: exitX }}
      transition={{ type: "tween" }}
      whileTap={isMounted && isTop ? { scale: 1.03 } : {}}
      className={cn(
        "absolute inset-0 overflow-hidden rounded-2xl touch-none",
        "cursor-grab active:cursor-grabbing border shadow-md",
        "bg-white dark:bg-neutral-900 dark:border-neutral-700",
      )}
    >
      {/* Content container */}
      <div className="relative flex h-full w-full flex-col overflow-hidden bg-white dark:bg-neutral-800">
        {/* Title bar */}
        {meme.title && (
          <div className="flex items-center justify-between border-b px-3 py-2 dark:border-neutral-700">
            <h3 className="truncate font-semibold text-sm sm:text-base">{meme.title}</h3>
            {meme.author && (
              <div className="flex flex-shrink-0 items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                <User className="h-3.5 w-3.5" />
                <span>{meme.author}</span>
              </div>
            )}
          </div>
        )}

        {/* Meme image container */}
        <div 
          style={{ height: imageHeight }} 
          className="relative flex-grow overflow-hidden bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center"
        >
          <Image
            src={meme.image_url || "/placeholder.svg?height=600&width=400&query=funny%20meme"}
            alt={meme.title || "Meme"}
            fill
            className="object-contain"
            priority={isTop}
            sizes="(max-width: 640px) 95vw, (max-width: 768px) 80vw, (max-width: 1024px) 60vw, 600px"
            quality={isTop ? 80 : 65}
            loading={isTop ? "eager" : "lazy"}
          />

          {/* Desktop Action Buttons */}
          {isTop && !isSwiping && !isMobile && (
            <div className="absolute bottom-6 left-0 right-0 z-10 mx-auto flex justify-center space-x-10">
              <button
                onClick={() => {
                  setExitX(-window.innerWidth - 200)
                  animate(scale, 0.8, { duration: 0.2 })
                  onSwipe(meme.id, "left")
                }}
                className="flex h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 items-center justify-center rounded-full 
                          bg-white shadow-lg hover:shadow-xl
                          hover:scale-110 active:scale-95 dark:bg-neutral-700"
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-rose-500" />
              </button>
              <button
                onClick={() => {
                  setExitX(window.innerWidth + 200)
                  animate(scale, 0.8, { duration: 0.2 })
                  onSwipe(meme.id, "right")
                }}
                className="flex h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 items-center justify-center rounded-full 
                          bg-white shadow-lg hover:shadow-xl
                          hover:scale-110 active:scale-95 dark:bg-neutral-700"
              >
                <Heart className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-green-500" />
              </button>
            </div>
          )}
          
          {/* Mobile Action Buttons */}
          {isTop && !isSwiping && isMobile && (
            <div className="absolute bottom-4 left-0 right-0 z-10 mx-auto flex justify-center space-x-8">
              <button
                onClick={() => {
                  setExitX(-window.innerWidth - 200) // Animate off-screen
                  animate(scale, 0.8, { duration: 0.2 })
                  onSwipe(meme.id, "left")
                }}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-white/80 dark:bg-neutral-700/80 backdrop-blur-sm shadow-lg active:scale-90 transition-transform"
              >
                <X className="h-7 w-7 text-rose-500" />
              </button>
              <button
                onClick={() => {
                  setExitX(window.innerWidth + 200) // Animate off-screen
                  animate(scale, 0.8, { duration: 0.2 })
                  onSwipe(meme.id, "right")
                }}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-white/80 dark:bg-neutral-700/80 backdrop-blur-sm shadow-lg active:scale-90 transition-transform"
              >
                <Heart className="h-7 w-7 text-green-500" />
              </button>
            </div>
          )}
        </div>

        {/* Description Section */}
        {meme.description && (
          <div className="border-t border-neutral-200 dark:border-neutral-700 p-3 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300">
            <p>{meme.description}</p>
            
            {/* Add Social Links - Only show if either twitter or website exists */}
            {(meme.twitter || meme.website) && (
              <div className="flex items-center gap-3 mt-3">
                {meme.twitter && (
                  <a 
                    href={meme.twitterUrl || getTwitterUrl(meme.twitter)} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[#1DA1F2] hover:text-[#1DA1F2]/80 transition-colors"
                    title={`Twitter: ${meme.twitter}`}
                    onClick={(e) => e.stopPropagation()} // Prevent triggering card swipe
                  >
                    <Twitter className="h-4 w-4" />
                  </a>
                )}
                
                {meme.website && (
                  <a 
                    href={meme.websiteUrl || getWebsiteUrl(meme.website)} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-400 transition-colors"
                    title={`Website: ${meme.website}`}
                    onClick={(e) => e.stopPropagation()} // Prevent triggering card swipe
                  >
                    <Globe className="h-4 w-4" />
                  </a>
                )}
              </div>
            )}
          </div>
        )}

        {/* Like/Dislike Overlays */}
        {isTop && (
          <>
            <motion.div
              className="absolute left-4 sm:left-6 top-4 sm:top-6 rotate-[-30deg] rounded-md border-4 border-green-500 px-3 py-1 sm:px-4 sm:py-1 md:px-6 md:py-2"
              style={{ opacity: likeOpacity }}
            >
              <span className="text-lg sm:text-xl md:text-2xl font-bold text-green-500">LIKE</span>
            </motion.div>

            <motion.div
              className="absolute right-4 sm:right-6 top-4 sm:top-6 rotate-[30deg] rounded-md border-4 border-rose-500 px-3 py-1 sm:px-4 sm:py-1 md:px-6 md:py-2"
              style={{ opacity: dislikeOpacity }}
            >
              <span className="text-lg sm:text-xl md:text-2xl font-bold text-rose-500">NOPE</span>
            </motion.div>
          </>
        )}

        {/* Swipe Instructions - Only on mobile and timed */}
        {isTop && index === 0 && isMobile && showSwipeHint && (
          <div className="absolute left-0 right-0 top-1/2 z-10 flex -translate-y-1/2 justify-center pointer-events-none">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
              className="rounded-full bg-black/60 dark:bg-black/70 px-4 py-2 text-white backdrop-blur-md shadow-lg"
            >
              <p className="text-center text-sm font-medium">Swipe right to like, left to nope</p>
            </motion.div>
          </div>
        )}

        {/* Meme Info Footer */}
        <div className={cn(
          "mt-auto px-4 py-2",
          !meme.description && "border-t border-neutral-200 dark:border-neutral-700"
        )}>
          <div className="flex w-full justify-between text-xs text-neutral-600 dark:text-neutral-400">
            <div className="flex items-center gap-1.5">
              <ThumbsUp className="h-4 w-4 text-green-500" />
              <span className="font-medium">{meme.like_count ?? 0}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ThumbsDown className="h-4 w-4 text-rose-500" />
              <span className="font-medium">{meme.dislike_count ?? 0}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}