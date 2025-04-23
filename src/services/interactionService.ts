'use client';

import { createClient } from '@supabase/supabase-js';
import type { Interaction, InteractionType } from '@/types';
import { Database } from '@/types/supabase';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

interface CreateInteractionParams {
  userId: string;
  memeId: string;
  type: InteractionType;
}

/**
 * Create an interaction (like, share, save)
 */
export async function createInteraction(params: CreateInteractionParams): Promise<Interaction | null> {
  const { userId, memeId, type } = params;
  
  const { data, error } = await supabase
    .from('interactions')
    .insert({
      user_id: userId,
      meme_id: memeId,
      type,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating interaction:', error);
    return null;
  }

  return mapDbInteractionToInteraction(data);
}

/**
 * Delete an interaction
 */
export async function deleteInteraction(
  userId: string,
  memeId: string,
  type: InteractionType
): Promise<boolean> {
  const { error } = await supabase
    .from('interactions')
    .delete()
    .match({
      user_id: userId,
      meme_id: memeId,
      type,
    });

  if (error) {
    console.error('Error deleting interaction:', error);
    return false;
  }

  return true;
}

/**
 * Get all interactions for a meme
 */
export async function getMemeInteractions(memeId: string): Promise<Interaction[]> {
  const { data, error } = await supabase
    .from('interactions')
    .select('*, users:user_id(id, username, avatar_url)')
    .eq('meme_id', memeId);

  if (error) {
    console.error('Error getting meme interactions:', error);
    return [];
  }

  return data.map(mapDbInteractionToInteraction);
}

/**
 * Get all interactions for a user
 */
export async function getUserInteractions(
  userId: string,
  type?: InteractionType
): Promise<Interaction[]> {
  let query = supabase
    .from('interactions')
    .select('*, memes:meme_id(id, title, image_path, creator_id, created_at, status)')
    .eq('user_id', userId);

  if (type) {
    query = query.eq('type', type);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error getting user interactions:', error);
    return [];
  }

  return data.map(mapDbInteractionToInteraction);
}

/**
 * Check if a user has a specific interaction with a meme
 */
export async function hasInteraction(
  userId: string,
  memeId: string,
  type: InteractionType
): Promise<boolean> {
  const { count, error } = await supabase
    .from('interactions')
    .select('id', { count: 'exact', head: true })
    .match({
      user_id: userId,
      meme_id: memeId,
      type,
    });

  if (error) {
    console.error('Error checking interaction:', error);
    return false;
  }

  return (count || 0) > 0;
}

/**
 * Map a database interaction to our Interaction type
 */
function mapDbInteractionToInteraction(dbInteraction: any): Interaction {
  return {
    id: dbInteraction.id,
    userId: dbInteraction.user_id,
    memeId: dbInteraction.meme_id,
    type: dbInteraction.type,
    createdAt: dbInteraction.created_at,
    user: dbInteraction.users
      ? {
          id: dbInteraction.users.id,
          username: dbInteraction.users.username,
          email: '',
          createdAt: '',
          avatarUrl: dbInteraction.users.avatar_url || undefined,
        }
      : undefined,
    meme: dbInteraction.memes
      ? {
          id: dbInteraction.memes.id,
          creatorId: dbInteraction.memes.creator_id,
          title: dbInteraction.memes.title,
          imagePath: dbInteraction.memes.image_path,
          createdAt: dbInteraction.memes.created_at,
          status: dbInteraction.memes.status,
        }
      : undefined,
  };
} 