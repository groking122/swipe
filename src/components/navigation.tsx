"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { ThemeToggle } from "./theme-toggle"
import { Upload, User, Menu } from "lucide-react"
import { Button } from "./ui/button"
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet"
import { useMobile } from "../hooks/use-mobile"
import { cn } from "../lib/utils"
import { SignedIn, SignedOut, UserButton, SignInButton, SignUpButton } from "@clerk/nextjs"

export default function Navigation() {
  const pathname = usePathname()
  const isMobile = useMobile()
  const [isOpen, setIsOpen] = useState(false)

  const navItems = [
    { href: "/", label: "Feed", icon: <Upload className="h-5 w-5" /> },
    { href: "/upload", label: "Upload", icon: <Upload className="h-5 w-5" /> },
    { href: "/account", label: "Account", icon: <User className="h-5 w-5" /> },
  ]

  // Mobile navigation (bottom tabs)
  if (isMobile) {
    return (
      <>
        {/* Top header */}
        <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/80">
          <div className="container flex h-16 items-center justify-between px-4">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/pepe-logo.png" alt="MemeSwipe Logo" width={28} height={28} className="h-7 w-7 rounded-sm" />
              <h1 className="text-xl font-bold tracking-tight">MemeSwipe</h1>
            </Link>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <SignedIn>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
            </div>
          </div>
        </header>

        {/* Bottom navigation */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white/80 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/80">
          <div className="container flex h-16 items-center justify-around px-4">
            {navItems.map((item) => {
              if (item.href === "/account") {
                return (
                  <SignedIn key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex flex-col items-center justify-center rounded-md p-2 transition-colors",
                        pathname === item.href
                          ? "text-rose-500"
                          : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50",
                      )}
                    >
                      {item.icon}
                      <span className="mt-1 text-xs">{item.label}</span>
                    </Link>
                  </SignedIn>
                )
              }
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center rounded-md p-2 transition-colors",
                    pathname === item.href
                      ? "text-rose-500"
                      : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50",
                  )}
                >
                  {item.icon}
                  <span className="mt-1 text-xs">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </nav>
      </>
    )
  }

  // Desktop navigation (top navbar)
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/80">
      <div className="container mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/pepe-logo.png" alt="MemeSwipe Logo" width={28} height={28} className="h-7 w-7 rounded-sm" />
            <h1 className="text-xl font-bold tracking-tight">MemeSwipe</h1>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            <SignedIn>
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 text-sm font-medium transition-colors",
                    pathname === item.href
                      ? "text-rose-500"
                      : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-50",
                  )}
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
            </SignedIn>
            <SignedOut>
              {navItems.filter(item => item.href !== '/account').map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 text-sm font-medium transition-colors",
                    pathname === item.href
                      ? "text-rose-500"
                      : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-50",
                  )}
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
            </SignedOut>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-4 md:flex">
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

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[240px] sm:w-[300px]">
              <nav className="flex flex-col gap-4 py-6">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex items-center gap-2 px-2 py-1 text-lg font-medium transition-colors",
                      pathname === item.href
                        ? "text-rose-500"
                        : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-50",
                    )}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
} 