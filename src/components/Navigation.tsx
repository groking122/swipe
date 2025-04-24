'use client';

import Link from 'next/link';
import { UserButton, SignInButton, SignUpButton, useAuth } from '@clerk/nextjs';
import Button from './ui/Button';

export default function Navigation() {
  const { isSignedIn, isLoaded } = useAuth();

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-blue-600">
          MemeSwipe
        </Link>
        
        <nav className="flex items-center space-x-4">
          <Link href="/" className="text-gray-600 hover:text-gray-900">
            Home
          </Link>
          
          <Link href="/feed" className="text-gray-600 hover:text-gray-900">
            Feed
          </Link>
          
          {isLoaded ? (
            isSignedIn ? (
              <>
                <Link href="/memes" className="text-gray-600 hover:text-gray-900">
                  Memes
                </Link>
                <Link href="/profile" className="text-gray-600 hover:text-gray-900">
                  Profile
                </Link>
                <UserButton afterSignOutUrl="/" />
              </>
            ) : (
              <>
                <SignInButton mode="modal">
                  <Button variant="outline" size="sm">Sign In</Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button size="sm">Sign Up</Button>
                </SignUpButton>
              </>
            )
          ) : (
            // Show loading state while Clerk is initializing
            <div className="flex items-center space-x-4">
              <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}