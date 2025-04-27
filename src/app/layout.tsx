import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// src/app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs'
import Navigation from "../components/navigation";
import { ThemeProvider } from "../components/theme-provider";
import { Toaster } from "../components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MemeSwipe",
  description: "A fun app to swipe through memes",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
      <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
        <body className="flex flex-col min-h-screen">
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Navigation />
            <main className="flex-grow container mx-auto px-4 pt-4 md:pt-8">
            {children}
          </main>
            <Toaster />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}



