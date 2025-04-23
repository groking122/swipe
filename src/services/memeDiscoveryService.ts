'use client';

import { createClient } from '@supabase/supabase-js';
import type { Meme, PaginatedResponse } from '@/types';
import { mapDbMemeToMeme } from './memeService';
import { Database } from '@/types/supabase';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

/**
 * Get trending memes based on interaction count
 */
export async function getTrendingMemes(
  limit = 10,
  timeframe: 'day' | 'week' | 'month' = 'week'
): Promise<Meme[]> {
  // Calculate the start date based on the timeframe
  const now = new Date();
  let startDate = new Date();
  
  switch (timeframe) {
    case 'day':
      startDate.setDate(now.getDate() - 1);
      break;
    case 'week':
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(now.getMonth() - 1);
      break;
  }

  // First, get the meme IDs with the most interactions
  const { data, error } = await supabase
    .from('interactions')
    .select('meme_id, count(*)')
    .gte('created_at', startDate.toISOString())
    .group('meme_id')
    .order('count', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error getting trending memes:', error);
    return [];
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Then, get the actual meme data
  const memeIds = data.map((item) => item.meme_id);
  
  const { data: memes, error: memesError } = await supabase
    .from('memes')
    .select('*, users:creator_id(id, username, avatar_url)')
    .in('id', memeIds)
    .eq('status', 'active');

  if (memesError) {
    console.error('Error getting meme details:', memesError);
    return [];
  }

  // Sort the memes to match the order of memeIds
  return memeIds
    .map((id) => memes.find((meme) => meme.id === id))
    .filter(Boolean)
    .map(mapDbMemeToMeme);
}

/**
 * Search memes by title
 */
export async function searchMemes(
  query: string,
  page = 1,
  pageSize = 10
): Promise<PaginatedResponse<Meme>> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  
  // Get count first
  const { count, error: countError } = await supabase
    .from('memes')
    .select('id', { count: 'exact', head: true })
    .ilike('title', `%${query}%`)
    .eq('status', 'active');

  if (countError) {
    console.error('Error getting search count:', countError);
    return {
      data: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
    };
  }

  // Then get the actual data
  const { data, error } = await supabase
    .from('memes')
    .select('*, users:creator_id(id, username, avatar_url)')
    .ilike('title', `%${query}%`)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    console.error('Error searching memes:', error);
    return {
      data: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
    };
  }

  const total = count || 0;
  const totalPages = Math.ceil(total / pageSize);

  return {
    data: data.map(mapDbMemeToMeme),
    total,
    page,
    pageSize,
    totalPages,
  };
}

/**
 * Get random memes for swiping
 */
export async function getRandomMemes(limit = 10, excludeIds: string[] = []): Promise<Meme[]> {
  let query = supabase
    .from('memes')
    .select('*, users:creator_id(id, username, avatar_url)')
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  
  // If we have IDs to exclude, filter them out
  if (excludeIds.length > 0) {
    query = query.not('id', 'in', `(${excludeIds.join(',')})`);
  }
  
  // Limit the results
  query = query.limit(limit);

  const { data, error } = await query;

  if (error) {
    console.error('Error getting random memes:', error);
    return [];
  }

  // Shuffle the array to randomize the order
  const shuffled = [...data];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.map(mapDbMemeToMeme);
} 