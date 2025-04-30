"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import CategorySidebar from "@/components/layout/category-sidebar"
import AdBanner from "@/components/ads/ad-banner"
import AdSidebar from "@/components/ads/ad-sidebar"
import SearchBar from "@/components/search/search-bar" // Corrected import path
import { cn } from "@/lib/utils"

interface DesktopLayoutProps {
  children: React.ReactNode
}

export default function DesktopLayout({ children }: DesktopLayoutProps) {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  // Default sidebar state can be true or based on preference/storage
  const [sidebarOpen, setSidebarOpen] = useState(true) 

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
  // Add other pages where you might want the layout, e.g., category pages
  const showFullLayout = isFeedPage // || pathname?.startsWith("/category/")
  
  // Don't show category sidebar on upload and account pages (or any non-feed page for now)
  const showCategorySidebar = showFullLayout;
  const showAds = showFullLayout;
  const showSearchBar = showFullLayout;

  if (!mounted) {
     // Return a basic structure or null during SSR/hydration phase
    // Avoid returning null directly if possible, provide a minimal loading state
    return <div className="flex min-h-screen flex-col"></div>; 
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* Top ad banner - only on pages where showAds is true */}
      {showAds && (
        <div className="w-full border-b border-neutral-200 bg-white px-4 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="mx-auto max-w-7xl">
            <AdBanner />
          </div>
        </div>
      )}

      <div className="flex flex-1">
        {/* Category sidebar - shown conditionally */}
        {showCategorySidebar && (
          <div
            // Note: Adjust breakpoints (lg:) if needed based on your design
            className={cn(
              "fixed left-0 top-16 z-30 h-[calc(100vh-4rem)] w-64 transform border-r border-neutral-200 bg-white transition-transform duration-300 ease-in-out dark:border-neutral-800 dark:bg-neutral-900 lg:sticky lg:top-16 lg:translate-x-0", // Changed lg:relative to lg:sticky
              sidebarOpen ? "translate-x-0" : "-translate-x-full lg:-translate-x-full", // Ensure it translates off-screen correctly on lg
            )}
          >
            <CategorySidebar onToggle={() => setSidebarOpen(!sidebarOpen)} isOpen={sidebarOpen} />
          </div>
        )}

        {/* Main content area */}
        <main className={cn(
            "flex flex-1 flex-col transition-all duration-300 ease-in-out", 
            // Adjust margin based on sidebar visibility AND state only on lg+
            showCategorySidebar ? (sidebarOpen ? "lg:ml-64" : "lg:ml-0") : "lg:ml-0" 
            )}>
          {/* Search bar - shown conditionally */}
          {showSearchBar && (
            <div className="sticky top-16 z-20 border-b border-neutral-200 bg-white/80 px-4 py-3 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/80">
              {/* Center search bar within its container */}
              <div className="mx-auto max-w-2xl">
                 <SearchBar />
              </div>
            </div>
          )}

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