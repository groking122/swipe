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
  variant?: "banner" | "sidebar" | "mobile" | "feed"
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
      case "banner":
        return (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="relative overflow-hidden rounded-lg bg-gradient-to-r from-primary/10 to-neutral-50 p-4 dark:from-primary/20 dark:to-neutral-900"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="hidden rounded-lg bg-white p-2 shadow-sm dark:bg-neutral-800 sm:block">
                  <span className="text-xs font-semibold text-primary">AD</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{title}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{description}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  className={`border-dashed transition-all duration-200 ${
                    isHovered ? "border-primary text-primary dark:border-primary dark:text-primary" : ""
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
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={handleDismiss}
                  aria-label="Dismiss ad"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
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
                <div className="absolute bottom-0 left-0 rounded-tr-md bg-primary px-1.5 py-0.5">
                  <span className="text-[10px] font-semibold text-primary-foreground">AD</span>
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
                    isHovered ? "border-primary text-primary dark:border-primary dark:text-primary" : ""
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
              <div className="absolute bottom-0 left-0 rounded-tr-md bg-primary px-2 py-1">
                <span className="text-xs font-semibold text-primary-foreground">AD</span>
              </div>
            </div>

            <div className="p-4">
              <h4 className="font-medium">{title}</h4>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{description}</p>
              <Button
                variant="outline"
                className={`mt-3 w-full border-dashed transition-all duration-200 ${
                  isHovered ? "border-primary text-primary dark:border-primary dark:text-primary" : ""
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
              <div className="absolute bottom-0 left-0 rounded-tr-md bg-primary px-2 py-1">
                <span className="text-xs font-semibold text-primary-foreground">AD</span>
              </div>
            </div>

            <div className="p-4">
              <h4 className="font-medium">{title}</h4>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{description}</p>
              <Button
                variant="outline"
                className={`mt-3 w-full border-dashed transition-all duration-200 ${
                  isHovered ? "border-primary text-primary dark:border-primary dark:text-primary" : ""
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