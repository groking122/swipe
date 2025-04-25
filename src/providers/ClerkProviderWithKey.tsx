'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { ReactNode } from 'react';

const CLERK_PUBLISHABLE_KEY = 'pk_live_Y2xlcmsudGhlbWVtZXN3aXBlLmNvbSQ';

export default function ClerkProviderWithKey({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      {children}
    </ClerkProvider>
  );
} 