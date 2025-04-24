import { supabase } from '@/utils/supabase';
import { getFileUrl, uploadFile, deleteFile } from '@/utils/supabase';
import type { Meme, MemeStatus, PaginatedResponse } from '@/types';
import { getUserById } from './serverUserService';
import { generateImageHash } from '@/utils/imageHash';

// Upload limits based on user status
const UPLOAD_LIMITS = {
  free: 10,   // Free users: 10 uploads per month
  premium: 50 // Premium users: 50 uploads per month
};

// Add this interface before the createMeme function
interface CreateMemeParams {
  title: string;
  imagePath: string;
  userId: string;
  imageHash?: string;
}

/**
 * Check if a user has reached their monthly upload limit
 */
export async function checkMonthlyUploadLimit(userId: string): Promise<{ allowed: boolean; limit: number; count: number; remaining: number }> {
  try {
    // Get user to check if they're premium
    const user = await getUserById(userId);
    // Default to free tier if user is not found or no premium indicator
    // Using bio field as a temporary way to mark premium users until proper field is added
    const isPremium = user?.bio === 'premium' || false;
    
    // Get the start of the current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    
    // Count memes uploaded this month
    const { count, error } = await supabase
      .from('memes')
      .select('id', { count: 'exact', head: true })
      .eq('creator_id', userId)
      .gte('created_at', startOfMonth);
      
    if (error) {
      console.error('Error checking upload count:', error);
      return { allowed: false, limit: 0, count: 0, remaining: 0 };
    }
    
    // Determine limit based on user status
    const limit = isPremium ? UPLOAD_LIMITS.premium : UPLOAD_LIMITS.free;
    const uploadCount = count || 0;
    const remaining = Math.max(0, limit - uploadCount);
    
    return {
      allowed: uploadCount < limit,
      limit,
      count: uploadCount,
      remaining
    };
  } catch (error) {
    console.error('Error in checkMonthlyUploadLimit:', error);
    return { allowed: false, limit: 0, count: 0, remaining: 0 };
  }
}

/**
 * Check if a meme image is a potential duplicate based on its hash
 */
export async function checkDuplicateMeme(imageHash: string): Promise<Meme | null> {
  // Query for memes with the same hash
  const { data, error } = await supabase
    .from('memes')
    .select('*, users:creator_id(id, username, avatar_url)')
    .eq('image_hash', imageHash)
    .eq('status', 'active')
    .limit(1)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') {
      // No results found, not a duplicate
      return null;
    }
    console.error('Error checking for duplicate meme:', error);
    return null;
  }
  
  // If we found a match, return the meme
  return mapDbMemeToMeme(data);
}

/**
 * Creates a new meme in the database
 * @param params Object containing meme creation parameters
 * @returns The created meme or null if there was an error
 */
export async function createMeme(params: CreateMemeParams): Promise<Meme | null> {
  try {
    const { title, imagePath, userId, imageHash } = params;

    // Check if the user exists
    const user = await getUserById(userId);
    if (!user) {
      console.error('User not found when creating meme', { userId });
      return null;
    }

    // Check if the user has reached their monthly upload limit
    const canUpload = await checkMonthlyUploadLimit(userId);
    if (!canUpload.allowed) {
      console.error('User exceeded monthly upload limit', { userId });
      return null;
    }

    // Check if a meme with the same hash already exists
    if (imageHash) {
      const duplicate = await checkDuplicateMeme(imageHash);
      if (duplicate) {
        console.error('Duplicate meme detected', { imageHash });
        return null;
      }
    }

    // Prepare the meme data (using both user_id and creator_id for compatibility)
    const memeData = {
      title,
      image_path: imagePath,
      status: 'active',
      user_id: userId,
      creator_id: userId // Adding both for compatibility
    };

    // Insert the meme into the database
    const { data, error } = await supabase
      .from('memes')
      .insert(memeData)
      .select()
      .single();

    if (error) {
      console.error('Error creating meme:', error);
      return null;
    }

    // Update user's upload count
    await updateUserUploadCount(userId);

    return mapDbMemeToMeme(data);
  } catch (error) {
    console.error('Error in createMeme:', error);
    return null;
  }
}

/**
 * Update a user's upload count
 */
async function updateUserUploadCount(userId: string): Promise<void> {
  try {
    // Get current counts
    const { data, error } = await supabase
      .from('users')
      .select('monthly_upload_count, total_uploads')
      .eq('id', userId)
      .single();
      
    if (error) {
      console.error('Error getting user upload counts:', error);
      return;
    }
    
    // Update counts
    const monthlyCount = (data?.monthly_upload_count || 0) + 1;
    const totalCount = (data?.total_uploads || 0) + 1;
    
    const { error: updateError } = await supabase
      .from('users')
      .update({
        monthly_upload_count: monthlyCount,
        total_uploads: totalCount
      })
      .eq('id', userId);
      
    if (updateError) {
      console.error('Error updating user upload counts:', updateError);
    }
  } catch (error) {
    console.error('Error in updateUserUploadCount:', error);
  }
}

/**
 * Get memes with pagination
 */
export async function getMemes(
  page = 1,
  pageSize = 10,
  status: MemeStatus = 'active'
): Promise<PaginatedResponse<Meme>> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // Get count first
  const { count, error: countError } = await supabase
    .from('memes')
    .select('id', { count: 'exact', head: true })
    .eq('status', status);

  if (countError) {
    console.error('Error getting meme count:', countError);
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
    .eq('status', status)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    console.error('Error getting memes:', error);
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
 * Get a meme by ID
 */
export async function getMemeById(id: string): Promise<Meme | null> {
  const { data, error } = await supabase
    .from('memes')
    .select('*, users:creator_id(id, username, avatar_url)')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error getting meme:', error);
    return null;
  }

  return mapDbMemeToMeme(data);
}

/**
 * Update a meme's status
 */
export async function updateMemeStatus(
  id: string,
  status: MemeStatus
): Promise<boolean> {
  const { error } = await supabase
    .from('memes')
    .update({ status })
    .eq('id', id);

  if (error) {
    console.error('Error updating meme status:', error);
    return false;
  }

  return true;
}

/**
 * Delete a meme (sets status to 'removed' and optionally deletes the image)
 */
export async function deleteMeme(
  id: string,
  deleteImage = false
): Promise<boolean> {
  // Get the meme first to get the image path
  const { data: meme, error: getMemeError } = await supabase
    .from('memes')
    .select('image_path')
    .eq('id', id)
    .single();

  if (getMemeError) {
    console.error('Error getting meme for deletion:', getMemeError);
    return false;
  }

  // Update the status to 'removed'
  const { error: updateError } = await supabase
    .from('memes')
    .update({ status: 'removed' })
    .eq('id', id);

  if (updateError) {
    console.error('Error marking meme as removed:', updateError);
    return false;
  }

  // Optionally delete the image file
  if (deleteImage && meme.image_path) {
    const deleted = await deleteFile('memes', meme.image_path);
    if (!deleted) {
      console.error('Failed to delete meme image, but status was updated');
    }
  }

  return true;
}

/**
 * Maps a database meme object to our Meme type
 */
export function mapDbMemeToMeme(dbMeme: any): Meme {
  // Handle either creator_id or user_id being present
  const creatorId = dbMeme.creator_id || dbMeme.user_id;
  
  return {
    id: dbMeme.id,
    title: dbMeme.title,
    imagePath: dbMeme.image_path,
    creatorId,
    status: dbMeme.status as MemeStatus,
    createdAt: dbMeme.created_at,
  };
} 