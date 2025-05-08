"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { Heart, Share2, Award, MessageCircle } from "lucide-react"
// Update imports for target project
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils" 
import type { Meme } from "@/types/meme" // Use shared type
import { formatDistanceToNow } from "date-fns"
import { motion } from "framer-motion"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface MemeCardProps {
  meme: Meme
  rank?: number | null // Rank is optional
  onLike?: () => void; // Made onLike optional
}

export function MemeCard({ meme, rank = null, onLike }: MemeCardProps) {
  const [liked, setLiked] = useState(false) // Consider persisting like state if needed
  const [showShareTooltip, setShowShareTooltip] = useState(false)
  const likeButtonRef = useRef<HTMLButtonElement>(null)

  // Handle like with animation
  const handleLike = () => {
    if (!liked) {
      setLiked(true)
      onLike?.() // Call parent handler only if it exists

      // Improved heart burst animation (client-side only)
      if (likeButtonRef.current && typeof document !== 'undefined') {
        const button = likeButtonRef.current
        const rect = button.getBoundingClientRect()

        for (let i = 0; i < 5; i++) {
          const heart = document.createElement("div")
          heart.innerHTML = "❤️"
          heart.className = "absolute text-sm pointer-events-none z-50"
          // Position heart at the center of the button initially
          heart.style.left = `${rect.width / 2}px`
          heart.style.top = `${rect.height / 2}px`
          heart.style.transform = "translate(-50%, -50%)"
          heart.style.opacity = "1"
          button.appendChild(heart)

          const angle = Math.random() * Math.PI * 2
          const distance = 20 + Math.random() * 30
          const x = Math.cos(angle) * distance
          const y = Math.sin(angle) * distance

          heart.animate(
            [
              { transform: "translate(-50%, -50%) scale(0.5)", opacity: 1 },
              { transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(1.5)`, opacity: 0 },
            ],
            {
              duration: 700 + Math.random() * 300,
              easing: "cubic-bezier(0.1, 0.7, 1.0, 0.1)",
              fill: "forwards", // Keep final state
            }
          ).onfinish = () => heart.remove()
        }
      }
    }
  }

  // Handle share (Web Share API or fallback to clipboard)
  const handleShare = async () => {
    const shareData = {
      title: meme.title,
      text: meme.description,
      // Ensure URL is correctly formed for the target environment
      url: typeof window !== 'undefined' ? `${window.location.origin}/meme/${meme.id}` : '#' 
    }
    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareData.url)
        setShowShareTooltip(true)
        setTimeout(() => setShowShareTooltip(false), 2000)
      }
    } catch (error) {
      console.error("Failed to share:", error)
      // Optionally show an error toast
    }
  }

  // Determine rank styles
  const getRankColor = () => {
    if (rank === 1) return "text-yellow-400 border-yellow-400/50 bg-yellow-400/10"
    if (rank === 2) return "text-gray-300 border-gray-300/50 bg-gray-300/10"
    if (rank === 3) return "text-amber-600 border-amber-600/50 bg-amber-600/10"
    return "text-zinc-500 border-zinc-500/50 bg-zinc-500/10"
  }

  // Safely format date
  const formattedDate = meme.createdAt 
    ? formatDistanceToNow(new Date(meme.createdAt), { addSuffix: true }) 
    : "Unknown date";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -5 }}
      className="h-full flex flex-col" // Ensure full height and flex layout
    >
      <Card
        className={cn(
          "flex flex-col flex-grow overflow-hidden transition-all duration-300", // Removed bg-zinc-800/80 and border-zinc-700/50
          "hover:shadow-lg dark:hover:shadow-xl dark:hover:shadow-rose-900/20 group backdrop-blur-sm", // Added light mode hover, scoped existing to dark
          "focus-within:ring-2 focus-within:ring-rose-500 focus-within:ring-offset-2 focus-within:ring-offset-zinc-900 dark:focus-within:ring-offset-background" // Adjusted ring offset for dark mode potentially
        )}
      >
        <div className="relative">
          {rank !== null && (
            <div
              className={cn(
                "absolute top-3 left-3 z-10 flex items-center justify-center w-8 h-8 rounded-full border",
                "shadow-lg transition-transform duration-300 group-hover:scale-110",
                getRankColor()
              )}
              aria-label={`Rank ${rank}`}
            >
              {rank <= 3 ? (
                <Award className="w-4 h-4" aria-hidden="true" />
              ) : (
                <span className="text-sm font-bold">{rank}</span>
              )}
            </div>
          )}
          {/* Image container */}
          <div className="relative aspect-square overflow-hidden bg-zinc-900">
            <Image
              src={meme.imageUrl || "/placeholder.svg"} // Ensure placeholder exists
              alt={meme.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" // Adjusted sizes
              priority={rank !== null && rank <= 3} // Prioritize loading images for top ranks
            />
            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          </div>
        </div>

        {/* Content Section - flex-grow to push footer down */}
        <CardContent className="p-4 flex-grow">
          <h3 className="text-lg font-semibold truncate" title={meme.title}>
            {meme.title}
          </h3>
          <p className="text-muted-foreground text-sm line-clamp-2 h-10 mt-1 mb-2" title={meme.description}>
            {meme.description}
          </p>
          <div className="text-xs text-zinc-500">
            <span>{formattedDate}</span>
          </div>
        </CardContent>

        {/* Footer Section */}
        <CardFooter className="p-4 pt-0 flex justify-between items-center border-t mt-auto">
          <div className="flex items-center gap-1">
            <Button
              ref={likeButtonRef}
              variant="ghost"
              size="icon"
              className={cn(
                "relative overflow-visible rounded-full h-9 w-9",
                "hover:bg-rose-500/10 group/likebtn", 
                liked ? "text-rose-500" : "text-muted-foreground hover:text-rose-400",
                !onLike && "opacity-50 cursor-not-allowed" // Add styling if onLike is not provided
              )}
              onClick={onLike ? handleLike : undefined} // Only attach onClick if onLike is provided
              disabled={!onLike} // Disable button if onLike is not provided
              aria-label={liked ? "Unlike meme" : "Like meme"} 
              aria-pressed={liked}
            >
              <Heart
                className={cn(
                  "w-5 h-5 transition-all duration-200 ease-in-out",
                  liked ? "fill-current scale-110" : "fill-transparent group-hover/likebtn:scale-110"
                )}
                strokeWidth={liked ? 0 : 2} // Fill when liked, stroke otherwise
              />
              {/* Optional: Add a subtle background pulse on like? */}
            </Button>
            <motion.span
              key={meme.likes} // Animate count changes
              initial={{ y: 5, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
              className="font-medium text-sm min-w-[2ch] text-left" // Ensure consistent width
            >
              {meme.likes.toLocaleString()}
            </motion.span>
          </div>

          <div className="flex items-center gap-1">
            {/* Placeholder for comments button/link */}
            <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 text-zinc-400 hover:text-white hover:bg-zinc-700/50" aria-label="View comments">
              <MessageCircle className="w-5 h-5" />
            </Button>

            <TooltipProvider delayDuration={300}>
              <Tooltip open={showShareTooltip}>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 text-zinc-400 hover:text-white hover:bg-zinc-700/50" onClick={handleShare} aria-label="Share this meme">
                    <Share2 className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Link copied!</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  )
} 