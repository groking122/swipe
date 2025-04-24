import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  "/",
  "/api/webhooks(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/forgot-password(.*)",
  "/api/clerk-webhook",
]);

// Define routes that can be accessed before the Clerk
// authentication flow is completed
const isIgnoredRoute = createRouteMatcher([
  "/api/webhooks(.*)",
  "/api/clerk-webhook",
]);

export default clerkMiddleware(async (auth, req) => {
  // Don't protect public or ignored routes
  if (isPublicRoute(req) || isIgnoredRoute(req)) {
    return;
  }
  
  // Protect all other routes
  await auth.protect();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}; 