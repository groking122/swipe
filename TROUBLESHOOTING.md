# MemeSwipe Troubleshooting Guide

This guide helps you troubleshoot common issues with the MemeSwipe application.

## Common Issues

### Buttons Not Working (Loading But Not Completing Actions)

If buttons like Feed, Sign Up, or Log In are loading but not completing their actions, this could be due to several issues:

1. **Environment Variables**: Missing or incorrect environment variables for Clerk or Supabase.
2. **Button Component Issues**: Case sensitivity issues with the Button component imports.
3. **Supabase Initialization**: Issues with Supabase client initialization.
4. **Middleware Conflicts**: Conflicts between multiple middleware files.

### Missing Clerk Login Buttons in Header

If the Clerk login buttons are missing from the header, this could be due to:

1. **Clerk Authentication**: Issues with Clerk authentication setup.
2. **Component Rendering**: Conditional rendering issues in the Navigation component.

## How to Fix

We've created several scripts to help you fix these issues:

### 1. Fix All Issues at Once

Run the following command to fix all issues at once:

```bash
npm run fix-all
```

This script will:
- Check and fix environment variables
- Fix Button component case sensitivity issues
- Fix Supabase storage and authentication issues
- Set up Supabase storage policies
- Initialize Supabase storage buckets

### 2. Fix Individual Issues

If you prefer to fix issues one by one, you can run the following commands:

```bash
# Fix environment variables
npm run fix-env

# Fix Button component issues
npm run fix-button

# Fix Supabase issues
npm run fix-supabase

# Set up storage policies
npm run setup-storage-policies

# Initialize storage
npm run init-storage
```

## Manual Fixes

If the scripts don't resolve your issues, you can try these manual fixes:

### Environment Variables

Make sure your `.env` file contains the following variables:

```
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret

# Clerk URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Button Component Issues

If you have both `Button.tsx` and `button.tsx` in the `src/components/ui` directory, you should:

1. Keep only one of them (preferably `Button.tsx` with capital B)
2. Make sure all imports use the correct case: `import Button from './ui/Button'` or `import Button from '@/components/ui/Button'`

### Supabase Initialization

Make sure the Supabase client is properly initialized in `src/utils/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

// Initialize the Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create a single supabase client for the entire app
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
```

### Middleware Conflicts

If you have both `middleware.ts` and `middleware-user-sync.ts`, make sure they don't conflict with each other. You might need to combine them into a single middleware file.

## Still Having Issues?

If you're still experiencing issues after trying these fixes, check the browser console for error messages and the server logs for any backend errors.

You can also try running the development server with verbose logging:

```bash
NODE_ENV=development DEBUG=* npm run dev
```

This will show more detailed logs that can help identify the issue.