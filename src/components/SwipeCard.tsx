"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { motion, useMotionValue, useTransform, type PanInfo, animate } from "framer-motion"
import { Heart, X, ThumbsUp, ThumbsDown, User } from "lucide-react"
import { useMobile } from "../hooks/use-mobile" // Corrected path
import type { Database } from "../types/supabase"; // Assuming path relative to src/components
import { cn } from "../lib/utils"

type Meme = Database['public']['Tables']['memes']['Row'] & { description?: string | null };

interface SwipeCardProps {
  meme: Meme & { title?: string; author?: string; image_url: string | null };
  onSwipe: (id: string, direction: "left" | "right") => void
  isTop: boolean
  index: number
}

export default function SwipeCard({ meme, onSwipe, isTop, index }: SwipeCardProps) {
  const [exitX, setExitX] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)
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

  // Handle drag end for both mouse and touch events
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsSwiping(false)

    // Determine swipe threshold based on device type
    const swipeThreshold = isMobile ? 80 : 100

    if (info.offset.x > swipeThreshold) {
      // Swipe right - Like
      setExitX(window.innerWidth + 200)
      animate(scale, 0.8, { duration: 0.2 })
      onSwipe(meme.id, "right")
    } else if (info.offset.x < -swipeThreshold) {
      // Swipe left - Nope
      setExitX(-window.innerWidth - 200)
      animate(scale, 0.8, { duration: 0.2 })
      onSwipe(meme.id, "left")
    } else {
      // Return to center if not swiped far enough
      animate(x, 0, { type: "spring", stiffness: 500, damping: 30 })
      animate(y, 0, { type: "spring", stiffness: 500, damping: 30 })
      animate(scale, 1, { duration: 0.2 })
    }
  }

  // Handle drag start
  const handleDragStart = () => {
    setIsSwiping(true)
    animate(scale, 1.05, { duration: 0.2 })
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

  // Adjust card height for desktop
  // Use explicit vh for mobile image container height, adjust as needed
  // Increased desktop height to 600px to match wider container
  const imageHeight = isMobile ? "65vh" : "620px"

  // Calculate z-index based on position in the stack (lower index = higher z-index)
  const zIndex = Math.max(0, 100 - index); // Example: 100 for index 0, 99 for 1, etc.

  // Apply subtle transforms to cards underneath the top one
  const cardStyle = isTop
    ? {
        x,
        rotate,
        scale,
        zIndex, // Apply zIndex to top card as well
      }
    : {
        x: 0, // Reset x for non-top cards
        rotate: 0, // Reset rotate
        zIndex,
        opacity: isTop ? 1 : 0, // Only show top card
      };

  return (
    <motion.div
      ref={cardRef}
      // --- RESTORED STYLES AND PROPS --- 
      style={cardStyle} 
      drag={isTop}
      dragConstraints={isTop ? { left: 0, right: 0, top: 0, bottom: 0 } : false}
      dragElastic={1}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      animate={{ x: exitX }}
      whileTap={isTop ? { scale: 1.05 } : {}}
      // --- END RESTORED --- 
      // Restore original classes, add absolute back, remove m-4
      className={cn(
        "absolute inset-0 overflow-hidden rounded-2xl touch-none bg-white dark:bg-neutral-900 cursor-grab active:cursor-grabbing border dark:border-neutral-700 shadow-md",
        // Keep this condition separate or apply elsewhere if needed
        // !meme.description && "border-t border-neutral-200 dark:border-neutral-700" 
      )}
    >
      <div className="relative flex h-full w-full flex-col overflow-hidden bg-white dark:bg-neutral-800">
        {/* Title bar (Now visible on mobile too if title exists) */}
        {meme.title && (
          <div className="flex items-center justify-between border-b px-3 py-2 dark:border-neutral-700">
            <h3 className="truncate font-semibold text-base">{meme.title}</h3>
            {/* Check for author existence before rendering */}
            {meme.author && (
              <div className="flex flex-shrink-0 items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                <User className="h-3.5 w-3.5" />
                <span>{meme.author}</span>
              </div>
            )}
          </div>
        )}

        {/* Meme image */}
        {/* Added relative positioning to contain the buttons */}
        <div style={{ height: imageHeight }} className="relative flex-grow overflow-hidden bg-neutral-50 dark:bg-neutral-900">
          <Image
            // Use image_url directly (assuming it's now the full URL from MemeFeed)
            src={meme.image_url || "/placeholder.svg?height=600&width=400&query=funny%20meme"}
            alt={meme.title || "Meme"}
            fill
            className="object-contain" // Changed from object-cover to show full image
            priority={isTop}
            sizes="(max-width: 768px) 100vw, 768px" // Adjust sizes to match max-w-2xl roughly (2xl is 768px)
          />

          {/* Action Buttons (Now overlaying image) */}
          {/* Use conditional rendering based on isTop && !isSwiping && !isMobile */}
          {isTop && !isSwiping && !isMobile && (
            <div className="absolute bottom-5 left-0 right-0 z-10 mx-auto flex w-48 justify-between">
              <button
                onClick={() => {
                  setExitX(-window.innerWidth - 200)
                  animate(scale, 0.8, { duration: 0.2 })
                  onSwipe(meme.id, "left")
                }}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-lg hover:shadow-xl transition-all hover:scale-110 active:scale-95 dark:bg-neutral-700"
              >
                <X className="h-8 w-8 text-rose-500" />
              </button>
              <button
                onClick={() => {
                  setExitX(window.innerWidth + 200)
                  animate(scale, 0.8, { duration: 0.2 })
                  onSwipe(meme.id, "right")
                }}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-lg hover:shadow-xl transition-all hover:scale-110 active:scale-95 dark:bg-neutral-700"
              >
                <Heart className="h-8 w-8 text-green-500" />
              </button>
            </div>
          )}
        </div>

        {/* Description Section - NEW */}
        {meme.description && (
          <div className="border-t border-neutral-200 dark:border-neutral-700 p-3 text-sm text-neutral-700 dark:text-neutral-300">
            <p>{meme.description}</p>
          </div>
        )}

        {/* Like/Dislike Overlays */}
        {isTop && (
          <>
            <motion.div
              className="absolute left-6 top-6 rotate-[-30deg] rounded-md border-4 border-green-500 px-6 py-2"
              style={{ opacity: likeOpacity }}
            >
              <span className="text-2xl font-bold text-green-500">LIKE</span>
            </motion.div>

            <motion.div
              className="absolute right-6 top-6 rotate-[30deg] rounded-md border-4 border-rose-500 px-6 py-2"
              style={{ opacity: dislikeOpacity }}
            >
              <span className="text-2xl font-bold text-rose-500">NOPE</span>
            </motion.div>
          </>
        )}

        {/* Swipe Instructions - only shown on first card and on mobile */}
        {isTop && index === 0 && isMobile && (
          <div className="absolute left-0 right-0 top-1/2 z-10 flex -translate-y-1/2 justify-center">
            <div className="rounded-full bg-black/50 px-4 py-2 text-white backdrop-blur-md">
              <p className="text-center text-sm font-medium">Swipe right to like, left to nope</p>
            </div>
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
            {/* Optional: Add a comments button/indicator here if needed later */}
            {/* <button className="flex items-center gap-1.5"><MessageSquare className="h-4 w-4" /> <span></span> </button> */}
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