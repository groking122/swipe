import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { type ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies'

export function createClient(cookieStore: ReadonlyRequestCookies) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

// REMOVE the top-level try...catch blocks entirely
/*
try {
  // console.log('server: GET supabase session')
  const { data: { session }, error: _error } = await supabase.auth.getSession() // Prefixed error
  // console.log('server: RETURN supabase session', session)
  return session
} catch (error) {
  console.error('Error getting session:', error)
  return null
}

try {
  // console.log('server: GET supabase user')
  const { data: { user }, error: _error } = await supabase.auth.getUser() // Prefixed error
  // console.log('server: RETURN supabase user', user)
  return user
} catch (error) {
  console.error('Error getting user:', error)
  return null
} 
*/ 