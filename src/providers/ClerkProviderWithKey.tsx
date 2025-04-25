'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { ReactNode } from 'react';

const CLERK_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error(
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY environment variable is not set. Please set it in your environment."
  );
}

console.log("ClerkProviderWithKey mounted. Using publishable key:", CLERK_PUBLISHABLE_KEY);

export default function ClerkProviderWithKey({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      {children}
    </ClerkProvider>
  );
}