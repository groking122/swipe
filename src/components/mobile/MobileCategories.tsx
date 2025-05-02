"use client"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
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

export default function MobileCategories() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentCategory = searchParams?.get("category") || "trending"

  // Define categories with icons
  const categories = [
    { id: "trending", name: "Trending", icon: <TrendingUp className="h-4 w-4" /> },
    { id: "hot", name: "Hot", icon: <FlameIcon className="h-4 w-4" /> },
    { id: "top", name: "Top", icon: <Star className="h-4 w-4" /> },
    { id: "fresh", name: "Fresh", icon: <Coffee className="h-4 w-4" /> },
    { id: "gaming", name: "Gaming", icon: <Gamepad2 className="h-4 w-4" /> },
    { id: "programming", name: "Programming", icon: <Code className="h-4 w-4" /> },
    { id: "funny", name: "Funny", icon: <Laugh className="h-4 w-4" /> },
    { id: "music", name: "Music", icon: <Music className="h-4 w-4" /> },
    { id: "movies", name: "Movies", icon: <Film className="h-4 w-4" /> },
    { id: "anime", name: "Anime", icon: <BookOpen className="h-4 w-4" /> },
    // Custom categories would be added here from user preferences
    // { id: "webdev", name: "Web Dev", icon: <Code className="h-4 w-4" /> },
    // { id: "dadjokes", name: "Dad Jokes", icon: <Laugh className="h-4 w-4" /> },
  ]

  const handleCategoryClick = (categoryId: string) => {
    const params = new URLSearchParams(searchParams?.toString())
    params.set("category", categoryId)
    router.push(`/?${params.toString()}`)
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

      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex justify-center gap-2 px-4 pb-4 pt-1 min-w-full">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant="outline"
              size="sm"
              className={cn(
                "flex h-9 items-center gap-1.5 whitespace-nowrap px-3 py-1 flex-shrink-0",
                currentCategory === category.id
                  ? "border-brand-200 bg-brand-50 text-brand-600 dark:border-brand-800 dark:bg-brand-950/40 dark:text-brand-400" // Updated brand styles if needed
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
    </div>
  )
} 