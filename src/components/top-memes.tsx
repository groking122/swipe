"use client"

import { useState, useEffect } from "react"
// Update import paths for the target project
import { MemeCard } from "@/components/meme-card" 
import { SkeletonCard } from "@/components/skeleton-card"
import { useToast } from "@/hooks/use-toast" 
// Remove unused likeMeme import
// import { likeMeme } from "@/lib/actions" 
import type { Meme } from "@/types/meme" // Import Meme type

// Meme type definition removed - moved to src/types/meme.ts

export default function TopMemes() {
  const [memes, setMemes] = useState<Meme[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchTopMemes = async () => {
      try {
        setLoading(true)
        // API path might need adjustment based on target project setup
        const response = await fetch("/api/memes/top") 
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        // Add type assertion or validation if necessary
        setMemes(data as Meme[]) 
      } catch (error) {
        console.error("Failed to fetch top memes:", error)
        toast({
          title: "Error",
          description: "Failed to load top memes. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchTopMemes()

    /*
    // Temporarily comment out EventSource logic until backend is implemented
    // Set up real-time updates - This needs a corresponding backend implementation
    // API path might need adjustment
    const eventSource = new EventSource("/api/memes/events") 

    eventSource.onmessage = (event) => {
      try {
        const updatedMeme = JSON.parse(event.data)
        // Add type validation for updatedMeme if necessary
        setMemes((prevMemes) =>
          prevMemes
            .map((meme) =>
              // Ensure types are compatible for comparison
              meme.id === (updatedMeme as Meme).id ? { ...meme, likes: (updatedMeme as Meme).likes } : meme 
            )
            .sort((a, b) => b.likes - a.likes) // Re-sort by likes
        )
      } catch (e) {
        console.error("Failed to parse event data:", e)
      }
    }

    eventSource.onerror = (err) => {
      console.error("EventSource failed:", err)
      // Optionally close and retry connection here
      eventSource.close() 
    }

    return () => {
      eventSource.close()
    }
    */
  }, [toast]) // Add dependencies as needed

  return (
    <div className="space-y-8">
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Use a reasonable number of skeletons */}
          {Array.from({ length: 6 }).map((_, i) => ( 
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500" // Ensure animation classes exist in target project
          role="region"
          aria-label="Top memes leaderboard"
        >
          {memes.map((meme, index) => (
            <MemeCard key={meme.id} meme={meme} rank={index + 1} />
          ))}
        </div>
      )}
    </div>
  )
} 