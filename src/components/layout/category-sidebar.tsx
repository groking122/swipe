"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
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
  List
} from "lucide-react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import type { CategoryInfo as FetchedCategoryInfo } from "@/app/api/categories/route"

interface CategorySidebarProps {
  onToggle: () => void
  isOpen: boolean
}

// Define a type for our sidebar categories, which might include a predefined icon
interface SidebarCategory extends FetchedCategoryInfo {
  icon?: React.ReactNode;
}

// Predefined "Featured" categories (can be adjusted or made dynamic later)
const featuredCategories: SidebarCategory[] = [
  { id: "trending", name: "Trending", slug: "trending", icon: <TrendingUp className="h-4 w-4" /> },
  { id: "hot", name: "Hot", slug: "hot", icon: <Fire className="h-4 w-4" /> },
  { id: "top-rated", name: "Top Rated", slug: "top-rated", icon: <Star className="h-4 w-4" /> }, // Assuming slug 'top-rated' for consistency
  { id: "fresh", name: "Fresh", slug: "fresh", icon: <Coffee className="h-4 w-4" /> },
];

// Placeholder icons for dynamic categories - can be mapped or a default used
const dynamicCategoryIcons: { [key: string]: React.ReactNode } = {
  gaming: <Gamepad2 className="h-4 w-4" />,
  programming: <Code className="h-4 w-4" />,
  funny: <Laugh className="h-4 w-4" />,
  music: <Music className="h-4 w-4" />,
  movies: <Film className="h-4 w-4" />, // Assuming 'movies' slug
  anime: <BookOpen className="h-4 w-4" />, // Assuming 'anime' slug
  default: <List className="h-4 w-4" />
};

export default function CategorySidebar({ onToggle, isOpen }: CategorySidebarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [expanded, setExpanded] = useState<string[]>(["featured", "all"])
  const [searchQuery, setSearchQuery] = useState("")
  const sidebarRef = useRef<HTMLDivElement>(null)

  const [dynamicCategories, setDynamicCategories] = useState<SidebarCategory[]>([]);
  const [loadingDynamicCategories, setLoadingDynamicCategories] = useState(true);

  useEffect(() => {
    const fetchDynamicListCategories = async () => {
      setLoadingDynamicCategories(true);
      try {
        const response = await fetch('/api/categories');
        if (!response.ok) {
          throw new Error('Failed to fetch dynamic categories for sidebar');
        }
        const data = await response.json() as FetchedCategoryInfo[];
        
        const processedCategories = data
          .filter(cat => cat.id !== 'all') // Exclude 'all' from dynamic list
          .map(cat => ({
            ...cat,
            icon: dynamicCategoryIcons[cat.slug] || dynamicCategoryIcons.default
          }));
        setDynamicCategories(processedCategories);
      } catch (error) {
        console.error("Failed to load dynamic categories for sidebar:", error);
        setDynamicCategories([]); // Set to empty on error
      } finally {
        setLoadingDynamicCategories(false);
      }
    };
    fetchDynamicListCategories();
  }, []);

  const toggleExpanded = (section: string) => {
    setExpanded((current) =>
      current.includes(section) ? current.filter((item) => item !== section) : [...current, section],
    )
  }

  // Navigate to /categories page with the selected category filter
  const handleCategoryClick = (categoryId: string, isFeaturedSort: boolean = false) => {
    if (isFeaturedSort) {
      let sortParam = categoryId;
      if (categoryId === 'top-rated') sortParam = 'mostLiked';
      // For 'trending' and 'fresh', CategoryExplorer uses 'newest'
      if (categoryId === 'fresh' || categoryId === 'trending') sortParam = 'newest'; 
      // 'hot' could be a direct sort if CategoryExplorer supports it, or map it.
      // If 'hot' isn't a direct sort option in CategoryExplorer, this might need adjustment or CategoryExplorer update.
      router.push(`/categories?sort=${sortParam}`);
    } else {
      router.push(`/categories?categories=${categoryId}`);
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/categories?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  }

  const brandClasses = "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400"
  const brandIndicatorClass = "bg-rose-500"

  // Helper to check if a category (or sort) is active
  const isCategoryActive = (id: string, isSort: boolean = false) => {
    const currentSearchParams = new URLSearchParams(searchParams?.toString() || '');
    if (isSort) {
      let sortParamQuery = id;
      if (id === 'top-rated') sortParamQuery = 'mostLiked';
      if (id === 'fresh' || id === 'trending') sortParamQuery = 'newest';
      return currentSearchParams.get("sort") === sortParamQuery;
    }
    // For non-sort categories, check the 'categories' parameter.
    // CategoryExplorer uses getAll('categories'), so we should check if the id is present.
    const activeCategories = currentSearchParams.getAll("categories");
    return activeCategories.includes(id);
  }

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
          {/* Featured Section */}
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
                {featuredCategories.map((category) => (
                  <Button
                    key={category.id}
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "relative w-full justify-start overflow-hidden px-3 py-5 text-sm font-normal",
                      isCategoryActive(category.id, true) // Check active state as a sort/featured type
                        ? brandClasses
                        : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
                    )}
                    onClick={() => handleCategoryClick(category.id, true)} // Pass true for isFeaturedSort
                  >
                    {isCategoryActive(category.id, true) && (
                      <motion.div
                        // layoutId={`category-indicator-desktop-\${category.id}`} // Ensure unique layoutId if needed
                        layoutId={"category-indicator-desktop-featured"} // Can be a shared one if only one active featured
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

          {/* All Categories Section - Now Dynamic */}
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
                {loadingDynamicCategories ? (
                  <div className="px-3 py-2 text-sm text-neutral-500 dark:text-neutral-400">Loading categories...</div>
                ) : dynamicCategories.length > 0 ? (
                  dynamicCategories.map((category) => (
                    <Button
                      key={category.id}
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "relative w-full justify-start overflow-hidden px-3 py-5 text-sm font-normal",
                        isCategoryActive(category.id, false) // Check active state as a category filter
                           ? brandClasses
                          : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
                      )}
                      onClick={() => handleCategoryClick(category.id, false)} // Pass false for isFeaturedSort
                    >
                      {isCategoryActive(category.id, false) && (
                         <motion.div
                          // layoutId={`category-indicator-desktop-\${category.id}`} // Ensure unique layoutId
                          layoutId={"category-indicator-desktop-dynamic"} // Can be a shared one or make unique
                          className={cn("absolute left-0 top-0 h-full w-1 rounded-r-full", brandIndicatorClass)}
                          initial={false}
                          animate={{ opacity: 1 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      )}
                       <span className="ml-3 mr-2">{category.icon}</span>
                      {category.name}
                    </Button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-sm text-neutral-500 dark:text-neutral-400">No categories found.</div>
                )}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  )
} 