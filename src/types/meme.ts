export type Meme = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  likes: number;
  createdAt: string; // Consider using Date type if appropriate
}; 