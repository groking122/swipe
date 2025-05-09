export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      feed_history: {
        Row: {
          cluster_id: string
          id: number
          meme_id: string
          shown_at: string
          user_id: string
        }
        Insert: {
          cluster_id: string
          id?: number
          meme_id: string
          shown_at?: string
          user_id: string
        }
        Update: {
          cluster_id?: string
          id?: number
          meme_id?: string
          shown_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_history_meme_id_fkey"
            columns: ["meme_id"]
            isOneToOne: false
            referencedRelation: "memes"
            referencedColumns: ["id"]
          },
        ]
      }
      meme_categories: {
        Row: {
          assigned_at: string | null
          category_id: string
          meme_id: string
        }
        Insert: {
          assigned_at?: string | null
          category_id: string
          meme_id: string
        }
        Update: {
          assigned_at?: string | null
          category_id?: string
          meme_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meme_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meme_categories_meme_id_fkey"
            columns: ["meme_id"]
            isOneToOne: false
            referencedRelation: "memes"
            referencedColumns: ["id"]
          },
        ]
      }
      memes: {
        Row: {
          category: string | null
          cluster_id: string | null
          created_at: string
          description: string | null
          dislike_count: number
          id: string
          image_url: string
          like_count: number
          perceptual_hash: string | null
          share_count: number
          title: string
          user_id: string
        }
        Insert: {
          category?: string | null
          cluster_id?: string | null
          created_at?: string
          description?: string | null
          dislike_count?: number
          id?: string
          image_url: string
          like_count?: number
          perceptual_hash?: string | null
          share_count?: number
          title: string
          user_id: string
        }
        Update: {
          category?: string | null
          cluster_id?: string | null
          created_at?: string
          description?: string | null
          dislike_count?: number
          id?: string
          image_url?: string
          like_count?: number
          perceptual_hash?: string | null
          share_count?: number
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      user_likes: {
        Row: {
          created_at: string
          meme_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          meme_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          meme_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_likes_meme_id_fkey"
            columns: ["meme_id"]
            isOneToOne: false
            referencedRelation: "memes"
            referencedColumns: ["id"]
          },
        ]
      }
      votes: {
        Row: {
          cluster_id: string | null
          created_at: string
          id: number
          meme_id: string
          user_id: string
          vote_type: string
        }
        Insert: {
          cluster_id?: string | null
          created_at?: string
          id?: never
          meme_id: string
          user_id: string
          vote_type: string
        }
        Update: {
          cluster_id?: string | null
          created_at?: string
          id?: never
          meme_id?: string
          user_id?: string
          vote_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "votes_meme_id_fkey"
            columns: ["meme_id"]
            isOneToOne: false
            referencedRelation: "memes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_storage_policies: {
        Args: { bucket_name: string }
        Returns: undefined
      }
      get_disliked_cluster_counts: {
        Args: { p_user_id: string }
        Returns: {
          cluster_id: string
          count: number
        }[]
      }
      get_distinct_cluster_ids: {
        Args: Record<PropertyKey, never>
        Returns: string[]
      }
      get_shown_cluster_counts: {
        Args: { p_user_id: string; p_since: string }
        Returns: {
          cluster_id: string
          count: number
        }[]
      }
      handle_vote: {
        Args:
          | {
              p_meme_id: string
              p_user_id: string
              p_vote_type: string
              p_cluster_id: string
            }
          | {
              p_meme_id: string
              p_user_id: string
              p_vote_type: string
              p_perceptual_hash: string
            }
        Returns: undefined
      }
      increment: {
        Args: { row_id: string; column_name: string }
        Returns: undefined
      }
      increment_like_count: {
        Args: { meme_id_param: string }
        Returns: undefined
      }
      initialize_storage_bucket: {
        Args: { bucket_name: string; is_public?: boolean }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
