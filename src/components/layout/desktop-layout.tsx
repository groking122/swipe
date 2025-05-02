"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import CategorySidebar from "@/components/layout/category-sidebar"
import AdBanner from "@/components/ads/ad-banner"
import AdSidebar from "@/components/ads/ad-sidebar"
import { cn } from "@/lib/utils"

interface DesktopLayoutProps {
  children: React.ReactNode
  sidebarOpen: boolean
  onToggleSidebar: () => void
}

export default function DesktopLayout({ children, sidebarOpen, onToggleSidebar }: DesktopLayoutProps) {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [adHeight, setAdHeight] = useState(0)
  const adRef = useRef<HTMLDivElement>(null)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
    // Optional: Load sidebar state from localStorage
    // const savedState = localStorage.getItem('sidebarOpen');
    // if (savedState !== null) {
    //   setSidebarOpen(JSON.parse(savedState));
    // }
  }, [])

  // Save sidebar state to localStorage when it changes
  // useEffect(() => {
  //   if (mounted) {
  //     localStorage.setItem('sidebarOpen', JSON.stringify(sidebarOpen));
  //   }
  // }, [sidebarOpen, mounted]);

  // Determine if the sidebar and ads should be shown based on the current path
  const isFeedPage = pathname === "/"
  const showFullLayout = isFeedPage // || pathname?.startsWith("/category/")
  
  const showCategorySidebar = showFullLayout;
  const showAds = showFullLayout;

  // Measure ad height - Moved this section down
  useEffect(() => {
    if (adRef.current && showAds) {
      const updateAdHeight = () => {
        const height = adRef.current?.offsetHeight || 0
        setAdHeight(height)
      }
      updateAdHeight()
      const resizeObserver = new ResizeObserver(updateAdHeight)
      const currentAdRef = adRef.current; // Capture ref value
      resizeObserver.observe(currentAdRef)
      return () => {
        // Use the captured value in the cleanup
        if (currentAdRef) { 
          resizeObserver.unobserve(currentAdRef)
        }
      }
    } else {
       // Reset ad height if ads are not shown or ref is not available
       setAdHeight(0);
    }
    // Ensure dependencies are correct
  }, [mounted, showAds, pathname]) // Rerun if mounted status, showAds, or path changes

  if (!mounted) {
     // Return a basic structure or null during SSR/hydration phase
    // Avoid returning null directly if possible, provide a minimal loading state
    return <div className="flex min-h-screen flex-col"></div>; 
  }

  return (
    <div className="flex flex-1 flex-col" style={{ "--ad-height": `${adHeight}px` } as React.CSSProperties}>
      {/* Top ad banner - only on pages where showAds is true */}
      {showAds && (
        <div
          ref={adRef}
          className="w-full border-b border-neutral-200 bg-white px-4 dark:border-neutral-800 dark:bg-neutral-900"
        >
          <div className="mx-auto max-w-7xl">
            <AdBanner />
          </div>
        </div>
      )}

      <div className="flex flex-1">
        {/* Category sidebar - shown conditionally */}
        {showCategorySidebar && (
          <div
            // Apply dynamic top and height based on adHeight
            // ALWAYS use sticky positioning
            className={cn(
              // Base sticky/transform/border/bg styles
              "sticky z-30 transform border-r border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900",
              // Specific transitions with ease-out
              "transition-[width,transform] duration-300 ease-out",
              // Conditional top offset
              "top-[calc(4rem+var(--ad-height))] lg:top-16", 
              // Height adjustments
              "h-[calc(100vh-4rem-var(--ad-height))] lg:h-[calc(100vh-4rem)]", 
              // Width and translation adjustments
              sidebarOpen
                ? "w-64 translate-x-0" // Open state
                : "w-64 -translate-x-full lg:w-16 lg:translate-x-0" // Closed state
            )}
          >
            <CategorySidebar onToggle={onToggleSidebar} isOpen={sidebarOpen} />
          </div>
        )}

        {/* Main content area */}
        <main className={cn(
            // Base flex styles, ensure it allows shrinking
            "flex-1 flex flex-col min-w-0",
            // REMOVE transition for margin
          )}>
          {/* Page content and Ad Sidebar wrapper */}
          <div className="flex flex-1 min-w-0"> 
            {/* This div holds the main page content (children) */}
            {/* It applies padding to create the central column */}
            <div className={cn(
                "flex-1 py-6 w-full min-w-0", 
                "transition-[padding] duration-300 ease-out",
                "px-4", // Base mobile padding
                // Tablet (lg to xl) padding
                showCategorySidebar && (sidebarOpen ? "lg:pl-64 lg:pr-4" : "lg:pl-16 lg:pr-4"),
                // Desktop (xl+) padding (overrides lg padding)
                showAds && showCategorySidebar && (sidebarOpen ? "xl:pl-64 xl:pr-80" : "xl:pl-16 xl:pr-80"),
                // Case: No left sidebar but ads shown (xl+)
                !showCategorySidebar && showAds && "xl:pr-80"
              )}>
              {children}
            </div>

            {/* Right sidebar for ads */}
            {showAds && (
              <div className="sticky top-16 hidden h-[calc(100vh-4rem)] w-80 flex-shrink-0 overflow-y-auto border-l border-neutral-200 px-4 py-6 dark:border-neutral-800 xl:block">
                <AdSidebar />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
} 