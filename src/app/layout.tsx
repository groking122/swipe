import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs';
import Navigation from "@/components/Navigation";
import AuthProvider from "@/providers/AuthProvider";
import ToastProvider from "@/contexts/ToastContext";
import InitializeApp from "@/components/InitializeApp";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MemeSwipe - Swipe through memes",
  description: "MemeSwipe is a mobile-first web app for swiping through memes",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <AuthProvider>
        <ToastProvider>
          <html lang="en" className="h-full">
            <body
              className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-full flex flex-col`}
            >
              <InitializeApp />
              <Navigation />
              <main className="flex-1">{children}</main>
            </body>
          </html>
        </ToastProvider>
      </AuthProvider>
    </ClerkProvider>
  );
}
