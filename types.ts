// types.ts
export type User = {
    id: string;
    username: string;
    avatar_url: string | null;  // ← Can be null if user hasn't set one
  };
  
  export type Meme = {
    id: string;
    image_url: string;
    created_at: string;
    like_count: number;
    dislike_count: number;
    user: User;  // ← Nested user data
  };