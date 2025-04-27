"use client"

import { RefreshCw } from "lucide-react"
import { Button } from "./ui/button" // Corrected path
import { useMobile } from "../hooks/use-mobile" // Corrected relative path
import Link from 'next/link'

export function EmptyFeed() {
  const isMobile = useMobile()

  return (
    <div
      className={`flex w-full flex-col items-center justify-center space-y-6 rounded-2xl border border-dashed border-neutral-300 p-8 text-center dark:border-neutral-700 ${isMobile ? "h-[70vh]" : "h-[80vh]"}`}
    >
      <div className="rounded-full bg-neutral-100 p-6 dark:bg-neutral-800">
        <RefreshCw className="h-10 w-10 text-neutral-500" />
      </div>
      <h3 className="text-2xl font-bold">No more memes</h3>
      <p className="text-neutral-600 dark:text-neutral-400">
        You&apos;ve swiped through all the available memes. Check back later for more!
      </p>
      <div className="flex gap-4">
        <Button onClick={() => window.location.reload()}>Refresh Feed</Button>
        <Button variant="outline" asChild>
          <Link href="/upload">Upload a Meme</Link>
        </Button>
      </div>
    </div>
  )
} 