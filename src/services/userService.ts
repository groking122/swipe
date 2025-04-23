'use client';

import { createClient } from '@supabase/supabase-js';
import { User } from '@/types';
import { Database } from '@/types/supabase';

// Initialize Supabase client with proper error handling
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Set development mode (automatically use mock mode when running in browser without proper env vars)
const isDevelopment = process.env.NODE_ENV === 'development';
const useMockData = isDevelopment && (typeof window !== 'undefined') && (!supabaseUrl || !supabaseKey);

// Create in-memory mock data store for development
const mockUsers: Record<string, User> = {};

// Check if environment variables are set
if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase environment variables are not set properly', {
    url: supabaseUrl ? 'Set' : 'Not set',
    key: supabaseKey ? 'Set' : 'Not set',
    useMockData: useMockData,
  });
}

// Create the Supabase client
const supabase = !useMockData ? createClient<Database>(supabaseUrl, supabaseKey) : null;

interface DbUser {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
}

/**
 * Create or update a user in the database
 */
export async function upsertUser(user: {
  id: string;
  email: string;
  username?: string;
  avatar_url?: string;
}): Promise<User | null> {
  try {
    // Check if the user object has required fields
    if (!user.id || !user.email) {
      console.error('Missing required user fields for upsert:', user);
      return null;
    }

    // Use mock data in development mode
    if (useMockData) {
      console.info('Using mock data for user upsert');
      const timestamp = new Date().toISOString();
      const mockUser: User = {
        id: user.id,
        username: user.username || user.email.split('@')[0],
        email: user.email,
        avatarUrl: user.avatar_url,
        createdAt: timestamp,
      };
      mockUsers[user.id] = mockUser;
      return mockUser;
    }

    // Ensure Supabase client is available
    if (!supabase) {
      console.error('Supabase client is not initialized');
      return null;
    }

    console.debug('Upserting user in Supabase', {
      id: user.id,
      email: user.email,
      username: user.username || user.email.split('@')[0]
    });

    const { data, error } = await supabase
      .from('users')
      .upsert({
        id: user.id,
        email: user.email,
        username: user.username || user.email.split('@')[0],
        avatar_url: user.avatar_url || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error('Error upserting user:', error);
      return null;
    }

    if (!data) {
      console.error('No data returned from user upsert');
      return null;
    }

    return mapDbUserToUser(data as DbUser);
  } catch (error) {
    console.error('Error in upsertUser:', error);
    return null;
  }
}

/**
 * Get a user by ID
 */
export async function getUserById(userId: string): Promise<User | null> {
  try {
    if (!userId) {
      console.error('getUserById called with empty userId');
      return null;
    }

    // Use mock data in development mode
    if (useMockData) {
      console.info('Using mock data for getUserById');
      return mockUsers[userId] || null;
    }

    // Ensure Supabase client is available
    if (!supabase) {
      console.error('Supabase client is not initialized');
      return null;
    }

    console.debug('Fetching user from Supabase', { userId });

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      return null;
    }

    if (!data) {
      console.warn(`User not found with ID: ${userId}`);
      return null;
    }

    return mapDbUserToUser(data as DbUser);
  } catch (error) {
    console.error('Error in getUserById:', error);
    return null;
  }
}

/**
 * Update a user's profile information
 */
export async function updateUserProfile(
  userId: string,
  updates: { username?: string; bio?: string; avatar_url?: string }
): Promise<User | null> {
  try {
    if (!userId) {
      console.error('updateUserProfile called with empty userId');
      return null;
    }

    // Use mock data in development mode
    if (useMockData) {
      console.info('Using mock data for updateUserProfile');
      if (mockUsers[userId]) {
        mockUsers[userId] = {
          ...mockUsers[userId],
          username: updates.username || mockUsers[userId].username,
          bio: updates.bio || mockUsers[userId].bio,
          avatarUrl: updates.avatar_url || mockUsers[userId].avatarUrl,
        };
        return mockUsers[userId];
      }
      return null;
    }

    // Ensure Supabase client is available
    if (!supabase) {
      console.error('Supabase client is not initialized');
      return null;
    }

    // Add updated_at timestamp
    const updatesWithTimestamp = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('users')
      .update(updatesWithTimestamp)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user profile:', error);
      return null;
    }

    if (!data) {
      console.error('No data returned from user update');
      return null;
    }

    return mapDbUserToUser(data as DbUser);
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    return null;
  }
}

/**
 * Map a database user to our User type
 */
function mapDbUserToUser(dbUser: DbUser): User {
  return {
    id: dbUser.id,
    username: dbUser.username,
    email: dbUser.email,
    avatarUrl: dbUser.avatar_url || undefined,
    bio: dbUser.bio || undefined,
    createdAt: dbUser.created_at,
  };
} 