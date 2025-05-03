"use client"

import { useState } from "react"
import Image from "next/image"
import { X, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

export interface AdProps {
  id: string
  title: string
  description: string
  imageUrl: string
  ctaText: string
  ctaUrl: string
  variant?: "banner" | "banner-visual" | "sidebar" | "mobile" | "feed"
  onDismiss: (id: string) => void
}

/**
 * Reusable advertisement component with multiple display variants
 *
 * Image size recommendations:
 * - banner: 1200x150px (8:1 ratio)
 * - sidebar: 300x250px (6:5 ratio)
 * - mobile: 320x100px (16:5 ratio)
 * - feed: 600x300px (2:1 ratio)
 */
export default function AdComponent({
  id,
  title,
  description,
  imageUrl,
  ctaText,
  ctaUrl,
  variant = "sidebar",
  onDismiss,
}: AdProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [isHovered, setIsHovered] = useState(false)

  const handleDismiss = () => {
    setIsVisible(false)
    // Animate out before calling the parent dismiss function
    setTimeout(() => onDismiss(id), 300)
  }

  if (!isVisible) return null

  // Determine the layout based on variant
  const getLayout = () => {
    switch (variant) {
      case "banner-visual":
        return (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="relative w-full overflow-hidden rounded-lg aspect-[12/1] bg-neutral-200 dark:bg-neutral-800"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <Image
              src={imageUrl || "/placeholder.svg"}
              alt={title}
              fill
              className="object-cover"
              sizes="(max-width: 1280px) 100vw, 1200px"
            />

            <div className="absolute inset-0 flex items-center justify-end p-2 sm:p-3 md:p-4 space-x-2">
              <Button
                size="sm"
                variant="outline"
                className={`border-neutral-300 bg-white/80 text-neutral-900 backdrop-blur-sm transition-colors hover:bg-white/95 border-dashed dark:bg-black/50 dark:text-white dark:border-neutral-700 dark:hover:bg-black/60 ${
                  isHovered ? "border-neutral-400 dark:border-neutral-500" : "border-neutral-300 dark:border-neutral-700"
                }`}
                asChild
              >
                <a href={ctaUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5">
                  Explore
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full bg-black/20 text-white backdrop-blur-sm transition-colors hover:bg-black/30 dark:bg-white/10 dark:hover:bg-white/20"
                onClick={handleDismiss}
                aria-label="Dismiss ad"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="absolute bottom-1 left-1 rounded bg-black/40 px-1.5 py-0.5 backdrop-blur-sm">
              <span className="text-[10px] font-semibold text-white">AD</span>
            </div>
          </motion.div>
        )

      case "banner":
        return (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="relative w-full overflow-hidden rounded-lg bg-gradient-to-r from-brand-50 to-neutral-50 dark:from-brand-950/40 dark:to-neutral-900"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div className="flex items-center justify-between p-3 sm:p-4 md:p-6 space-x-4">
              <div className="flex-grow min-w-0">
                <p className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100 sm:text-base md:text-lg">{title}</p>
                <p className="truncate text-xs text-neutral-500 dark:text-neutral-400 sm:text-sm">{description}</p>
              </div>

              <div className="flex flex-shrink-0 items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  className={`border-neutral-300 bg-white/70 text-neutral-900 backdrop-blur-sm transition-colors hover:bg-white/90 dark:bg-neutral-800/70 dark:text-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800/90 border-dashed ${
                    isHovered ? "border-neutral-400 dark:border-neutral-600" : "border-neutral-300 dark:border-neutral-700"
                  }`}
                  asChild
                >
                  <a href={ctaUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5">
                    {ctaText}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-neutral-600 hover:bg-neutral-100/50 dark:text-neutral-400 dark:hover:bg-neutral-800/50"
                  onClick={handleDismiss}
                  aria-label="Dismiss ad"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="absolute bottom-1 left-1 rounded bg-brand-500 px-1.5 py-0.5">
              <span className="text-[10px] font-semibold text-white">AD</span>
            </div>
          </motion.div>
        )

      case "mobile":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="relative mb-4 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 z-10 h-6 w-6 rounded-full bg-black/20 text-white backdrop-blur-sm hover:bg-black/30 dark:bg-white/20 dark:hover:bg-white/30"
              onClick={handleDismiss}
              aria-label="Dismiss ad"
            >
              <X className="h-3 w-3" />
            </Button>

            <div className="flex overflow-hidden">
              <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden">
                <Image src={imageUrl || "/placeholder.svg"} alt={title} fill className="object-cover" />
                <div className="absolute bottom-0 left-0 rounded-tr-md bg-brand-500 px-1.5 py-0.5">
                  <span className="text-[10px] font-semibold text-white">AD</span>
                </div>
              </div>

              <div className="flex flex-1 flex-col justify-between p-3">
                <div>
                  <h4 className="font-medium">{title}</h4>
                  <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{description}</p>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  className={`mt-2 w-full border-dashed transition-all duration-200 sm:w-auto ${
                    isHovered ? "border-brand-500 text-brand-600 dark:border-brand-400 dark:text-brand-400" : ""
                  }`}
                  asChild
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                >
                  <a href={ctaUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5">
                    {ctaText}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </Button>
              </div>
            </div>
          </motion.div>
        )

      case "feed":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="relative mb-4 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 z-10 h-6 w-6 rounded-full bg-black/20 text-white backdrop-blur-sm hover:bg-black/30 dark:bg-white/20 dark:hover:bg-white/30"
              onClick={handleDismiss}
              aria-label="Dismiss ad"
            >
              <X className="h-3 w-3" />
            </Button>

            <div className="relative h-40 w-full overflow-hidden">
              <Image src={imageUrl || "/placeholder.svg"} alt={title} fill className="object-cover" />
              <div className="absolute bottom-0 left-0 rounded-tr-md bg-brand-500 px-2 py-1">
                <span className="text-xs font-semibold text-white">AD</span>
              </div>
            </div>

            <div className="p-4">
              <h4 className="font-medium">{title}</h4>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{description}</p>
              <Button
                variant="outline"
                className={`mt-3 w-full border-dashed transition-all duration-200 ${
                  isHovered ? "border-brand-500 text-brand-600 dark:border-brand-400 dark:text-brand-400" : ""
                }`}
                size="sm"
                asChild
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                <a
                  href={ctaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5"
                >
                  {ctaText}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </Button>
            </div>
          </motion.div>
        )

      case "sidebar":
      default:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="relative overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-800"
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 z-10 h-6 w-6 rounded-full bg-black/20 text-white backdrop-blur-sm hover:bg-black/30 dark:bg-white/20 dark:hover:bg-white/30"
              onClick={handleDismiss}
              aria-label="Dismiss ad"
            >
              <X className="h-3 w-3" />
            </Button>

            <div className="relative h-40 w-full overflow-hidden">
              <Image src={imageUrl || "/placeholder.svg"} alt={title} fill className="object-cover" />
              <div className="absolute bottom-0 left-0 rounded-tr-md bg-brand-500 px-2 py-1">
                <span className="text-xs font-semibold text-white">AD</span>
              </div>
            </div>

            <div className="p-4">
              <h4 className="font-medium">{title}</h4>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{description}</p>
              <Button
                variant="outline"
                className={`mt-3 w-full border-dashed transition-all duration-200 ${
                  isHovered ? "border-brand-500 text-brand-600 dark:border-brand-400 dark:text-brand-400" : ""
                }`}
                size="sm"
                asChild
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                <a
                  href={ctaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5"
                >
                  {ctaText}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </Button>
            </div>
          </motion.div>
        )
    }
  }

  return getLayout()
} 