import { supabase } from '@/utils/supabase';
import type { Report, ReportStatus } from '@/types';

/**
 * Create a report for a meme
 */
export async function createReport(
  reporterId: string,
  memeId: string,
  reason: string
): Promise<Report | null> {
  const { data, error } = await supabase
    .from('reports')
    .insert({
      reporter_id: reporterId,
      meme_id: memeId,
      reason,
      status: 'pending',
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating report:', error);
    return null;
  }

  return mapDbReportToReport(data);
}

/**
 * Get all reports with optional filters
 */
export async function getReports(
  status?: ReportStatus,
  memeId?: string
): Promise<Report[]> {
  let query = supabase
    .from('reports')
    .select('*, users:reporter_id(id, username, avatar_url), memes:meme_id(id, title, image_path, creator_id, status)');

  if (status) {
    query = query.eq('status', status);
  }

  if (memeId) {
    query = query.eq('meme_id', memeId);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error('Error getting reports:', error);
    return [];
  }

  return data.map(mapDbReportToReport);
}

/**
 * Update a report's status
 */
export async function updateReportStatus(
  id: string,
  status: ReportStatus
): Promise<Report | null> {
  const { data, error } = await supabase
    .from('reports')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating report status:', error);
    return null;
  }

  return mapDbReportToReport(data);
}

/**
 * Check if a user has already reported a meme
 */
export async function hasReported(
  reporterId: string,
  memeId: string
): Promise<boolean> {
  const { count, error } = await supabase
    .from('reports')
    .select('id', { count: 'exact', head: true })
    .match({
      reporter_id: reporterId,
      meme_id: memeId,
    });

  if (error) {
    console.error('Error checking if user has reported meme:', error);
    return false;
  }

  return (count || 0) > 0;
}

/**
 * Map a database report to our Report type
 */
function mapDbReportToReport(dbReport: any): Report {
  return {
    id: dbReport.id,
    reporterId: dbReport.reporter_id,
    memeId: dbReport.meme_id,
    reason: dbReport.reason,
    status: dbReport.status,
    createdAt: dbReport.created_at,
    reporter: dbReport.users
      ? {
          id: dbReport.users.id,
          username: dbReport.users.username,
          email: '',
          createdAt: '',
          avatarUrl: dbReport.users.avatar_url || undefined,
        }
      : undefined,
    meme: dbReport.memes
      ? {
          id: dbReport.memes.id,
          creatorId: dbReport.memes.creator_id,
          title: dbReport.memes.title,
          imagePath: dbReport.memes.image_path,
          createdAt: '',
          status: dbReport.memes.status,
        }
      : undefined,
  };
} 