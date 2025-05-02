"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { ThemeToggle } from "./theme-toggle"
import {
  X,
  Home,
  Upload,
  User,
  Settings,
  LogIn,
  UserPlus,
  Menu,
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
} from "lucide-react"
import { Button } from "./ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "./ui/sheet"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { useMobile } from "../hooks/use-mobile"
import { cn } from "../lib/utils"
import { SignedIn, SignedOut, UserButton, SignInButton, SignUpButton } from "@clerk/nextjs"
import { motion } from "framer-motion"
import { Separator } from "./ui/separator"
import { ScrollArea } from "./ui/scroll-area"
import { BsTwitterX } from 'react-icons/bs'

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
]

const navItems = [
  { href: "/", label: "Feed", icon: <Home className="h-5 w-5" /> },
  { href: "/upload", label: "Upload", icon: <Upload className="h-5 w-5" /> },
  { href: "/account", label: "Account", icon: <User className="h-5 w-5" /> },
]

export default function Navigation() {
  const pathname = usePathname()
  const isMobile = useMobile()
  const [isSidebarSheetOpen, setIsSidebarSheetOpen] = useState(false)

  const closeSheet = () => setIsSidebarSheetOpen(false)

  useEffect(() => {
    closeSheet()
  }, [pathname])

  if (isMobile) {
    return (
      <>
        <header className="sticky top-0 z-[51] w-full border-b bg-white/80 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/80">
          <div className="container flex h-16 items-center justify-between px-4">
            <Sheet open={isSidebarSheetOpen} onOpenChange={setIsSidebarSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="mr-2">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle sidebar</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-[280px] sm:w-[320px] z-[60]">
                <VisuallyHidden>
                  <SheetTitle>Mobile Navigation Menu</SheetTitle>
                </VisuallyHidden>
                <div className="flex h-full flex-col">
                  <div className="border-b p-4 dark:border-neutral-800">
                    <div className="mb-4 flex items-center justify-between">
                      <Link href="/" onClick={closeSheet} className="flex items-center gap-2">
                        <span className="font-bold text-xl">MemeSwipe</span>
                      </Link>
                    </div>
                    <SignedIn>
                      <div className="flex items-center gap-3">
                        <UserButton afterSignOutUrl="/" />
                        <div><p className="font-medium">My Account</p></div>
                      </div>
                    </SignedIn>
                    <SignedOut>
                      <div className="flex gap-2">
                        <SignUpButton mode="modal"><Button size="sm" className="flex-1"><UserPlus className="mr-2 h-4 w-4" />Sign Up</Button></SignUpButton>
                        <SignInButton mode="modal"><Button variant="outline" size="sm" className="flex-1"><LogIn className="mr-2 h-4 w-4" />Sign In</Button></SignInButton>
                      </div>
                    </SignedOut>
                  </div>
                  <ScrollArea className="flex-1 overflow-y-auto">
                    <div className="p-4">
                      <h3 className="mb-2 px-2 text-xs font-medium uppercase text-neutral-500 dark:text-neutral-400">Navigation</h3>
                      <nav className="space-y-1">
                        {navItems.map((item) => {
                          if (item.href === "/account") {
                            return (
                              <SignedIn key={item.href}>
                                <Link href={item.href} onClick={closeSheet} className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors", pathname === item.href ? "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-50" : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-50")}>
                                  {item.icon}{item.label}
                                </Link>
                              </SignedIn>
                            )
                          }
                          return (
                            <Link key={item.href} href={item.href} onClick={closeSheet} className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors", pathname === item.href ? "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-50" : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-50")}>
                              {item.icon}{item.label}
                            </Link>
                          )
                        })}
                      </nav>
                    </div>
                    <Separator />
                    <div className="p-4">
                      <h3 className="mb-2 px-2 text-xs font-medium uppercase text-neutral-500 dark:text-neutral-400">Categories</h3>
                      <div className="space-y-1">
                        {categories.map((category) => (
                          <Link key={category.id} href={`/?category=${category.id}`} onClick={closeSheet} className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors", "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-50")}>
                            {category.icon}<span>{category.name}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </ScrollArea>
                  <div className="border-t p-4 dark:border-neutral-800">
                    <div className="flex items-center justify-between">
                      <Button variant="ghost" size="sm" className="gap-2 text-neutral-600 dark:text-neutral-300"><Settings className="h-4 w-4" />Settings</Button>
                      <div className="flex items-center gap-1">
                        <ThemeToggle />
                        <a href="https://x.com/thememeswipe" target="_blank" rel="noopener noreferrer" aria-label="Follow us on X/Twitter" title="Follow us on X/Twitter">
                          <Button variant="ghost" size="icon" className="text-neutral-600 dark:text-neutral-300 p-2">
                            <BsTwitterX size={16} />
                            <span className="sr-only">X/Twitter</span>
                          </Button>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <Link href="/" className="flex items-center gap-2">
              <Image src="/pepe-logo.png" alt="MemeSwipe Logo" width={28} height={28} className="h-7 w-7 rounded-sm" />
              <h1 className="text-xl font-bold tracking-tight">MemeSwipe</h1>
            </Link>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <SignedIn>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
              <SignedOut>
                <SignInButton mode="modal">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button size="sm">Sign Up</Button>
                </SignUpButton>
              </SignedOut>
            </div>
          </div>
        </header>

        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white/80 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/80">
          <div className="container flex h-16 items-center justify-around px-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              if (item.href === "/account") {
                return (
                  <SignedIn key={item.href}>
                    <Link
                      href={item.href}
                      className="relative flex flex-col items-center justify-center rounded-md p-2 transition-colors"
                    >
                      {isActive && (
                        <motion.div
                          layoutId="mobile-bubble"
                          className="absolute inset-0 rounded-lg bg-rose-50 dark:bg-rose-950/40"
                          style={{ borderRadius: 8 }}
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      <span className={cn(
                          "relative flex items-center justify-center",
                          isActive ? "text-rose-500" : "text-neutral-500 dark:text-neutral-400"
                      )}>
                        {item.icon}
                      </span>
                      <span className={cn(
                          "relative mt-1 text-xs",
                          isActive ? "text-rose-500" : "text-neutral-500 dark:text-neutral-400"
                      )}>
                        {item.label}
                      </span>
                    </Link>
                  </SignedIn>
                )
              }
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative flex flex-col items-center justify-center rounded-md p-2 transition-colors"
                >
                  {isActive && (
                    <motion.div
                      layoutId="mobile-bubble"
                      className="absolute inset-0 rounded-lg bg-rose-50 dark:bg-rose-950/40"
                      style={{ borderRadius: 8 }}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className={cn(
                    "relative flex items-center justify-center",
                    isActive ? "text-rose-500" : "text-neutral-500 dark:text-neutral-400"
                  )}>
                    {item.icon}
                  </span>
                  <span className={cn(
                    "relative mt-1 text-xs",
                    isActive ? "text-rose-500" : "text-neutral-500 dark:text-neutral-400"
                  )}>
                    {item.label}
                  </span>
                </Link>
              )
            })}
          </div>
        </nav>
      </>
    )
  }

  return (
    <header className="sticky top-0 z-[51] w-full border-b bg-white/80 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/80">
      <div className="container mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/pepe-logo.png" alt="MemeSwipe Logo" width={28} height={28} className="h-7 w-7 rounded-sm" />
            <h1 className="text-xl font-bold tracking-tight">MemeSwipe</h1>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            <SignedIn>
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="relative flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors"
                  >
                    {isActive && (
                      <motion.div
                        layoutId="desktop-bubble"
                        className="absolute inset-0 rounded-lg bg-rose-50 dark:bg-rose-950/40"
                        style={{ borderRadius: 8 }}
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <span className={cn(
                      "relative z-10",
                      isActive ? "text-rose-500" : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-50"
                    )}>{item.icon}</span>
                    <span className={cn(
                      "relative z-10",
                      isActive ? "text-rose-500" : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-50"
                    )}>{item.label}</span>
                  </Link>
                )
              })}
            </SignedIn>
            <SignedOut>
              {navItems.filter(item => item.href !== '/account').map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="relative flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors"
                  >
                    {isActive && (
                      <motion.div
                        layoutId="desktop-bubble"
                        className="absolute inset-0 rounded-lg bg-rose-50 dark:bg-rose-950/40"
                        style={{ borderRadius: 8 }}
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <span className={cn(
                      "relative z-10",
                      isActive ? "text-rose-500" : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-50"
                    )}>{item.icon}</span>
                    <span className={cn(
                      "relative z-10",
                      isActive ? "text-rose-500" : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-50"
                    )}>{item.label}</span>
                  </Link>
                )
              })}
            </SignedOut>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-4 md:flex">
            <a
              href="https://x.com/thememeswipe"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Follow us on X/Twitter"
              title="Follow us on X/Twitter"
            >
              <Button variant="ghost" size="icon" className="p-2 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-50">
                <BsTwitterX size={20} />
                <span className="sr-only">X/Twitter</span>
              </Button>
            </a>
            <ThemeToggle />
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <Button variant="ghost" size="sm">Sign In</Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button size="sm">Sign Up</Button>
              </SignUpButton>
            </SignedOut>
          </div>
        </div>
      </div>
    </header>
  )
} 