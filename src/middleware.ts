import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define public routes using createRouteMatcher
const isPublicRoute = createRouteMatcher([
  '/', 
  '/top-memes',
  '/categories',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/memes/top',
  '/api/memes/search',
  '/api/categories',
]);

// Use the handler function approach with conditional protection
// Rely on inferred types for auth and req
export default clerkMiddleware(async (auth, req) => { 
  // Protect routes that are NOT public
  if (!isPublicRoute(req)) {
    await auth.protect(); // Correct: call protect directly on the auth object
  }
  // No explicit return needed
});

export const config = {
  matcher: [
    // Updated matcher from example
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)', 
    '/(api|trpc)(.*)',
  ],
};