/**
 * Normalize a Clerk user ID by removing the 'user_' prefix if present.
 * Ensures compatibility with Supabase UUID format.
 * @param userId - The Clerk user ID (may or may not have 'user_' prefix)
 * @returns The normalized user ID (without 'user_' prefix)
 */
export function normalizeClerkUserId(userId: string): string {
  return userId.startsWith('user_') ? userId.replace('user_', '') : userId;
}