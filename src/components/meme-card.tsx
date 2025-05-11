"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { Heart, Award, Globe } from "lucide-react"
import { BsTwitterX } from 'react-icons/bs'
// Update imports for target project
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils" 
import type { Meme } from "@/types/meme" // Use shared type
import { formatDistanceToNow } from "date-fns"
import { motion } from "framer-motion"

interface MemeCardProps {
  meme: Meme
  rank?: number | null // Rank is optional
  onLike?: () => void; // Made onLike optional
}

export function MemeCard({ meme, rank = null, onLike }: MemeCardProps) {
  const [liked, setLiked] = useState(false) // Consider persisting like state if needed
  const likeButtonRef = useRef<HTMLButtonElement>(null)

  // Handle Twitter URL format properly
  const getTwitterUrl = (twitter: string): string => {
    if (!twitter) return "";
    if (twitter.startsWith("http")) return twitter;
    // Handle @username format
    const username = twitter.startsWith("@") ? twitter.substring(1) : twitter;
    return `https://twitter.com/${username}`;
  }

  // Format website URL properly
  const getWebsiteUrl = (website: string): string => {
    if (!website) return "";
    return website.startsWith("http") ? website : `https://${website}`;
  }

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

  // Determine rank styles
  const getRankColor = () => {
    if (rank === 1) return "text-yellow-400 border-yellow-400/50 bg-yellow-400/10"
    if (rank === 2) return "text-gray-300 border-gray-300/50 bg-gray-300/10"
    if (rank === 3) return "text-amber-600 border-amber-600/50 bg-amber-600/10"
    return "text-zinc-500 border-zinc-500/50 bg-zinc-500/10"
  }

  // Safely format date
  const formattedDate = meme.created_at // Use standardized created_at
    ? formatDistanceToNow(new Date(meme.created_at), { addSuffix: true })
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
              src={meme.image_url || "/placeholder.svg"} // Use standardized image_url
              alt={meme.title || 'Meme image'} // Handle optional title
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
          <h3 className="text-lg font-semibold truncate" title={meme.title || 'Untitled Meme'}> {/* Handle optional title */}
            {meme.title || "Untitled Meme"}
          </h3>
          {/* Display description only if it exists */}
          {meme.description && (
            <p className="text-muted-foreground text-sm line-clamp-2 h-10 mt-1 mb-2" title={meme.description}>
              {meme.description}
            </p>
          )}
          {/* Fallback for when description is not present to maintain layout */}
          {!meme.description && <div className="h-10 mt-1 mb-2"></div>}
          
          {/* Social links */}
          <div className="flex items-center gap-3 mt-3 mb-2">
            {meme.twitter && (
              <a 
                href={getTwitterUrl(meme.twitter)} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-400 transition-colors"
                title={`X/Twitter: ${meme.twitter}`}
              >
                <BsTwitterX className="h-4 w-4" />
              </a>
            )}
            
            {meme.website && (
              <a 
                href={getWebsiteUrl(meme.website)} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-400 transition-colors"
                title={`Website: ${meme.website}`}
              >
                <Globe className="h-4 w-4" />
              </a>
            )}
          </div>
          
          <div className="text-xs text-zinc-500">
            <span>{formattedDate}</span>
          </div>
        </CardContent>

        {/* Footer Section - Redesigned for better UI */}
        <div className="px-4 py-2 border-t mt-auto flex justify-between">
          <div className="flex items-center gap-1.5">
            <Heart
              className={cn(
                "w-4 h-4 transition-all duration-200",
                liked ? "fill-rose-500 text-rose-500" : "text-neutral-500",
                !onLike && "opacity-50"
              )}
              strokeWidth={1.5}
              onClick={onLike ? handleLike : undefined}
              role="button"
              aria-label={liked ? "Unlike meme" : "Like meme"}
              tabIndex={onLike ? 0 : -1}
              style={{ cursor: onLike ? 'pointer' : 'not-allowed' }}
            />
            <span className="text-xs font-medium text-neutral-500">
              {(meme.like_count ?? 0).toLocaleString()} {/* Use standardized like_count */}
            </span>
          </div>
        </div>
      </Card>
    </motion.div>
  )
} 