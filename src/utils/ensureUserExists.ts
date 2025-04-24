import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from './supabaseAdmin';
import { checkUserExists } from '@/services/serverUserService';

/**
 * Ensures that a user exists in the Supabase database
 * This is useful for operations that require the user to exist in Supabase
 * If the user doesn't exist, it will create them using the Clerk user data
 */
export async function ensureUserExists() {
  try {
    // Get the authenticated user from Clerk
    const { userId } = await auth();
    if (!userId) {
      console.error('No authenticated user found');
      return { success: false, error: 'Not authenticated', userId: null };
    }

    // Process the Clerk user ID to remove 'user_' prefix if it exists
    const dbUserId = userId.startsWith('user_') ? userId.replace('user_', '') : userId;
    
    console.log(`Ensuring user exists in Supabase: ${dbUserId}`);
    
    // Check if the user already exists in Supabase
    const userExists = await checkUserExists(dbUserId);
    
    if (userExists) {
      console.log(`User ${dbUserId} already exists in Supabase`);
      return { success: true, userId: dbUserId };
    }
    
    // User doesn't exist, fetch user data from Clerk
    console.log(`User ${dbUserId} not found in Supabase, creating from Clerk data`);
    
    // Get user data from Clerk
    const clerkUser = await fetch('https://api.clerk.dev/v1/users/' + userId, {
      headers: {
        'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    }).then(res => res.json());
    
    if (!clerkUser || clerkUser.errors) {
      console.error('Error fetching user data from Clerk:', clerkUser?.errors || 'Unknown error');
      return { success: false, error: 'Failed to fetch user data from Clerk', userId: dbUserId };
    }
    
    // Extract user data
    const email = clerkUser.email_addresses?.[0]?.email_address;
    const username = clerkUser.username || 
      `${clerkUser.first_name || ''}${clerkUser.last_name || ''}`.toLowerCase() || 
      email?.split('@')[0] || 
      `user_${dbUserId.substring(0, 8)}`;
    const avatarUrl = clerkUser.image_url;
    
    if (!email) {
      console.error('No email found for user:', dbUserId);
      return { success: false, error: 'No email found for user', userId: dbUserId };
    }
    
    // Create the user in Supabase
    const { error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        id: dbUserId,
        email: email,
        username: username,
        avatar_url: avatarUrl,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    
    if (insertError) {
      console.error('Error creating user in Supabase:', insertError);
      return { success: false, error: `Error creating user: ${insertError.message}`, userId: dbUserId };
    }
    
    console.log(`Successfully created user ${dbUserId} in Supabase`);
    return { success: true, userId: dbUserId };
  } catch (error) {
    console.error('Error in ensureUserExists:', error);
    return { success: false, error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`, userId: null };
  }
}