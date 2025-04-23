/**
 * Common types used throughout the application
 */

// User-related types
export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: string;
  avatarUrl?: string;
  bio?: string;
}

export interface UserSession {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Meme-related types
export type MemeStatus = 'active' | 'removed';

export interface Meme {
  id: string;
  creatorId: string;
  title: string;
  imagePath: string;
  createdAt: string;
  status: MemeStatus;
  creator?: User;
}

// Interaction-related types
export type InteractionType = 'like' | 'dislike' | 'share' | 'save';

export interface Interaction {
  id: string;
  userId: string;
  memeId: string;
  type: InteractionType;
  createdAt: string;
  user?: User;
  meme?: Meme;
}

// Report-related types
export type ReportStatus = 'pending' | 'reviewed' | 'actioned';

export interface Report {
  id: string;
  reporterId: string;
  memeId: string;
  reason: string;
  status: ReportStatus;
  createdAt: string;
  reporter?: User;
  meme?: Meme;
}

// API response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: 'success' | 'error';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
} 