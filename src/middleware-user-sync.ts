import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from './utils/supabaseAdmin';

/**
 * Middleware to ensure users are synced to Supabase
 * This runs on protected routes to make sure the user exists in Supabase
 */
export async function middleware(request: NextRequest) {
  try {
    // Get the authenticated user from Clerk
    const { userId } = await auth();
    
    // If no user is authenticated, continue without syncing
    if (!userId) {
      return NextResponse.next();
    }
    
    // Process the Clerk user ID to remove 'user_' prefix if it exists
    const dbUserId = userId.startsWith('user_') ? userId.replace('user_', '') : userId;
    
    // Check if the user already exists in Supabase
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', dbUserId)
      .single();
    
    // If the user exists, continue without syncing
    if (data && !error) {
      return NextResponse.next();
    }
    
    // If the error is not "no rows found", log it and continue
    if (error && !error.message.includes('No rows found')) {
      console.error('Error checking if user exists:', error);
      return NextResponse.next();
    }
    
    // User doesn't exist, fetch user data from Clerk
    console.log(`User ${dbUserId} not found in Supabase, creating from Clerk data`);
    
    // Get user data from Clerk API
    const clerkUser = await fetch(`https://api.clerk.dev/v1/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    }).then(res => res.json());
    
    if (!clerkUser || clerkUser.errors) {
      console.error('Error fetching user data from Clerk:', clerkUser?.errors || 'Unknown error');
      return NextResponse.next();
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
      return NextResponse.next();
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
    } else {
      console.log(`Successfully created user ${dbUserId} in Supabase via middleware`);
    }
    
    return NextResponse.next();
  } catch (error) {
    console.error('Error in user sync middleware:', error);
    return NextResponse.next();
  }
}

// Only run this middleware on routes that require authentication
export const config = {
  matcher: [
    '/feed',
    '/profile',
    '/upload',
    '/memes/:path*',
    '/api/memes/:path*',
    '/api/interactions/:path*',
  ],
};