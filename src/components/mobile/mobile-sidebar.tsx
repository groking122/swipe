"use client";

// import { useState } from "react"; // Removed unused import
import Link from "next/link";
import { usePathname } from "next/navigation";
// import { motion } from "framer-motion"; // Removed unused import
import {
  X,
  Home,
  Upload,
  User,
  Settings,
  LogIn,
  UserPlus,
  // Twitter, // Removed unused import
  // Icons for categories (import or redefine)
  TrendingUp,
  FlameIcon as Fire,
  Star,
  Coffee,
  Gamepad2,
  Code,
  Laugh,
  Music,
  Film,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SignedIn, SignedOut, UserButton, SignInButton, SignUpButton } from "@clerk/nextjs";
import Image from "next/image";

// Define categories again here or import from a shared location
const categories = [
  { id: "trending", name: "Trending", icon: <TrendingUp className="h-4 w-4" /> },
  { id: "hot", name: "Hot", icon: <Fire className="h-4 w-4" /> },
  { id: "top", name: "Top Rated", icon: <Star className="h-4 w-4" /> },
  { id: "fresh", name: "Fresh", icon: <Coffee className="h-4 w-4" /> },
  { id: "gaming", name: "Gaming", icon: <Gamepad2 className="h-4 w-4" /> },
  { id: "programming", name: "Programming", icon: <Code className="h-4 w-4" /> },
  { id: "funny", name: "Funny", icon: <Laugh className="h-4 w-4" /> },
  { id: "music", name: "Music", icon: <Music className="h-4 w-4" /> },
  { id: "movies", name: "Movies & TV", icon: <Film className="h-4 w-4" /> },
  { id: "anime", name: "Anime & Manga", icon: <BookOpen className="h-4 w-4" /> },
];

// Nav items (can be passed as props or defined here)
const navItems = [
  { href: "/", label: "Feed", icon: <Home className="h-5 w-5" /> },
  { href: "/upload", label: "Upload", icon: <Upload className="h-5 w-5" /> },
  { href: "/account", label: "Account", icon: <User className="h-5 w-5" /> },
];

interface MobileSidebarProps {
  onClose: () => void; // Function to close the sheet
}

export default function MobileSidebar({ onClose }: MobileSidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      {/* Header inside Sheet */}
      <div className="border-b p-4 dark:border-neutral-800">
        <div className="mb-4 flex items-center justify-between">
          {/* Logo/Title */}
          <Link href="/" onClick={onClose} className="flex items-center gap-2">
            {/* Use your existing logo if available */}
            {/* <Image src="/pepe-logo.png" alt="MemeSwipe Logo" width={28} height={28} className="h-7 w-7 rounded-sm" /> */}
             <span className="font-bold text-xl">MemeSwipe</span>
          </Link>
          {/* Close Button */}
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
            <span className="sr-only">Close menu</span>
          </Button>
        </div>

        {/* Auth Section using Clerk */}
        <SignedIn>
          <div className="flex items-center gap-3">
            <UserButton afterSignOutUrl="/" />
            {/* You can fetch user details via useUser if needed here */}
            <div>
              <p className="font-medium">My Account</p>
            </div>
          </div>
        </SignedIn>
        <SignedOut>
          <div className="flex gap-2">
            <SignUpButton mode="modal">
              <Button size="sm" className="flex-1">
                <UserPlus className="mr-2 h-4 w-4" />
                Sign Up
              </Button>
            </SignUpButton>
            <SignInButton mode="modal">
              <Button variant="outline" size="sm" className="flex-1">
                <LogIn className="mr-2 h-4 w-4" />
                Sign In
              </Button>
            </SignInButton>
          </div>
        </SignedOut>
      </div>

      {/* Scrollable Content Area */}
      <ScrollArea className="flex-1 overflow-y-auto">
        {/* Navigation Section */}
        <div className="p-4">
          <h3 className="mb-2 px-2 text-xs font-medium uppercase text-neutral-500 dark:text-neutral-400">
            Navigation
          </h3>
          <nav className="space-y-1">
            {navItems.map((item) => {
              // Filter out Account link for signed out users
              if (item.href === "/account") {
                return (
                  <SignedIn key={item.href}>
                     <Link
                        href={item.href}
                        onClick={onClose}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                          pathname === item.href
                            ? "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-50"
                            : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-50",
                        )}
                      >
                        {item.icon}
                        {item.label}
                      </Link>
                  </SignedIn>
                );
              }
              // Render other items normally
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    pathname === item.href
                       ? "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-50"
                      : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-50",
                  )}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <Separator />

        {/* Categories Section */}
        <div className="p-4">
          <h3 className="mb-2 px-2 text-xs font-medium uppercase text-neutral-500 dark:text-neutral-400">
            Categories
          </h3>
          <div className="space-y-1">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/?category=${category.id}`}
                onClick={onClose}
                className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    // Add active state based on searchParams if needed
                    "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-50"
                )}
              >
                {category.icon}
                <span>{category.name}</span>
              </Link>
            ))}
            {/* Optionally add a 'View All' link */}
          </div>
        </div>
      </ScrollArea>

      {/* Footer Section */}
      <div className="border-t p-4 dark:border-neutral-800">
        <div className="flex items-center justify-between">
          {/* Settings Button (Add functionality later) */}
          <Button variant="ghost" size="sm" className="gap-2 text-neutral-600 dark:text-neutral-300">
            <Settings className="h-4 w-4" />
            Settings
          </Button>
          <div className="flex items-center gap-1">
             {/* Theme Toggle */}
            <ThemeToggle />
            {/* Twitter/X Link */}
            <a 
              href="https://x.com/YOUR_TWITTER_HANDLE" // <-- REPLACE handle
              target="_blank" 
              rel="noopener noreferrer" 
              aria-label="Follow us on X/Twitter"
              title="Follow us on X/Twitter"
            >
              <Button variant="ghost" size="icon" className="text-neutral-600 dark:text-neutral-300 hover:bg-transparent dark:hover:bg-transparent p-1">
                {/* Use the new PNG logo */}
                <Image
                  src="/icons8-x-50.png"
                  alt="X logo"
                  width={16}
                  height={16}
                />
                {/* <svg viewBox="0 0 1200 1227" fill="currentColor" aria-hidden="true" className="h-4 w-4">
                   <path d="M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.137 519.284H714.163ZM569.165 687.828L521.697 619.934L144.011 79.6944H306.615L611.412 515.685L658.88 583.579L1055.08 1154.95H892.476L569.165 687.854V687.828Z"/>
                </svg> */}
                <span className="sr-only">X/Twitter</span> {/* Keep for accessibility */}
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 