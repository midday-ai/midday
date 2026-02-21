import { updateUserSchema } from "@api/schemas/users";
import { resend } from "@api/services/resend";
import { createAdminClient } from "@api/services/supabase";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import { withRetryOnPrimary } from "@api/utils/db-retry";
import { teamCache } from "@midday/cache/team-cache";
import {
  deleteUser,
  getUserById,
  getUserInvites,
  switchUserTeam,
  updateUser,
} from "@midday/db/queries";
import { generateFileKey } from "@midday/encryption";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const userRouter = createTRPCRouter({
  me: protectedProcedure.query(async ({ ctx: { db, session } }) => {
    // Cookie-based approach handles replication lag for new users via x-force-primary header
    // Retry logic still handles connection errors/timeouts
    const result = await withRetryOnPrimary(db, async (dbInstance) =>
      getUserById(dbInstance, session.user.id),
    );

    if (!result) {
      return undefined;
    }

    return {
      ...result,
      fileKey: result.teamId ? await generateFileKey(result.teamId) : null,
    };
  }),

  update: protectedProcedure
    .input(updateUserSchema)
    .mutation(async ({ ctx: { db, session }, input }) => {
      return updateUser(db, {
        id: session.user.id,
        ...input,
      });
    }),

  switchTeam: protectedProcedure
    .input(z.object({ teamId: z.string().uuid() }))
    .mutation(async ({ ctx: { db, session }, input }) => {
      let result: Awaited<ReturnType<typeof switchUserTeam>>;

      try {
        result = await switchUserTeam(db, {
          userId: session.user.id,
          teamId: input.teamId,
        });
      } catch {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not a member of this team",
        });
      }

      try {
        await Promise.all([
          teamCache.invalidateForUser(session.user.id, result.previousTeamId),
          teamCache.invalidateForUser(session.user.id, input.teamId),
        ]);
      } catch {
        // Non-fatal — cache will expire naturally
      }

      return result;
    }),

  delete: protectedProcedure.mutation(async ({ ctx: { db, session } }) => {
    const supabaseAdmin = await createAdminClient();

    const [data] = await Promise.all([
      deleteUser(db, session.user.id),
      supabaseAdmin.auth.admin.deleteUser(session.user.id),
      resend.contacts.remove({
        email: session.user.email!,
        audienceId: process.env.RESEND_AUDIENCE_ID!,
      }),
    ]);

    return data;
  }),

  invites: protectedProcedure.query(async ({ ctx: { db, session } }) => {
    if (!session.user.email) {
      return [];
    }

    return getUserInvites(db, session.user.email);
  }),
});
