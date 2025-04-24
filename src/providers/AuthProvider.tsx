'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useUser } from '@clerk/nextjs';
import { getUserById, upsertUser } from '@/services/userService';
import type { User } from '@/types';
import type { ReactNode } from 'react';

// For development mode
const isDevelopment = process.env.NODE_ENV === 'development';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  error: string | null;
  // For development mode, provide a way to mock a user
  devModeSetUser?: (user: User | null) => void;
  refreshUser: () => Promise<void>;
}

const defaultContext: AuthContextType = {
  isAuthenticated: false,
  isLoading: true,
  user: null,
  error: null,
  refreshUser: async () => {},
};

export const AuthContext = createContext<AuthContextType>(defaultContext);

interface AuthProviderProps {
  children: ReactNode;
  devMode?: boolean; // Add prop to enable dev mode
}

export default function AuthProvider({ 
  children,
  devMode = isDevelopment && (typeof window !== 'undefined')
}: AuthProviderProps) {
  const { isSignedIn, isLoaded, user: clerkUser } = useUser();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // For development mode, create a simplified mock user
  const createMockUser = useCallback(() => {
    if (devMode && clerkUser) {
      console.warn('Using development mock user instead of Supabase');
      return {
        id: clerkUser.id,
        username: clerkUser.username || clerkUser.firstName || 'devuser',
        email: clerkUser.primaryEmailAddress?.emailAddress || 'dev@example.com',
        avatarUrl: clerkUser.imageUrl,
        createdAt: new Date().toISOString(),
      };
    }
    return null;
  }, [clerkUser, devMode]);

  const syncUserWithSupabase = useCallback(async () => {
    // Reset error state on each sync attempt
    setError(null);
    
    if (!clerkUser) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      // Verify we have the required information from Clerk
      if (!clerkUser.id) {
        setError("Clerk user ID is missing");
        setIsLoading(false);
        return;
      }

      const email = clerkUser.primaryEmailAddress?.emailAddress;
      if (!email) {
        setError("User email is missing from Clerk");
        setIsLoading(false);
        return;
      }

      // For development mode, use mock user if Supabase setup fails
      if (devMode) {
        const mockUser = createMockUser();
        if (mockUser) {
          console.info('Development mode: Using mock user');
          setUser(mockUser);
          setIsLoading(false);
          return;
        }
      }

      // First check if user exists in our database
      const dbUser = await getUserById(clerkUser.id);
      
      // If user doesn't exist, create them
      if (!dbUser) {
        const newUser = await upsertUser({
          id: clerkUser.id,
          email: email,
          username: clerkUser.username || clerkUser.firstName || email.split('@')[0],
          avatar_url: clerkUser.imageUrl,
        });
        
        if (!newUser) {
          // In development mode, fallback to mock user when Supabase operations fail
          if (devMode) {
            const mockUser = createMockUser();
            if (mockUser) {
              console.warn('Falling back to mock user after failed Supabase operations');
              setUser(mockUser);
              setIsLoading(false);
              return;
            }
          }
          
          setError("Failed to create user in database");
          setUser(null);
        } else {
          setUser(newUser);
        }
      } else {
        setUser(dbUser);
      }
    } catch (error) {
      console.error('Error syncing user with Supabase:', error);
      
      // In development mode, fallback to mock user
      if (devMode) {
        const mockUser = createMockUser();
        if (mockUser) {
          console.warn('Falling back to mock user after error');
          setUser(mockUser);
          setIsLoading(false);
          return;
        }
      }
      
      setError("Failed to sync user data");
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [clerkUser, devMode, createMockUser]);

  useEffect(() => {
    if (isLoaded) {
      syncUserWithSupabase();
    }
  }, [isLoaded, syncUserWithSupabase]);

  const refreshUser = useCallback(async () => {
    if (clerkUser) {
      setIsLoading(true);
      await syncUserWithSupabase();
    }
  }, [clerkUser, syncUserWithSupabase]);

  // For development mode, provide a way to set the user manually
  const devModeSetUser = useCallback((newUser: User | null) => {
    if (devMode) {
      console.info('Development mode: Manually setting user', newUser);
      setUser(newUser);
    }
  }, [devMode]);

  const value = {
    isAuthenticated: !!user,
    isLoading: !isLoaded || isLoading,
    user,
    error,
    ...(devMode && { devModeSetUser }),
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 