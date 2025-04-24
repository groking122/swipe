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
 * Get a user by ID from the server
 */
export async function getUserById(userId: string): Promise<User | null> {
  try {
    if (!userId) {
      console.error('getUserById called with empty userId');
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
 * Check if a user exists by ID
 */
export async function checkUserExists(userId: string): Promise<boolean> {
  try {
    if (!userId) return false;

    const { count, error } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('id', userId);
      
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