"use client";

import { useState, useEffect } from "react";
import Navigation from "./navigation";
import DesktopLayout from "@/components/layout/desktop-layout";
import { useMobile } from "@/hooks/use-mobile";
import { Toaster } from "./ui/toaster";

// This component wraps the main layout logic that requires client-side hooks
export function LayoutClient({ children }: { children: React.ReactNode }) {
  const isMobile = useMobile();
  const [mounted, setMounted] = useState(false);
  // Initialize with default, load from localStorage in useEffect
  const [sidebarOpen, setSidebarOpen] = useState(true); 

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
      {/* Navigation might need props later if it also has a toggle */}
      <Navigation />
      {isMobile ? (
        <main className="flex-1 pb-16 md:pb-0">{children}</main>
      ) : (
        <DesktopLayout 
          sidebarOpen={sidebarOpen} 
          onToggleSidebar={handleToggleSidebar}
        >
          {children}
        </DesktopLayout>
      )}
      <Toaster />
    </div>
  );
} 