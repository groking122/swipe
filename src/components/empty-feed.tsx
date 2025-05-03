"use client"

import { RefreshCw, Upload, LogIn } from "lucide-react"
import { Button } from "./ui/button" // Corrected path
import { useMobile } from "../hooks/use-mobile" // Corrected relative path
import { SignInButton } from "@clerk/nextjs" // Added SignInButton import
import { cn } from "../lib/utils"

// Define props interface
interface EmptyFeedProps {
  onRefresh: () => void; // Function to call when refresh is clicked
  isSignedIn: boolean; // Add isSignedIn prop
}

export function EmptyFeed({ onRefresh, isSignedIn }: EmptyFeedProps) {
  const isMobile = useMobile()

  return (
    <div
      className={cn(
        "mx-auto will-change-transform",
        "max-w-[90vw] sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl 2xl:max-w-3xl",
        "flex w-full flex-col items-center justify-center",
        "space-y-4 sm:space-y-6 md:space-y-8",
        "rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700",
        "p-4 sm:p-6 md:p-8 text-center",
        "shadow-sm",
        isMobile ? "h-[78vh]" : "h-[70vh] sm:h-[75vh] md:h-[78vh] lg:h-[80vh]"
      )}
    >
      {isSignedIn ? (
        // Logged-in view
        <>
          <div className="rounded-full bg-rose-100 p-3 sm:p-4 dark:bg-rose-900/30">
            <RefreshCw className="h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10 text-rose-500 dark:text-rose-400" />
          </div>
          <h3 className="text-xl sm:text-2xl md:text-3xl font-bold">No more memes</h3>
          <p className="max-w-md text-sm sm:text-base text-neutral-600 dark:text-neutral-400">
            You&apos;ve swiped through all the available memes. Check back later for more!
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2 sm:pt-4">
            <Button 
              onClick={onRefresh} 
              variant="outline" 
              className="w-full sm:w-auto"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Feed
            </Button>
            <Button 
              disabled 
              className="w-full sm:w-auto"
            > {/* Disabled for now, implement upload later */}
              <Upload className="mr-2 h-4 w-4" />
              Upload a Meme
            </Button>
          </div>
        </>
      ) : (
        // Logged-out view
        <>
          <div className="rounded-full bg-neutral-100 p-3 sm:p-4 dark:bg-neutral-800">
            <LogIn className="h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10 text-neutral-500 dark:text-neutral-400" />
          </div>
          <h3 className="text-xl sm:text-2xl md:text-3xl font-bold">Welcome to MemeSwipe!</h3>
          <p className="max-w-md text-sm sm:text-base text-neutral-600 dark:text-neutral-400">
            Sign in to start swiping through the best memes.
          </p>
          <SignInButton mode="modal">
            <Button className="w-full sm:w-auto mt-2 sm:mt-4">
              <LogIn className="mr-2 h-4 w-4" />
              Sign In / Sign Up
            </Button>
          </SignInButton>
        </>
      )}
    </div>
  )
} 