"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from 'next/navigation';
import Navigation from "./navigation";
import { Toaster } from "./ui/toaster";
import CategorySidebar from "@/components/layout/category-sidebar";
import AdBanner from "@/components/ads/ad-banner";
import AdSidebar from "@/components/ads/ad-sidebar";
import { cn } from "@/lib/utils";

// This component wraps the main layout logic that requires client-side hooks
export function LayoutClient({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true); 
  const pathname = usePathname();

  // Effect for initial mount and loading state
  useEffect(() => {
    setMounted(true);
    try {
      const persistedState = window.localStorage.getItem('sidebarOpenState');
      if (persistedState !== null) {
        setSidebarOpen(persistedState === 'true');
        console.log('[LayoutClient] Loaded persisted sidebar state:', persistedState === 'true');
      } else {
        console.log('[LayoutClient] No persisted sidebar state found, using default.');
      }
    } catch (error) {
      console.error("[LayoutClient] Could not access localStorage for loading:", error);
    }
  }, []); // Empty array: Run only once on mount

  // Effect for saving state changes
  useEffect(() => {
    if (mounted) { // Ensure we run this only client-side after mount
      try {
        console.log('[LayoutClient] Saving sidebar state:', sidebarOpen);
        window.localStorage.setItem('sidebarOpenState', String(sidebarOpen));
      } catch (error) {
        console.error("[LayoutClient] Could not access localStorage for saving:", error);
      }
    }
  }, [sidebarOpen, mounted]); // Run when state changes (and mounted)

  // Handler to toggle sidebar state
  const handleToggleSidebar = () => {
    setSidebarOpen((prev) => !prev); 
    // Saving is handled by the useEffect above
  };

  // --- Add logic from DesktopLayout --- 
  const isFeedPage = pathname === "/";
  const showFullLayout = isFeedPage; // Keep condition for showing sidebars/ads
  const showCategorySidebar = showFullLayout;
  const showAds = showFullLayout;

  // Avoid layout shifts during hydration
  if (!mounted) {
    // Return minimal structure matching the final one
    return (
      <div className="flex flex-col min-h-screen bg-neutral-50 dark:bg-neutral-900">
        <Navigation /> 
        <main className="flex-1"></main>
        <Toaster />
      </div>
    );
  }

  // Render the actual layout based on mobile/desktop state
  return (
    <div className="flex flex-col min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <Navigation />

      {/* NEW: Main Layout Container - Centered, Max-Width, Padding */}
      <div className="mx-auto w-full max-w-screen-xl px-4 pb-16 sm:px-6 lg:px-8">
        {/* Top ad banner - MOVED INSIDE main container */}
        {showAds && (
          <div
            className="mb-4 border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 sm:mb-6 lg:mb-8"
          >
            <AdBanner />
          </div>
        )}

        {/* Main Content Flex Container (Sidebars + Children) */}
        <div className="flex gap-6 lg:gap-8">
          {/* Left Category Sidebar - Adjusted sticky top, simplified height */}
          {showCategorySidebar && (
            <div
              className={cn(
                "sticky top-16 z-30 hidden h-[calc(100vh-4rem)] overflow-y-auto border-r border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 lg:block",
                "transition-[width] duration-300 ease-out",
                sidebarOpen ? "lg:w-64" : "lg:w-16"
              )}
            >
              <CategorySidebar onToggle={handleToggleSidebar} isOpen={sidebarOpen} />
            </div>
          )}

          {/* Center Content + Right Ad Sidebar Wrapper */}
          <div className="flex-1 flex min-w-0 gap-6 lg:gap-8">
            {/* Main Content Area (Children) - REMOVED padding classes */}
            <main className="flex-1 min-w-0">
              {children} {/* e.g., MemeFeed goes here */}
            </main>

            {/* Right Ad Sidebar - Adjusted sticky top, simplified height */}
            {showAds && (
              <div
                className={cn(
                  "sticky top-16 hidden h-[calc(100vh-4rem)] w-80 flex-shrink-0 overflow-y-auto border-l border-neutral-200 px-4 py-6 dark:border-neutral-800 xl:block"
                )}
              >
                <AdSidebar />
              </div>
            )}
          </div>
        </div>
      </div>
      <Toaster />
    </div>
  );
} 