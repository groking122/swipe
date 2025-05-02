"use client"

import { useState, useRef } from "react"
import { usePathname, useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
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
  Search,
  X,
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
  const pathname = usePathname()
  const currentCategory = searchParams?.get("category") || "trending"
  const [expanded, setExpanded] = useState<string[]>(["featured", "all"])
  const [searchQuery, setSearchQuery] = useState("")
  const sidebarRef = useRef<HTMLDivElement>(null)

  const toggleExpanded = (section: string) => {
    setExpanded((current) =>
      current.includes(section) ? current.filter((item) => item !== section) : [...current, section],
    )
  }

  const handleCategoryClick = (categoryId: string) => {
    const params = new URLSearchParams(searchParams?.toString())
    params.set("category", categoryId)
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const brandClasses = "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400"
  const brandIndicatorClass = "bg-rose-500"

  return (
    <div
      ref={sidebarRef}
      className={cn(
        "flex flex-col h-full bg-white dark:bg-neutral-900 z-30",
        "border-r border-neutral-200 dark:border-neutral-800"
      )}
    >
      <div className={cn(
        "sticky top-0 z-10 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800",
        !isOpen && "lg:justify-center"
      )}>
        <div className={cn(
          "flex h-16 items-center justify-between p-4",
          !isOpen && "lg:justify-center"
        )}>
          <h2 className={cn(
            "text-lg font-semibold tracking-tight",
            !isOpen && "lg:hidden"
          )}>
            Discover
          </h2>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
            onClick={onToggle}
            aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
            aria-expanded={isOpen}
            title={isOpen ? "Close sidebar" : "Open sidebar"}
          >
            {isOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            <span className="sr-only">{isOpen ? "Close sidebar" : "Open sidebar"}</span>
          </Button>
        </div>

        <form onSubmit={handleSearch} className={cn(
          "px-4 pb-4",
          !isOpen && "lg:hidden"
        )}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              placeholder="Search memes..."
              className="pl-9 h-9 text-sm pr-9 focus-visible:ring-rose-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search memes"
            />
            {searchQuery && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 rounded-full"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </form>
      </div>

      <ScrollArea className={cn(
        "flex-1 overflow-y-auto",
        !isOpen && "lg:hidden"
      )} id="category-sidebar-content">
        <div className="space-y-4 p-4">
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
                      "relative w-full justify-start overflow-hidden px-3 py-5 text-sm font-normal",
                      currentCategory === category.id
                        ? brandClasses
                        : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
                    )}
                    onClick={() => handleCategoryClick(category.id)}
                  >
                    {currentCategory === category.id && (
                      <motion.div
                        layoutId="category-indicator-desktop"
                        className={cn("absolute left-0 top-0 h-full w-1 rounded-r-full", brandIndicatorClass)}
                        initial={false}
                        animate={{ opacity: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                    <span className="ml-3 mr-2">{category.icon}</span>
                    {category.name}
                  </Button>
                ))}
              </div>
            )}
          </div>

          <Separator />

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
                      "relative w-full justify-start overflow-hidden px-3 py-5 text-sm font-normal",
                      currentCategory === category.id
                         ? brandClasses
                        : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
                    )}
                    onClick={() => handleCategoryClick(category.id)}
                  >
                    {currentCategory === category.id && (
                       <motion.div
                        layoutId="category-indicator-desktop"
                        className={cn("absolute left-0 top-0 h-full w-1 rounded-r-full", brandIndicatorClass)}
                        initial={false}
                        animate={{ opacity: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                     <span className="ml-3 mr-2">{category.icon}</span>
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