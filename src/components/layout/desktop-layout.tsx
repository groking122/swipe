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
}

export default function DesktopLayout({ children }: DesktopLayoutProps) {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  // Default sidebar state can be true or based on preference/storage
  const [sidebarOpen, setSidebarOpen] = useState(true) 
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
      resizeObserver.observe(adRef.current)
      return () => {
        // Check if adRef.current exists before potentially accessing it
        const currentAdRef = adRef.current;
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
            // Apply dynamic top and height based on adHeight for non-lg screens
            // Make it sticky below the header (top-16) on lg screens
            className={cn(
              "fixed left-0 z-30 transform border-r border-neutral-200 bg-white transition-all duration-300 ease-in-out dark:border-neutral-800 dark:bg-neutral-900",
              // Dynamic top/height based on ad banner for fixed positioning (non-lg)
              "top-[calc(4rem+var(--ad-height))] h-[calc(100vh-4rem-var(--ad-height))]",
              // Sticky positioning below header for lg screens
              "lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)]",
              // Width and translation adjustments:
              sidebarOpen
                ? "w-64 translate-x-0" // Open state
                : "w-64 -translate-x-full lg:w-16 lg:translate-x-0" // Closed state: translate below lg, shrink+stay at lg
            )}
          >
            <CategorySidebar onToggle={() => setSidebarOpen(!sidebarOpen)} isOpen={sidebarOpen} adHeight={adHeight} />
          </div>
        )}

        {/* Main content area */}
        <main className={cn(
            "flex flex-1 flex-col transition-all duration-300 ease-in-out", 
            // Adjust margin based on sidebar visibility AND state only on lg+
            // Use ml-64 when open, ml-16 when closed (and shown), ml-0 otherwise
            showCategorySidebar ? (sidebarOpen ? "lg:ml-64" : "lg:ml-16") : "lg:ml-0" 
            )}>
          {/* Page content and Ad Sidebar wrapper */}
          <div className="flex flex-1">
            {/* Actual page content gets padding */}
            <div className="flex-1 px-4 py-6">{children}</div>

            {/* Right sidebar for ads - shown conditionally */}
            {showAds && (
              // Note: Adjust breakpoints (xl:) if needed
              <div className="sticky top-16 hidden h-[calc(100vh-4rem)] w-80 overflow-y-auto border-l border-neutral-200 px-4 py-6 dark:border-neutral-800 xl:block">
                <AdSidebar />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
} 