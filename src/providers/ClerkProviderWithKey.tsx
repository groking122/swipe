'use client';

import { ClerkProvider } from '@clerk/nextjs';
import type { ReactNode } from 'react';

// Get the Clerk publishable key from environment variable
const CLERK_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

// Log the environment variables in development
if (process.env.NODE_ENV !== 'production') {
  console.log("ClerkProvider environment variables:", {
    publishableKey: CLERK_PUBLISHABLE_KEY ? "Defined" : "Undefined",
    frontendApi: process.env.NEXT_PUBLIC_CLERK_FRONTEND_API ? "Defined" : "Undefined",
    signInUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
    signUpUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
    afterSignInUrl: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL,
    afterSignUpUrl: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL
  });
}

export default function ClerkProviderWithKey({ children }: { children: ReactNode }) {
  if (!CLERK_PUBLISHABLE_KEY) {
    console.error("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY environment variable is not set!");
    return <div className="p-4 bg-red-100 text-red-700 rounded">
      Error: Clerk publishable key is missing. Please check your environment variables.
    </div>;
  }

  return (
    <ClerkProvider 
      publishableKey={CLERK_PUBLISHABLE_KEY}
      // Only include frontendApi if it's defined
      {...(process.env.NEXT_PUBLIC_CLERK_FRONTEND_API ? 
        { frontendApi: process.env.NEXT_PUBLIC_CLERK_FRONTEND_API } : {})}
    >
      {children}
    </ClerkProvider>
  );
}