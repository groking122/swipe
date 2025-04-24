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
 * Process Clerk user ID to make it compatible with Supabase UUID format
 * Handles both formats: with 'user_' prefix and without
 */
function processUserId(userId: string): string {
  // Log the original user ID for debugging
  console.debug('Processing Clerk user ID:', userId);
  
  // Handle IDs with 'user_' prefix
  if (userId.startsWith('user_')) {
    const processedId = userId.replace('user_', '');
    console.debug('Processed ID (removed prefix):', processedId);
    return processedId;
  }
  
  // If no prefix, return as is
  console.debug('ID has no prefix, using as is:', userId);
  return userId;
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

    // Process the user ID - note: this should already be processed in the webhook handler
    // but adding it here for safety
    const dbUserId = processUserId(user.id);

    // Use mock data in development mode
    if (useMockData) {
      console.info('Using mock data for user upsert');
      const timestamp = new Date().toISOString();
      const mockUser: User = {
        id: dbUserId,
        username: user.username || user.email.split('@')[0],
        email: user.email,
        avatarUrl: user.avatar_url,
        createdAt: timestamp,
      };
      mockUsers[dbUserId] = mockUser;
      return mockUser;
    }

    // Ensure Supabase client is available
    if (!supabase) {
      console.error('Supabase client is not initialized');
      return null;
    }

    console.debug('Upserting user in Supabase', {
      id: dbUserId,
      email: user.email,
      username: user.username || user.email.split('@')[0]
    });

    const { data, error } = await supabase
      .from('users')
      .upsert({
        id: dbUserId,
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

    // Process the user ID to handle Clerk format
    const dbUserId = processUserId(userId);

    // Use mock data in development mode
    if (useMockData) {
      console.info('Using mock data for getUserById');
      return mockUsers[dbUserId] || null;
    }

    // Ensure Supabase client is available
    if (!supabase) {
      console.error('Supabase client is not initialized');
      return null;
    }

    console.debug('Fetching user from Supabase', { originalId: userId, processedId: dbUserId });

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', dbUserId)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      
      // If user not found, log a more specific message
      if (error.message.includes('No rows found')) {
        console.warn(`User ${dbUserId} not found in database. This may be a Clerk ID that hasn't been synced to Supabase yet.`);
      }
      
      return null;
    }

    if (!data) {
      console.warn(`User not found with ID: ${dbUserId}`);
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

    // Process the user ID to handle Clerk format
    const dbUserId = processUserId(userId);

    // Use mock data in development mode
    if (useMockData) {
      console.info('Using mock data for updateUserProfile');
      if (mockUsers[dbUserId]) {
        mockUsers[dbUserId] = {
          ...mockUsers[dbUserId],
          username: updates.username || mockUsers[dbUserId].username,
          bio: updates.bio || mockUsers[dbUserId].bio,
          avatarUrl: updates.avatar_url || mockUsers[dbUserId].avatarUrl,
        };
        return mockUsers[dbUserId];
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
      .eq('id', dbUserId)
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