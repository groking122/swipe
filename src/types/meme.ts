export type Meme = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  likes: number;
  createdAt: string; // Consider using Date type if appropriate
  twitter?: string; // Twitter handle or URL (optional)
  website?: string; // Website URL (optional)
}; 