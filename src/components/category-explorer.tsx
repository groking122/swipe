"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useSearchParams } from 'next/navigation'; // Import useSearchParams
// Update import paths for the target project
import { MemeCard } from "@/components/meme-card"
import { SkeletonCard } from "@/components/skeleton-card"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, X, Check, FilterX, ChevronLeft, ChevronRight } from "lucide-react"
import type { Meme } from "@/types/meme" // Import Meme type from the new location
import { motion, AnimatePresence } from "framer-motion"
import type { CategoryInfo } from "@/app/api/categories/route"; // Import the CategoryInfo type

// Animation props - keep or adjust as needed
const transitionProps = {
  type: "spring",
  stiffness: 500,
  damping: 30,
  mass: 0.5,
}

export default function CategoryExplorer() {
  const searchParams = useSearchParams(); // Get search params instance

  // Initialize state with default values first
  const [memes, setMemes] = useState<Meme[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["all"])
  const [availableCategories, setAvailableCategories] = useState<CategoryInfo[]>([{ id: 'all', name: 'All', slug: 'all'}]);
  const [sortBy, setSortBy] = useState<"newest" | "mostLiked">("newest")
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const { toast } = useToast()

  // Effect to initialize state from URL search params
  useEffect(() => {
    if (!searchParams) return; // Guard against null searchParams

    const initialSearch = searchParams.get('search');
    const initialCategories = searchParams.getAll('categories');
    const initialSort = searchParams.get('sort') as "newest" | "mostLiked" | null;

    console.log("[CategoryExplorer] Initializing from URL Params:", {
      search: initialSearch,
      categories: initialCategories,
      sort: initialSort
    });

    if (initialSearch) {
      setSearchQuery(initialSearch);
    }
    
    if (initialCategories && initialCategories.length > 0) {
      if (initialCategories.length === 1 && initialCategories[0] === 'all') {
        // If only 'all' is present or it's an empty array after filtering, set to ['all']
        if (selectedCategories.join(',') !== 'all') { // Avoid unnecessary state update
            setSelectedCategories(["all"]);
        }
      } else {
        // Filter out 'all' if other categories are present
        const filteredInitialCategories = initialCategories.filter(cat => cat !== 'all');
        if (filteredInitialCategories.length > 0) {
            // Sort to ensure consistent order for dependency array comparisons
            if (JSON.stringify(filteredInitialCategories.sort()) !== JSON.stringify(selectedCategories.sort())) {
                 setSelectedCategories(filteredInitialCategories.sort());
            }
        } else {
            if (selectedCategories.join(',') !== 'all') { // Avoid unnecessary state update
                setSelectedCategories(["all"]); // Fallback to 'all' if only 'all' was passed or filtering results in empty
            }
        }
      }
    } else if (selectedCategories.join(',') !== 'all') {
        // No categories in URL, ensure it's 'all'
        setSelectedCategories(["all"]);
    }

    if (initialSort && (initialSort === "newest" || initialSort === "mostLiked")) {
      if (sortBy !== initialSort) { // Avoid unnecessary state update
        setSortBy(initialSort);
      }
    } else if (sortBy !== "newest") {
        // No valid sort in URL, ensure it's 'newest' (or your default)
        setSortBy("newest"); 
    }

  // eslint-disable-next-line react-hooks/exhaustive-deps 
  }, [searchParams]); // Re-disable rule for this effect: Intentionally depends only on searchParams

  // Fetch available categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }
        const data = await response.json() as unknown;
        
        if (!Array.isArray(data) || !data.every(item => typeof item === 'object' && item !== null && 'id' in item && 'name' in item)) {
            console.error("Fetched categories is not an array of CategoryInfo objects:", data);
            // Fallback to just "All" if data is malformed
            setAvailableCategories([{ id: 'all', name: 'All', slug: 'all'}]);
            return;
        }
        // Now data is confirmed to be an array of CategoryInfo-like objects
        setAvailableCategories(data as CategoryInfo[]); 
      } catch (error) {
        console.error("Failed to fetch categories:", error);
        toast({
          title: "Error",
          description: "Could not load categories.",
          variant: "destructive",
        });
        setAvailableCategories([{ id: 'all', name: 'All', slug: 'all'}]); // Fallback
      }
    };
    fetchCategories();
  }, [toast]);

  // Handle category selection
  const toggleCategory = (categoryId: string) => {
    if (categoryId === "all") {
      setSelectedCategories(["all"])
      return
    }
    setSelectedCategories((prev) => {
      const withoutAll = prev.filter((id) => id !== "all")
      if (prev.includes(categoryId)) {
        const result = withoutAll.filter((id) => id !== categoryId)
        return result.length === 0 ? ["all"] : result
      } else {
        // Allow selecting multiple categories
        return [...withoutAll, categoryId]
      }
    })
  }

  const clearCategoryFilters = () => {
    setSelectedCategories(["all"])
  }

  // Fetch memes logic - simplified for pagination
  const fetchMemes = useCallback(
    async (pageNumToFetch = 1) => {
      // No need for isFetchingMore check here for simple pagination
      setLoading(true); // Set main loading true for each page fetch
      // setMemes([]); // Clear memes before fetching a new page if not done by page change effect

      try {
        const params = new URLSearchParams({
          page: pageNumToFetch.toString(),
          limit: "9", 
          sort: sortBy,
        })
        selectedCategories.forEach((catId) => params.append("categories", catId))
        if (searchQuery) {
          params.set("search", searchQuery)
        }

        const response = await fetch(`/api/memes/search?${params}`)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json() as Meme[];

        setHasMore(data.length === parseInt(params.get('limit') || '9'))
        setMemes(data); // Directly set the new page's data
        // page state will be managed by pagination controls, not incremented here

      } catch (error) {
        console.error("Failed to fetch memes:", error)
        toast({
          title: "Error",
          description: "Failed to load memes. Please try again.",
          variant: "destructive",
        })
        setHasMore(false) 
        setMemes([]); // Clear memes on error
      } finally {
        setLoading(false);
        // setIsFetchingMore(false); // REMOVE
      }
    },
    [sortBy, selectedCategories, searchQuery, toast] // REMOVE isFetchingMore from dependencies
  );

  // Effect for initial load and filter/search changes
  useEffect(() => {
    // When filters change, reset to page 1 and fetch
    setPage(1); // Reset page to 1
    // fetchMemes(1) will be triggered by the effect below reacting to page change (and filter changes)
    // However, to ensure immediate fetch on filter change before page state updates, we can call it here.
    // For clarity, let's ensure page is set first, then a dedicated effect handles fetching based on page.
  }, [sortBy, selectedCategories, searchQuery]); // Only run when filters change

  // Effect to fetch memes when page or filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMemes(page); 
    }, 150); // Short delay to allow state updates (e.g. page reset)
    return () => clearTimeout(timer);
  }, [page, sortBy, selectedCategories, searchQuery, fetchMemes]); // Add page to dependencies

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // The search is already triggered by the useEffect watching searchQuery
  }

  const handleClearSearch = () => {
    setSearchQuery("")
  }

  return (
    <div className="space-y-8">
      {/* Filter/Search Section */}
      <div className="bg-card p-4 sm:p-6 rounded-xl border shadow-sm">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="mb-4 sm:mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search memes..."
              className="pl-10 rounded-lg h-11 sm:h-12 text-base focus:ring-rose-500 focus:border-rose-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search memes"
            />
            {searchQuery && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={handleClearSearch}
                aria-label="Clear search"
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>
        </form>

        {/* Categories & Sorting */}
        <div className="space-y-4 sm:space-y-6">
          {/* Categories */}
          <div>
            <div className="flex justify-between items-center mb-2 sm:mb-3">
              <h3 className="text-sm sm:text-base text-foreground font-medium flex items-center gap-2">Categories</h3>
              {selectedCategories.length > 1 || (selectedCategories.length === 1 && selectedCategories[0] !== "all") ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearCategoryFilters}
                  className="h-7 sm:h-8 px-2 text-xs sm:text-sm text-muted-foreground hover:text-accent-foreground hover:bg-accent"
                >
                  <FilterX className="h-3.5 w-3.5 mr-1 sm:mr-1.5" />
                  Clear
                </Button>
              ) : null}
            </div>
            <motion.div
              className="flex flex-wrap gap-1.5 sm:gap-2"
              layout
              transition={{ type: "spring", damping: 25, stiffness: 400 }}
            >
              {availableCategories.map((cat) => {
                const isSelected = selectedCategories.includes(cat.id)
                return (
                  <motion.button
                    key={cat.id}
                    onClick={() => toggleCategory(cat.id)}
                    layout
                    initial={false}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className={`
                      relative px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium
                      transition-colors duration-150 ease-in-out border
                      ${
                        isSelected
                          ? "bg-rose-600 text-primary-foreground border-rose-600 dark:bg-rose-500/30 dark:text-rose-200 dark:border-rose-500/50"
                          : "bg-muted text-muted-foreground border-border hover:bg-accent hover:text-accent-foreground hover:border-accent-foreground/30"
                      }
                    `}
                    aria-pressed={isSelected}
                  >
                    <AnimatePresence>
                      {isSelected && (
                        <motion.span
                          layoutId={`check-${cat.id}`}
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.5 }}
                          transition={transitionProps}
                          className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-white"
                        >
                          <Check className="h-2.5 w-2.5" />
                        </motion.span>
                      )}
                    </AnimatePresence>
                    {cat.name}
                  </motion.button>
                )
              })}
              {/* Add a loading state for categories if it takes time */}
              {availableCategories.length <= 1 && loading && <p className="text-zinc-500 text-xs">Loading categories...</p>}
            </motion.div>
          </div>

          {/* Sorting Tabs */}
          <div>
            <h3 className="text-sm sm:text-base text-foreground font-medium mb-2 sm:mb-3">Sort By</h3>
            <Tabs defaultValue="newest" value={sortBy} onValueChange={(value) => setSortBy(value as "newest" | "mostLiked")}>
              <TabsList className="grid w-full grid-cols-2 h-10 sm:h-11">
                <TabsTrigger value="newest" className="text-xs sm:text-sm">Newest</TabsTrigger>
                <TabsTrigger value="mostLiked" className="text-xs sm:text-sm">Most Liked</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Meme Grid Section */}
      <div>
        <AnimatePresence mode="wait">
          {(loading && memes.length === 0) ? (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6"
            >
              {Array.from({ length: 9 }).map((_, i) => (
                <SkeletonCard key={`skel-${i}`} />
              ))}
            </motion.div>
          ) : memes.length > 0 ? (
            <motion.div
              key="memes"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6"
              role="region"
              aria-label="Memes matching criteria"
            >
              {memes.map((meme) => (
                <MemeCard key={meme.id} meme={meme} />
              ))}
            </motion.div>
          ) : (
             <motion.div
               key="no-memes"
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} 
               className="text-center text-zinc-500 py-10">
               {!loading && "No memes found matching your criteria."}
             </motion.div>
          )}
        </AnimatePresence>

        {/* Loading Indicator for Infinite Scroll - Will be replaced by Pagination Controls */}
        {/* <div ref={ref} className="h-10 flex justify-center items-center mt-8">
          {isFetchingMore && (
            <div className="flex items-center space-x-2 text-zinc-500">
              <svg className="animate-spin h-5 w-5 text-zinc-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Loading more...</span>
            </div>
          )}
           {!isFetchingMore && !hasMore && memes.length > 0 && (
             <div className="text-zinc-600">You&apos;ve reached the end!</div>
           )}
        </div> */}

        {/* Pagination Controls */}
        <div className="flex justify-center items-center mt-8 py-4 space-x-3 sm:space-x-4">
          <Button 
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
            variant="outline"
            className="h-10 px-4 sm:px-5 text-sm sm:text-base flex items-center gap-2 disabled:opacity-60"
            aria-label="Go to previous page"
          >
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>Previous</span>
          </Button>
          <span className="text-sm sm:text-base font-medium text-neutral-700 dark:text-neutral-300 tabular-nums">
            Page {page}
          </span>
          <Button 
            onClick={() => setPage(p => p + 1)}
            disabled={!hasMore || loading}
            variant="outline"
            className="h-10 px-4 sm:px-5 text-sm sm:text-base flex items-center gap-2 disabled:opacity-60"
            aria-label="Go to next page"
          >
            <span>Next</span>
            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>
      </div>
    </div>
  )
} 