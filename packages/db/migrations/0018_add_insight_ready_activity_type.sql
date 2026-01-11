-- Add insight_ready to activity_type enum
ALTER TYPE "activity_type" ADD VALUE IF NOT EXISTS 'insight_ready';
