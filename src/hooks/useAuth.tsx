'use client';

import { useState, useCallback, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

// Define the User type directly to avoid import issues
interface User {
  id: string;
  username: string;
  email: string;
  createdAt: string;
  avatarUrl?: string;
}

// Temporary mock implementation until we fix the AuthProvider
export default function useAuth() {
  const { isSignedIn, isLoaded, user: clerkUser } = useUser();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isLoaded) {
      if (isSignedIn && clerkUser) {
        // Create a simplified user object from Clerk
        setUser({
          id: clerkUser.id,
          username: clerkUser.username || 'user',
          email: clerkUser.primaryEmailAddress?.emailAddress || '',
          createdAt: new Date().toISOString(),
          avatarUrl: clerkUser.imageUrl
        });
      } else {
        setUser(null);
      }
      setIsLoading(false);
    }
  }, [isLoaded, isSignedIn, clerkUser]);

  const refreshUser = useCallback(async () => {
    // This is a stub for now
    return Promise.resolve();
  }, []);

  return {
    isAuthenticated: !!isSignedIn,
    loading: !isLoaded || isLoading,
    user,
    error: null,
    refreshUser
  };
} 