import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// src/app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs'
import { Header } from "@/components/Header";

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
      <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
        <body className="pt-16">
          <Header />
          <main className="container mx-auto p-4">
            {children}
          </main>
        </body>
      </html>
    </ClerkProvider>
  )
}



