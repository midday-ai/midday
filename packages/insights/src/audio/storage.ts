/**
 * Supabase storage utilities for insight audio files
 */
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Storage bucket for audio files
 * Uses the existing 'vault' bucket which has RLS policies
 */
const BUCKET = "vault";

/**
 * Default presigned URL expiry (7 days in seconds)
 */
const DEFAULT_EXPIRY_SECONDS = 7 * 24 * 60 * 60;

/**
 * Generate the storage path for an insight's audio file
 */
export function getAudioPath(teamId: string, insightId: string): string {
  return `${teamId}/insights/${insightId}.mp3`;
}

/**
 * Upload insight audio to Supabase storage
 *
 * @param supabase - Supabase client instance
 * @param teamId - Team ID (used for path organization)
 * @param insightId - Insight ID (used for filename)
 * @param audioBuffer - MP3 audio data
 * @returns Storage path (not URL) for the uploaded file
 */
export async function uploadInsightAudio(
  supabase: SupabaseClient,
  teamId: string,
  insightId: string,
  audioBuffer: Buffer,
): Promise<string> {
  const path = getAudioPath(teamId, insightId);

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(path, audioBuffer, {
      contentType: "audio/mpeg",
      upsert: true, // Overwrite if regenerating
    });

  if (error) {
    throw new Error(`Failed to upload insight audio: ${error.message}`);
  }

  // Return path only (not URL) - URLs are generated on demand
  return data.path;
}

/**
 * Generate a presigned URL for accessing insight audio
 *
 * @param supabase - Supabase client instance
 * @param audioPath - Storage path returned from uploadInsightAudio
 * @param expiresInSeconds - URL expiry time (default: 7 days)
 * @returns Presigned URL for the audio file
 */
export async function getAudioPresignedUrl(
  supabase: SupabaseClient,
  audioPath: string,
  expiresInSeconds: number = DEFAULT_EXPIRY_SECONDS,
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(audioPath, expiresInSeconds);

  if (error || !data?.signedUrl) {
    throw new Error(
      `Failed to create signed URL for audio: ${error?.message || "Unknown error"}`,
    );
  }

  return data.signedUrl;
}

/**
 * Check if audio exists for an insight
 *
 * @param supabase - Supabase client instance
 * @param teamId - Team ID
 * @param insightId - Insight ID
 * @returns true if audio file exists
 */
export async function audioExists(
  supabase: SupabaseClient,
  teamId: string,
  insightId: string,
): Promise<boolean> {
  const _path = getAudioPath(teamId, insightId);

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .list(`${teamId}/insights`, {
      search: `${insightId}.mp3`,
      limit: 1,
    });

  if (error) {
    console.error("Error checking audio existence:", error);
    return false;
  }

  return data.length > 0;
}

/**
 * Delete audio for an insight (for cleanup/regeneration)
 *
 * @param supabase - Supabase client instance
 * @param teamId - Team ID
 * @param insightId - Insight ID
 */
export async function deleteInsightAudio(
  supabase: SupabaseClient,
  teamId: string,
  insightId: string,
): Promise<void> {
  const path = getAudioPath(teamId, insightId);

  const { error } = await supabase.storage.from(BUCKET).remove([path]);

  if (error) {
    throw new Error(`Failed to delete insight audio: ${error.message}`);
  }
}
