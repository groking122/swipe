"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { motion, useMotionValue, useTransform, type PanInfo, animate } from "framer-motion"
import { Heart, X, ThumbsUp, ThumbsDown, User } from "lucide-react"
import { useMobile } from "../hooks/use-mobile" // Corrected path
import type { Database } from "../types/supabase"; // Assuming path relative to src/components

type Meme = Database['public']['Tables']['memes']['Row'];

interface SwipeCardProps {
  meme: Meme & { title?: string; author?: string; image_url: string | null }; // Ensure image_url is string | null and add optional title/author
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

  // Scale and shadow effects based on swipe progress
  const cardScale = useTransform(x, [-300, -150, 0, 150, 300], [0.9, 0.95, 1, 0.95, 0.9])

  const boxShadow = useTransform(
    x,
    [-200, -100, 0, 100, 200],
    [
      "0 4px 20px rgba(255, 100, 100, 0.2)",
      "0 4px 20px rgba(255, 100, 100, 0.1)",
      "0 4px 20px rgba(0, 0, 0, 0.1)",
      "0 4px 20px rgba(100, 255, 100, 0.1)",
      "0 4px 20px rgba(100, 255, 100, 0.2)",
    ],
  )

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

  const cardStyle = {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: "16px",
    transformOrigin: "bottom center",
    boxShadow,
    zIndex: isTop ? 10 : 10 - index,
    transform: isTop ? "scale(1) translateY(0)" : `scale(${0.95 - index * 0.05}) translateY(-${index * 10}px)`,
    transition: "transform 0.3s ease",
    scale, // Apply scale motion value
  }

  // Adjust card height for desktop
  const cardHeight = isMobile ? "100%" : "auto"
  // Use explicit vh for mobile image container height, adjust as needed
  const imageHeight = isMobile ? "65vh" : "500px"

  return (
    <motion.div
      ref={cardRef}
      style={{
        ...cardStyle,
        x,
        y,
        rotate,
        scale: isTop ? cardScale : scale,
        height: cardHeight,
      }}
      drag={isTop}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.7}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      animate={{ x: exitX }} // Animate exit
      whileTap={isTop ? { scale: 1.05 } : {}} // Tap animation only for top card
      className="overflow-hidden touch-none bg-white dark:bg-neutral-900 cursor-grab active:cursor-grabbing"
    >
      <div className="relative w-full overflow-hidden rounded-t-2xl bg-white dark:bg-neutral-800">
        {/* Desktop title bar (only on desktop) */}
        {!isMobile && meme.title && (
          <div className="flex items-center justify-between border-b p-4 dark:border-neutral-700">
            <h3 className="text-lg font-semibold">{meme.title}</h3>
            {/* Check for author existence before rendering */}
            {meme.author && (
              <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                <User className="h-4 w-4" />
                <span>{meme.author}</span>
              </div>
            )}
          </div>
        )}

        {/* Meme image */}
        <div style={{ height: imageHeight }} className="relative">
          <Image
            // Use image_url directly (assuming it's now the full URL from MemeFeed)
            src={meme.image_url || "/placeholder.svg?height=600&width=400&query=funny%20meme"}
            alt={meme.title || "Meme"}
            fill
            className="object-cover" // Changed from object-contain
            priority={isTop}
            sizes="(max-width: 768px) 100vw, 600px" // Adjust sizes
          />
        </div>

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
          <div className="absolute left-0 right-0 top-1/2 flex -translate-y-1/2 justify-center">
            <div className="rounded-full bg-black/50 px-4 py-2 text-white backdrop-blur-md">
              <p className="text-center text-sm font-medium">Swipe right to like, left to nope</p>
            </div>
          </div>
        )}

        {/* Meme Info Footer (visible on all cards) */}
        <div className="rounded-b-2xl bg-white p-4 dark:bg-neutral-800">
          <div className="flex justify-between">
            <div className="flex items-center gap-2">
              <ThumbsUp className="h-5 w-5 text-green-400" />
              <span className="font-medium">{meme.like_count ?? 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <ThumbsDown className="h-5 w-5 text-rose-400" />
              <span className="font-medium">{meme.dislike_count ?? 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons (visible on non-touch devices or when not swiping) */}
      {isTop && !isSwiping && (
        <div className="absolute bottom-6 left-0 right-0 mx-auto flex w-48 justify-between md:bottom-8">
          <button
            onClick={() => {
              setExitX(-window.innerWidth - 200)
              animate(scale, 0.8, { duration: 0.2 })
              onSwipe(meme.id, "left")
            }}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-lg transition-transform hover:scale-110 active:scale-95 dark:bg-neutral-700"
          >
            <X className="h-8 w-8 text-rose-500" />
          </button>
          <button
            onClick={() => {
              setExitX(window.innerWidth + 200)
              animate(scale, 0.8, { duration: 0.2 })
              onSwipe(meme.id, "right")
            }}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-lg transition-transform hover:scale-110 active:scale-95 dark:bg-neutral-700"
          >
            <Heart className="h-8 w-8 text-green-500" />
          </button>
        </div>
      )}
    </motion.div>
  )
}