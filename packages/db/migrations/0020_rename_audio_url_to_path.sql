-- Rename audio_url to audio_path to clarify it stores path, not URL
-- URLs are generated on demand via presigned URLs
ALTER TABLE "insights" RENAME COLUMN "audio_url" TO "audio_path";

-- Add a comment explaining the column usage
COMMENT ON COLUMN "insights"."audio_path" IS 'Storage path: {teamId}/insights/{insightId}.mp3 - URLs generated via presigned URLs';
