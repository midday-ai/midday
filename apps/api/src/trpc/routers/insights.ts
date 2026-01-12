import { createAdminClient } from "@api/services/supabase";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import {
  dismissInsight,
  getInsightById,
  getInsightByPeriod,
  getInsightsForUser,
  getLatestInsight,
  markInsightAsRead,
} from "@midday/db/queries";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

const AUDIO_BUCKET = "vault";

const periodTypeEnum = z.enum(["weekly", "monthly", "quarterly", "yearly"]);

export const insightsRouter = createTRPCRouter({
  /**
   * Get paginated list of insights for the team with user's read/dismiss status
   * By default, filters out insights the user has dismissed
   */
  list: protectedProcedure
    .input(
      z.object({
        periodType: periodTypeEnum.optional(),
        limit: z.number().min(1).max(50).default(10),
        cursor: z.string().nullish(),
        includeDismissed: z.boolean().default(false),
      }),
    )
    .query(async ({ ctx: { db, teamId, session }, input }) => {
      return getInsightsForUser(db, {
        teamId: teamId!,
        userId: session.user.id,
        periodType: input.periodType,
        pageSize: input.limit,
        cursor: input.cursor,
        includeDismissed: input.includeDismissed,
        status: "completed",
      });
    }),

  /**
   * Get the most recent completed insight
   */
  latest: protectedProcedure
    .input(
      z.object({
        periodType: periodTypeEnum.optional(),
      }),
    )
    .query(async ({ ctx: { db, teamId }, input }) => {
      return getLatestInsight(db, {
        teamId: teamId!,
        periodType: input.periodType,
      });
    }),

  /**
   * Get a specific insight by ID
   */
  byId: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
      }),
    )
    .query(async ({ ctx: { db, teamId }, input }) => {
      const insight = await getInsightById(db, {
        id: input.id,
        teamId: teamId!,
      });

      if (!insight) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Insight not found",
        });
      }

      return insight;
    }),

  /**
   * Get insight for a specific period
   */
  byPeriod: protectedProcedure
    .input(
      z.object({
        periodType: periodTypeEnum,
        periodYear: z.number(),
        periodNumber: z.number(),
      }),
    )
    .query(async ({ ctx: { db, teamId }, input }) => {
      const insight = await getInsightByPeriod(db, {
        teamId: teamId!,
        periodType: input.periodType,
        periodYear: input.periodYear,
        periodNumber: input.periodNumber,
      });

      if (!insight) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Insight not found for this period",
        });
      }

      return insight;
    }),

  /**
   * Get presigned URL for insight audio
   * Returns a short-lived URL (1 hour) for dashboard playback
   */
  audioUrl: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
      }),
    )
    .query(async ({ ctx: { db, teamId }, input }) => {
      const insight = await getInsightById(db, {
        id: input.id,
        teamId: teamId!,
      });

      if (!insight) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Insight not found",
        });
      }

      if (!insight.audioPath) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Audio not available for this insight",
        });
      }

      // Generate presigned URL (1 hour for dashboard playback)
      const supabase = await createAdminClient();
      const { data, error } = await supabase.storage
        .from(AUDIO_BUCKET)
        .createSignedUrl(insight.audioPath, 60 * 60); // 1 hour

      if (error || !data?.signedUrl) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate audio URL",
        });
      }

      return {
        audioUrl: data.signedUrl,
        expiresIn: 60 * 60, // seconds
      };
    }),

  /**
   * Mark an insight as read for the current user
   * Safe to call multiple times - only sets readAt if not already set
   */
  markAsRead: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx: { db, teamId, session }, input }) => {
      // Verify the insight belongs to the user's team
      const insight = await getInsightById(db, {
        id: input.id,
        teamId: teamId!,
      });

      if (!insight) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Insight not found",
        });
      }

      const result = await markInsightAsRead(db, {
        insightId: input.id,
        userId: session.user.id,
      });

      return { success: true, readAt: result.readAt };
    }),

  /**
   * Dismiss an insight for the current user
   * The insight will no longer appear in their list unless includeDismissed is true
   */
  dismiss: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx: { db, teamId, session }, input }) => {
      // Verify the insight belongs to the user's team
      const insight = await getInsightById(db, {
        id: input.id,
        teamId: teamId!,
      });

      if (!insight) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Insight not found",
        });
      }

      const result = await dismissInsight(db, {
        insightId: input.id,
        userId: session.user.id,
      });

      return { success: true, dismissedAt: result.dismissedAt };
    }),
});
