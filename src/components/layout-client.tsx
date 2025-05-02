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
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handler to toggle sidebar state
  const handleToggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  // Avoid layout shifts during hydration by rendering a minimal structure
  // that matches the final layout's elements (like Navigation)
  if (!mounted) {
    return (
      <div className="flex flex-col min-h-screen bg-neutral-50 dark:bg-neutral-900">
        <Navigation />
        <main className="flex-1"></main> {/* Empty main during hydration */}
        <Toaster /> {/* Include Toaster here as well if needed immediately */}
      </div>
    );
  }

  // Render the actual layout based on mobile/desktop state
  return (
    <div className="flex flex-col min-h-screen bg-neutral-50 dark:bg-neutral-900">
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