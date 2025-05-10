"use client"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import {
  ChevronRight,
  TrendingUp,
  FlameIcon,
  Star,
  Coffee,
  Gamepad2,
  Code,
  Laugh,
  Music,
  Film,
  BookOpen,
  List
} from "lucide-react"
import { cn } from "@/lib/utils"
// import { motion } from "framer-motion" // Removed unused import
// import {
//   Dialog, // Removed unused import
//   DialogContent, // Removed unused import
//   DialogDescription, // Removed unused import
//   DialogHeader, // Removed unused import
//   DialogTitle, // Removed unused import
//   DialogTrigger, // Removed unused import
// } from "@/components/ui/dialog"
// import CategoryManagement from "@/components/mobile/category-management" // Removed for now

// Type for categories fetched from API (matches /api/categories)
interface FetchedCategory {
  id: string; // This is the UUID
  name: string;
  slug: string; // This is the string identifier like 'gaming'
  icon?: React.ReactNode; // Optional: We'll map this based on slug/name
}

// Helper to map slugs/names to icons
const getCategoryIcon = (slug: string): React.ReactNode => {
  switch (slug) {
    case "trending":
      return <TrendingUp className="h-4 w-4" />;
    case "hot":
      return <FlameIcon className="h-4 w-4" />;
    case "top": // Assuming 'top' slug exists or is a special case
    case "top-rated": // Matching CategorySidebar
      return <Star className="h-4 w-4" />;
    case "fresh":
      return <Coffee className="h-4 w-4" />;
    case "gaming":
      return <Gamepad2 className="h-4 w-4" />;
    case "programming":
      return <Code className="h-4 w-4" />;
    case "funny":
      return <Laugh className="h-4 w-4" />;
    case "music":
      return <Music className="h-4 w-4" />;
    case "movies":
      return <Film className="h-4 w-4" />;
    case "anime":
      return <BookOpen className="h-4 w-4" />;
    // Add more cases as needed from your actual Supabase categories
    default:
      return <List className="h-4 w-4" />; // Default icon
  }
};

export default function MobileCategories() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const allCategoryParams = searchParams?.getAll("categories");
  // This param from the URL could be a slug (if old mobile link) or UUID (if desktop link or new mobile link)
  const currentCategoryParamValue = allCategoryParams && allCategoryParams.length > 0 
    ? allCategoryParams[0] 
    : searchParams?.get("category") || null;

  // console.log("[MobileCategories] searchParams:", searchParams?.toString());
  // console.log("[MobileCategories] currentCategoryParamValue:", currentCategoryParamValue);

  const [fetchedCategories, setFetchedCategories] = useState<FetchedCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchCategoriesFromAPI = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/categories");
        if (!response.ok) {
          throw new Error("Failed to fetch categories");
        }
        let data = await response.json() as FetchedCategory[];
        data = data.filter(cat => cat.slug !== 'all');
        const categoriesWithIcons = data.map(cat => ({
          ...cat,
          icon: getCategoryIcon(cat.slug)
        })); 
        setFetchedCategories(categoriesWithIcons);
      } catch (error) {
        console.error("Failed to fetch mobile categories:", error);
        setFetchedCategories([]);
      } finally {
        setIsLoading(false);
        // console.log("[MobileCategories] Fetched Categories:", fetchedCategories);
      }
    };
    fetchCategoriesFromAPI();
  }, [searchParams]);

  // Now navigates with category ID (UUID)
  const handleCategoryClick = (categoryId: string) => {
    router.push(`/categories?categories=${categoryId}`)
  }

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between px-4 py-2">
        <h2 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Categories</h2>
        <div className="flex items-center gap-2">
          {/* <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
                <Plus className="h-3.5 w-3.5" />
                <span className="sr-only">Manage Categories</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Category Management</DialogTitle>
                <DialogDescription>Create, edit, and manage your custom categories.</DialogDescription>
              </DialogHeader>
               <CategoryManagement /> // Component removed
            </DialogContent>
          </Dialog> */}

          <Link href="/categories" className="flex items-center text-xs font-medium text-brand-600 dark:text-brand-400">
            View All
            <ChevronRight className="ml-1 h-3 w-3" />
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-12 px-4">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Loading categories...</p>
        </div>
      ) : fetchedCategories.length > 0 ? (
      <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex justify-start gap-2 px-4 pb-4 pt-1 min-w-full">
            {fetchedCategories.map((category) => (
            <Button
              key={category.id}
              variant="outline"
              size="sm"
              className={cn(
                "flex h-9 items-center gap-1.5 whitespace-nowrap px-3 py-1 flex-shrink-0",
                  // Active state should compare the URL param with the category's ID (UUID)
                  currentCategoryParamValue === category.id 
                    ? "border-brand-200 bg-brand-50 text-brand-600 dark:border-brand-800 dark:bg-brand-950/40 dark:text-brand-400"
                  : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800",
              )}
              onClick={() => handleCategoryClick(category.id)}
            >
              {category.icon}
              <span className="text-sm">{category.name}</span>
              {/* {currentCategory === category.id && ( // Indicator dot might be too subtle, removed for now
                <motion.div
                  layoutId="category-pill-indicator"
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-brand-500 dark:bg-brand-400"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                />
              )} */}
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
      ) : (
        <div className="flex justify-center items-center h-12 px-4">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">No categories found.</p>
        </div>
      )}
    </div>
  )
} 