"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { ThemeToggle } from "./theme-toggle"
import {
  Home,
  Upload,
  User,
  Settings,
  LogIn,
  UserPlus,
  Menu,
  TrendingUp,
  List,
  Search,
  Tags
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
import { Input } from "./ui/input"
import type { CategoryInfo } from "@/app/api/categories/route"

const navItems = [
  { href: "/", label: "Feed", icon: <Home className="h-5 w-5" /> },
  { href: "/top-memes", label: "Leaderboard", icon: <TrendingUp className="h-5 w-5" /> },
  { href: "/categories", label: "Categories", icon: <List className="h-5 w-5" /> },
  { href: "/upload", label: "Upload", icon: <Upload className="h-5 w-5" /> },
  { href: "/account", label: "Account", icon: <User className="h-5 w-5" /> },
]

export default function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const isMobile = useMobile()
  const [isSidebarSheetOpen, setIsSidebarSheetOpen] = useState(false)
  
  const [sidebarSearchQuery, setSidebarSearchQuery] = useState("")

  const [sidebarCategories, setSidebarCategories] = useState<CategoryInfo[]>([])
  const [loadingCategories, setLoadingCategories] = useState(false)

  const closeSheet = () => setIsSidebarSheetOpen(false)

  useEffect(() => {
    if (isMobile) {
      closeSheet()
    }
  }, [pathname, isMobile])

  useEffect(() => {
    const fetchCategoriesForMobileSheet = async () => {
      setLoadingCategories(true)
      try {
        const response = await fetch('/api/categories')
        if (!response.ok) {
          throw new Error('Failed to fetch sidebar categories')
        }
        const data = await response.json() as unknown
        if (Array.isArray(data)) {
           const validCategories = data.filter(
             (item): item is CategoryInfo => 
               typeof item === 'object' && item !== null && 
               'id' in item && 'name' in item && 'slug' in item && 
               item.id !== 'all' 
           )
           setSidebarCategories(validCategories)
        } else {
           console.error("Fetched sidebar categories is not an array:", data)
           setSidebarCategories([])
        }
      } catch (error) {
        console.error("Failed to fetch sidebar categories:", error)
        setSidebarCategories([])
      } finally {
        setLoadingCategories(false)
      }
    }
    if (isMobile) { 
        fetchCategoriesForMobileSheet()
    } 
  }, [isMobile])

  const handleMobileSheetSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sidebarSearchQuery.trim()) return;
    closeSheet();
    router.push(`/categories?search=${encodeURIComponent(sidebarSearchQuery)}`);
    setSidebarSearchQuery("");
  }

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
              <SheetContent side="left" className="p-0 w-[280px] sm:w-[320px] z-[100]">
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
                  <div className="p-4 border-b dark:border-neutral-800">
                    <form onSubmit={handleMobileSheetSearch} className="relative">
                      <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-500 dark:text-neutral-400" />
                      <Input 
                        placeholder="Search..."
                        className="pl-8 h-9 text-sm"
                        value={sidebarSearchQuery}
                        onChange={(e) => setSidebarSearchQuery(e.target.value)}
                      />
                    </form>
                  </div>
                  <ScrollArea className="flex-1 overflow-y-auto">
                    <div className="p-4">
                      <h3 className="mb-2 px-2 text-xs font-medium uppercase text-neutral-500 dark:text-neutral-400">Navigation</h3>
                      <nav className="space-y-1">
                        {navItems.map((item) => {
                          const isActive = pathname === item.href;
                          if (item.href === "/account") { 
                            return (
                              <SignedIn key={item.label + "-mobile-sheet"}>
                                <Link href={item.href} onClick={closeSheet} className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors", isActive ? "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-50" : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-50")}>
                                  {item.icon}{item.label}
                                </Link>
                              </SignedIn>
                            )
                          }
                          return (
                            <Link key={item.label + "-mobile-sheet"} href={item.href} onClick={closeSheet} className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors", isActive ? "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-50" : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-50")}>
                              {item.icon}{item.label}
                            </Link>
                          )
                        })}
                      </nav>
                    </div>
                    <Separator />
                    <div className="p-4">
                      <h3 className="mb-2 px-2 text-xs font-medium uppercase text-neutral-500 dark:text-neutral-400">Categories</h3>
                      {loadingCategories ? (
                         <div className="px-3 py-2 text-sm text-neutral-500 dark:text-neutral-400">Loading...</div> 
                      ) : sidebarCategories.length > 0 ? (
                        <nav className="space-y-1">
                          {sidebarCategories.map((category) => (
                            <Link 
                              key={category.id + "-mobile-sheet"} 
                              href={`/categories?categories=${category.id}`} 
                              onClick={closeSheet} 
                              className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors", "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-50")}
                            >
                              <Tags className="h-4 w-4" /> 
                              <span>{category.name}</span>
                            </Link>
                          ))}
                        </nav>
                      ) : (
                         <div className="px-3 py-2 text-sm text-neutral-500 dark:text-neutral-400">No categories found.</div> 
                      )}
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
              {/* <ThemeToggle /> */}
              <SignedIn>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
              <SignedOut>
                <SignInButton mode="modal">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </SignInButton>
                <SignUpButton mode="modal"><Button size="sm">Sign Up</Button></SignUpButton>
              </SignedOut>
            </div>
          </div>
        </header>

        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white/80 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/80 md:hidden">
          <div className="container flex h-16 items-center justify-around px-4">
            {navItems.filter(item => item.href !== "/account" || pathname === "/account" ).slice(0, 5).map((item) => {
              const isActive = pathname === item.href;
              if (item.href === "/account") {
                return (
                  <SignedIn key={item.label + "-mobile-bottom"}>
                    <Link href={item.href} className="relative flex flex-col items-center justify-center rounded-md p-2 transition-colors w-1/5">
                      {isActive && <motion.div layoutId="mobile-bubble" className="absolute inset-0 rounded-lg bg-rose-50 dark:bg-rose-950/40" style={{ borderRadius: 8 }} transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />}
                      <span className={cn("relative flex items-center justify-center", isActive ? "text-rose-500" : "text-neutral-500 dark:text-neutral-400")}>{item.icon}</span>
                      <span className={cn("relative mt-1 text-[10px] text-center leading-tight", isActive ? "text-rose-500" : "text-neutral-500 dark:text-neutral-400")}>{item.label}</span>
                    </Link>
                  </SignedIn>
                )
              }
              return (
                <Link key={item.label + "-mobile-bottom"} href={item.href} className="relative flex flex-col items-center justify-center rounded-md p-2 transition-colors w-1/5">
                  {isActive && <motion.div layoutId="mobile-bubble" className="absolute inset-0 rounded-lg bg-rose-50 dark:bg-rose-950/40" style={{ borderRadius: 8 }} transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />}
                  <span className={cn("relative flex items-center justify-center", isActive ? "text-rose-500" : "text-neutral-500 dark:text-neutral-400")}>{item.icon}</span>
                  <span className={cn("relative mt-1 text-[10px] text-center leading-tight", isActive ? "text-rose-500" : "text-neutral-500 dark:text-neutral-400")}>{item.label}</span>
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
                    key={item.href + "-desktop-top"}
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
                    key={item.href + "-desktop-top"}
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
  );
} 