import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth, clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { supabaseAdmin } from './utils/supabaseAdmin';
import { retry } from './utils/retry';
import { normalizeClerkUserId } from './utils/clerk';

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  "/",
  "/api/webhooks(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/forgot-password(.*)",
  "/api/clerk-webhook",
  "/api/init",
]);

// Define routes that can be accessed before the Clerk
// authentication flow is completed
const isIgnoredRoute = createRouteMatcher([
  "/api/webhooks(.*)",
  "/api/clerk-webhook",
  "/api/init",
]);

// Define routes that require user sync
const needsUserSync = createRouteMatcher([
  '/feed',
  '/profile',
  '/upload',
  '/memes/:path*',
  '/api/memes/:path*',
  '/api/interactions/:path*',
]);

/**
 * Combined middleware that handles both authentication and user sync
 */
export async function middleware(request: NextRequest) {
  try {
    // Don't protect public or ignored routes
    if (isPublicRoute(request) || isIgnoredRoute(request)) {
      return NextResponse.next();
    }
    
    // Get the authenticated user from Clerk
    const { userId } = await auth();
    
    // If no user is authenticated and this is a protected route, redirect to sign in
    if (!userId && !isPublicRoute(request)) {
      // This route requires authentication
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }
    
    // If this route doesn't need user sync, just continue
    if (!needsUserSync(request) || !userId) {
      return NextResponse.next();
    }
    
    // From here on, we're handling user sync for authenticated users on routes that need it
    
    // Process the Clerk user ID to remove 'user_' prefix if it exists
    const dbUserId = normalizeClerkUserId(userId);
    
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
    const { error: insertError } = await retry(() =>
      supabaseAdmin
        .from('users')
        .insert({
          id: dbUserId,
          email: email,
          username: username,
          avatar_url: avatarUrl,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }), 3, 500
    );
    
    if (insertError) {
      console.error('Error creating user in Supabase:', insertError);
    } else {
      console.log(`Successfully created user ${dbUserId} in Supabase via middleware`);
    }
    
    return NextResponse.next();
  } catch (error) {
    console.error('Error in middleware:', error);
    return NextResponse.next();
  }
}

// Configure which routes this middleware will run on
export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};