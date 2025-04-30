"use client"

import { useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  FlameIcon as Fire,
  Star,
  Coffee,
  Gamepad2,
  Code,
  Laugh,
  Music,
  Film,
  BookOpen,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface CategorySidebarProps {
  onToggle: () => void
  isOpen: boolean
}

// Define categories with icons
const categories = [
  { id: "trending", name: "Trending", icon: <TrendingUp className="h-4 w-4" /> },
  { id: "hot", name: "Hot", icon: <Fire className="h-4 w-4" /> },
  { id: "top", name: "Top Rated", icon: <Star className="h-4 w-4" /> },
  { id: "fresh", name: "Fresh", icon: <Coffee className="h-4 w-4" /> },
  { id: "gaming", name: "Gaming", icon: <Gamepad2 className="h-4 w-4" /> },
  { id: "programming", name: "Programming", icon: <Code className="h-4 w-4" /> },
  { id: "funny", name: "Funny", icon: <Laugh className="h-4 w-4" /> },
  { id: "music", name: "Music", icon: <Music className="h-4 w-4" /> },
  { id: "movies", name: "Movies & TV", icon: <Film className="h-4 w-4" /> },
  { id: "anime", name: "Anime & Manga", icon: <BookOpen className="h-4 w-4" /> },
]

export default function CategorySidebar({ onToggle, isOpen }: CategorySidebarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  // Use a default category if none is selected, adjust 'trending' if needed
  const currentCategory = searchParams?.get("category") || "trending" 
  const [expanded, setExpanded] = useState<string[]>(["featured", "all"]) // Keep both expanded by default maybe?

  const toggleExpanded = (section: string) => {
    setExpanded((current) =>
      current.includes(section) ? current.filter((item) => item !== section) : [...current, section],
    )
  }

  const handleCategoryClick = (categoryId: string) => {
    const params = new URLSearchParams(searchParams?.toString())
    params.set("category", categoryId)
    // Navigate to the root path with the category param
    router.push(`/?${params.toString()}`) 
  }

  // Use a brand color consistent with the target project, assuming 'rose' from previous edits
  const brandClasses = "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400"
  const brandIndicatorClass = "bg-rose-500"

  return (
    <div className="relative flex h-full flex-col">
      {/* Toggle button (Hidden on mobile, positioned for desktop) */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-10 top-4 z-40 hidden rounded-full bg-white shadow-md dark:bg-neutral-800 lg:flex" // Ensure high z-index
        onClick={onToggle}
        aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
      >
        {isOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </Button>

      <div className="p-4">
        <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">Discover</h2>
      </div>

      <ScrollArea className="flex-1 px-2">
        <div className="space-y-4 py-2">
          {/* Featured Categories */}
          <div className="py-2">
            <h3
              className="flex cursor-pointer items-center justify-between px-3 text-sm font-medium text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
              onClick={() => toggleExpanded("featured")}
            >
              <span>Featured</span>
              <ChevronRight
                className={cn("h-4 w-4 transition-transform", expanded.includes("featured") ? "rotate-90" : "")}
              />
            </h3>
            {expanded.includes("featured") && (
              <div className="mt-2 space-y-1">
                {categories.slice(0, 4).map((category) => (
                  <Button
                    key={category.id}
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "relative w-full justify-start overflow-hidden px-3 py-5 text-sm font-normal", // Added relative and overflow-hidden
                      currentCategory === category.id
                        ? brandClasses
                        : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
                    )}
                    onClick={() => handleCategoryClick(category.id)}
                  >
                     {currentCategory === category.id && (
                      <motion.div
                        layoutId="category-indicator-desktop" // Ensure unique layoutId if used elsewhere
                        className={cn("absolute left-0 top-0 h-full w-1 rounded-r-full", brandIndicatorClass)}
                        initial={false} // Prevent initial animation on load
                        animate={{ opacity: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                    <span className="ml-3 mr-2">{category.icon}</span> {/* Added ml-3 for spacing from indicator */}
                    {category.name}
                  </Button>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* All Categories */}
          <div className="py-2">
            <h3
              className="flex cursor-pointer items-center justify-between px-3 text-sm font-medium text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
              onClick={() => toggleExpanded("all")}
            >
              <span>All Categories</span>
              <ChevronRight
                className={cn("h-4 w-4 transition-transform", expanded.includes("all") ? "rotate-90" : "")}
              />
            </h3>
            {expanded.includes("all") && (
              <div className="mt-2 space-y-1">
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "relative w-full justify-start overflow-hidden px-3 py-5 text-sm font-normal", // Added relative and overflow-hidden
                      currentCategory === category.id
                         ? brandClasses
                        : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
                    )}
                    onClick={() => handleCategoryClick(category.id)}
                  >
                    {currentCategory === category.id && (
                       <motion.div
                        layoutId="category-indicator-desktop" // Ensure unique layoutId
                        className={cn("absolute left-0 top-0 h-full w-1 rounded-r-full", brandIndicatorClass)}
                        initial={false}
                        animate={{ opacity: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                     <span className="ml-3 mr-2">{category.icon}</span> {/* Added ml-3 */}
                    {category.name}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  )
} 