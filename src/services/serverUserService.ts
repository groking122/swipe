import { supabase } from '@/utils/supabase';
import { User } from '@/types';

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
 */
function processUserId(userId: string): string {
  return userId.startsWith('user_') ? userId.replace('user_', '') : userId;
}

/**
 * Get a user by ID from the server
 */
export async function getUserById(userId: string): Promise<User | null> {
  try {
    if (!userId) {
      console.error('getUserById called with empty userId');
      return null;
    }

    // Process the Clerk user ID to handle the 'user_' prefix
    const dbUserId = processUserId(userId);
    
    console.debug('Fetching user from Supabase', { userId: dbUserId });

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', dbUserId)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
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
 * Check if a user exists by ID
 */
export async function checkUserExists(userId: string): Promise<boolean> {
  try {
    if (!userId) return false;

    // Process the Clerk user ID to handle the 'user_' prefix
    const dbUserId = processUserId(userId);

    const { count, error } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('id', dbUserId);
      
    if (error) {
      console.error('Error checking user existence:', error);
      return false;
    }
    
    return (count || 0) > 0;
  } catch (error) {
    console.error('Error in checkUserExists:', error);
    return false;
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