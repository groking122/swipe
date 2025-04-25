import { supabase } from '@/utils/supabase';
import { User } from '@/types';
import { normalizeClerkUserId } from '@/utils/clerk';

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

    // Normalize the Clerk user ID for compatibility with Supabase
    const dbUserId = normalizeClerkUserId(userId);
    
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
 * Check if a user exists by ID
 */
export async function checkUserExists(userId: string): Promise<boolean> {
  try {
    if (!userId) return false;

    // Normalize the Clerk user ID for compatibility with Supabase
    const dbUserId = normalizeClerkUserId(userId);

    const { count, error } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('id', dbUserId);
      
    if (error) {
      console.error('Error checking user existence:', error);
      
      // Log more detailed information for debugging
      if (error.message.includes('No rows found')) {
        console.warn(`User ${dbUserId} not found in database. This may be a Clerk ID that hasn't been synced to Supabase yet.`);
      }
      
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