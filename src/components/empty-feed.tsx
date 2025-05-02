"use client"

import { RefreshCw, Upload, LogIn } from "lucide-react"
import { Button } from "./ui/button" // Corrected path
import { useMobile } from "../hooks/use-mobile" // Corrected relative path
import { SignInButton } from "@clerk/nextjs" // Added SignInButton import

// Define props interface
interface EmptyFeedProps {
  onRefresh: () => void; // Function to call when refresh is clicked
  isSignedIn: boolean; // Add isSignedIn prop
}

export function EmptyFeed({ onRefresh, isSignedIn }: EmptyFeedProps) {
  const isMobile = useMobile()

  return (
    <div
      className={`flex w-full flex-col items-center justify-center space-y-6 rounded-2xl border border-dashed border-neutral-300 p-8 text-center dark:border-neutral-700 ${isMobile ? "h-[70vh]" : "h-[80vh]"}`}
    >
      {isSignedIn ? (
        // Logged-in view
        <>
          <div className="rounded-full bg-rose-100 p-4 dark:bg-rose-900/30">
            <RefreshCw className="h-10 w-10 text-rose-500 dark:text-rose-400" />
          </div>
          <h3 className="text-2xl font-bold">No more memes</h3>
          <p className="text-neutral-600 dark:text-neutral-400">
            You&apos;ve swiped through all the available memes. Check back later for more!
          </p>
          <div className="flex gap-4">
            <Button onClick={onRefresh} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Feed
            </Button>
            <Button disabled> {/* Disabled for now, implement upload later */}
              <Upload className="mr-2 h-4 w-4" />
              Upload a Meme
            </Button>
          </div>
        </>
      ) : (
        // Logged-out view
        <>
          <div className="rounded-full bg-neutral-100 p-4 dark:bg-neutral-800">
            <LogIn className="h-10 w-10 text-neutral-500 dark:text-neutral-400" />
          </div>
          <h3 className="text-2xl font-bold">Welcome to MemeSwipe!</h3>
          <p className="text-neutral-600 dark:text-neutral-400">
            Sign in to start swiping through the best memes.
          </p>
          <SignInButton mode="modal">
            <Button>
              <LogIn className="mr-2 h-4 w-4" />
              Sign In / Sign Up
            </Button>
          </SignInButton>
        </>
      )}
    </div>
  )
} 