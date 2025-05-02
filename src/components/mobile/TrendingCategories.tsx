"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { TrendingUp, ChevronRight, BarChart2 } from "lucide-react"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface TrendingCategory {
  id: string
  name: string
  icon: React.ReactNode
  likeCount: number
  percentChange: number
}

export default function TrendingCategories() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [trendingCategories, setTrendingCategories] = useState<TrendingCategory[]>([])

  // Simulate fetching trending categories
  useEffect(() => {
    const fetchTrendingCategories = async () => {
      // In a real app, this would be an API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Mock data - in a real app this would come from the backend
      setTrendingCategories([
        {
          id: "programming",
          name: "Programming",
          icon: <TrendingUp className="h-4 w-4 text-brand-500" />,
          likeCount: 12453,
          percentChange: 24,
        },
        {
          id: "gaming",
          name: "Gaming",
          icon: <TrendingUp className="h-4 w-4 text-brand-500" />,
          likeCount: 9872,
          percentChange: 18,
        },
        {
          id: "funny",
          name: "Funny",
          icon: <TrendingUp className="h-4 w-4 text-brand-500" />,
          likeCount: 8765,
          percentChange: 12,
        },
        {
          id: "movies",
          name: "Movies",
          icon: <TrendingUp className="h-4 w-4 text-brand-500" />,
          likeCount: 6543,
          percentChange: 8,
        },
        {
          id: "anime",
          name: "Anime",
          icon: <TrendingUp className="h-4 w-4 text-brand-500" />,
          likeCount: 5432,
          percentChange: 5,
        },
      ])

      setIsLoading(false)
    }

    fetchTrendingCategories()
  }, [])

  const handleCategoryClick = (categoryId: string) => {
    router.push(`/?category=${categoryId}`)
  }

  const formatLikeCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`
    }
    return count.toString()
  }

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-1.5">
          <BarChart2 className="h-4 w-4 text-brand-500" />
          <h2 className="text-sm font-medium">Trending Categories</h2>
        </div>
        <Link href="/categories" className="flex items-center text-xs font-medium text-brand-600 dark:text-brand-400">
          View All
          <ChevronRight className="ml-1 h-3 w-3" />
        </Link>
      </div>

      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-3 px-4 pb-3 pt-1">
          {isLoading
            ? // Loading skeletons
              Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="flex min-w-[120px] flex-col items-center gap-2 rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900"
                >
                  <div className="h-10 w-10 animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-700"></div>
                  <div className="h-4 w-20 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700"></div>
                  <div className="h-3 w-16 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700"></div>
                </div>
              ))
            : // Actual trending categories
              trendingCategories.map((category) => (
                <Button
                  key={category.id}
                  variant="outline"
                  className="flex h-auto flex-col items-center gap-1 rounded-lg border-neutral-200 bg-white p-3 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800"
                  onClick={() => handleCategoryClick(category.id)}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-950/40">
                    {category.icon}
                  </div>
                  <span className="text-sm font-medium">{category.name}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                      {formatLikeCount(category.likeCount)} likes
                    </span>
                    <span
                      className={cn(
                        "text-xs font-medium",
                        category.percentChange > 0 ? "text-green-500" : "text-red-500",
                      )}
                    >
                      {category.percentChange > 0 ? "+" : ""}
                      {category.percentChange}%
                    </span>
                  </div>
                </Button>
              ))}
        </div>
         <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
} 