export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          username: string
          email: string
          created_at: string
          avatar_url: string | null
          bio: string | null
        }
        Insert: {
          id: string
          username: string
          email: string
          created_at?: string
          avatar_url?: string | null
          bio?: string | null
        }
        Update: {
          id?: string
          username?: string
          email?: string
          created_at?: string
          avatar_url?: string | null
          bio?: string | null
        }
      }
      memes: {
        Row: {
          id: string
          creator_id: string
          title: string
          image_path: string
          created_at: string
          status: 'active' | 'removed'
        }
        Insert: {
          id?: string
          creator_id: string
          title: string
          image_path: string
          created_at?: string
          status?: 'active' | 'removed'
        }
        Update: {
          id?: string
          creator_id?: string
          title?: string
          image_path?: string
          created_at?: string
          status?: 'active' | 'removed'
        }
      }
      interactions: {
        Row: {
          id: string
          user_id: string
          meme_id: string
          type: 'like' | 'share' | 'save'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          meme_id: string
          type: 'like' | 'share' | 'save'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          meme_id?: string
          type?: 'like' | 'share' | 'save'
          created_at?: string
        }
      }
      reports: {
        Row: {
          id: string
          reporter_id: string
          meme_id: string
          reason: string
          status: 'pending' | 'reviewed' | 'actioned'
          created_at: string
        }
        Insert: {
          id?: string
          reporter_id: string
          meme_id: string
          reason: string
          status?: 'pending' | 'reviewed' | 'actioned'
          created_at?: string
        }
        Update: {
          id?: string
          reporter_id?: string
          meme_id?: string
          reason?: string
          status?: 'pending' | 'reviewed' | 'actioned'
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 