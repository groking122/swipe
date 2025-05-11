// Define a reusable UserProfile type for nested user data
export type UserProfile = {
  id: string;
  username: string;
  avatar_url: string | null;
};

export type Meme = {
  id: string;
  title?: string;       // Made optional for broader compatibility
  description?: string;   // Already optional effectively in MemeCard
  image_url: string;    // Standardized name (was imageUrl)
  like_count: number;   // Standardized name (was likes)
  dislike_count?: number; // Added, optional
  created_at: string;   // Standardized name (was createdAt)
  twitter?: string;
  website?: string;
  user?: UserProfile;    // Added optional nested user profile
  bookmarked_at?: string; // Optional, can be added by bookmark fetching logic
  // If you have other meme-specific fields like rank, consider adding them here too.
}; 