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
  const [adHeight, setAdHeight] = useState(0);
  const adRef = useRef<HTMLDivElement>(null);

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

  // Add adHeight measurement effect (ensure dependencies are correct)
  useEffect(() => {
    if (adRef.current && showAds) {
      const updateAdHeight = () => {
        const height = adRef.current?.offsetHeight || 0;
        setAdHeight(height);
      };
      updateAdHeight();
      const resizeObserver = new ResizeObserver(updateAdHeight);
      const currentAdRef = adRef.current;
      resizeObserver.observe(currentAdRef);
      return () => {
        if (currentAdRef) {
          resizeObserver.unobserve(currentAdRef);
        }
      };
    } else {
      setAdHeight(0);
    }
  }, [mounted, showAds, pathname]);
  // --- End added logic from DesktopLayout --- 

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
      {/* Top ad banner - shown based on showAds, height measured */} 
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
      {/* Main content flex container */} 
      <div className="flex flex-1" style={{ "--ad-height": `${adHeight}px` } as React.CSSProperties}>
          {/* Left Category Sidebar - Use Tailwind classes for responsive visibility/width */} 
          {showCategorySidebar && (
            <div
              className={cn(
                // Base styles
                "sticky z-30 transform border-r border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900",
                "transition-[width,transform] duration-300 ease-out",
                "top-[calc(4rem+var(--ad-height))] lg:top-16", // Adjust top based on ad banner
                "h-[calc(100vh-4rem-var(--ad-height))] lg:h-[calc(100vh-4rem)]", // Adjust height based on ad banner/nav
                // Responsive Visibility & Width:
                "hidden", // Hidden by default (mobile)
                sidebarOpen 
                  ? "lg:w-64 lg:translate-x-0 lg:block" // Open: Visible lg+, width 64
                  : "lg:w-16 lg:translate-x-0 lg:block"  // Closed: Visible lg+, width 16
                // Note: translate-x-full is removed as we use hidden/lg:block now
              )}
            >
              <CategorySidebar onToggle={handleToggleSidebar} isOpen={sidebarOpen} />
            </div>
          )}

          {/* Main content area - Takes remaining space, adjusts padding */} 
          <main className="flex-1 flex flex-col min-w-0">
              {/* Inner wrapper for padding and right ad sidebar */}
              <div className="flex flex-1 min-w-0">
                  {/* Content Area - Apply padding responsively */}
                  <div className={cn(
                      "flex-1 py-6 w-full min-w-0",
                      "transition-[padding] duration-300 ease-out",
                      "px-4 pb-16", // Added pb-16 for mobile footer space
                      // Responsive left padding (lg+)
                      showCategorySidebar && (sidebarOpen ? "lg:pl-64" : "lg:pl-16"),
                      // Responsive right padding (xl+) - Apply base px-4 or specific padding if needed
                      showAds && "xl:pr-4",
                      // Remove mobile bottom padding on larger screens if needed
                      "lg:pb-6" // Revert to original py-6 bottom padding on lg+
                    )}>
                     {children} { /* e.g., MemeFeed goes here */ }
                  </div>

                  {/* Right Ad Sidebar - Use Tailwind classes */} 
                  {showAds && (
                    <div className={cn(
                      "sticky top-16 w-80 flex-shrink-0 overflow-y-auto border-l border-neutral-200 px-4 py-6 dark:border-neutral-800",
                      "h-[calc(100vh-4rem)]", // Full height minus nav
                      "hidden xl:block" // Hidden until xl breakpoint
                    )}>
                      <AdSidebar />
                    </div>
                  )}
              </div>
          </main>
      </div>
      <Toaster />
    </div>
  );
} 