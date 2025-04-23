'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { UserButton } from '@clerk/nextjs';
import Button from './ui/Button';

export default function Navigation() {
  const { isAuthenticated, isLoading } = useAuth();

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
          
          {!isLoading && (
            isAuthenticated ? (
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
                <Link href="/sign-in" passHref>
                  <Button variant="outline" size="sm">Sign In</Button>
                </Link>
                <Link href="/sign-up" passHref>
                  <Button size="sm">Sign Up</Button>
                </Link>
              </>
            )
          )}
        </nav>
      </div>
    </header>
  );
} 