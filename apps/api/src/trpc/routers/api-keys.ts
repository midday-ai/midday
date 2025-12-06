import { deleteApiKeySchema, upsertApiKeySchema } from "@api/schemas/api-keys";
import { resend } from "@api/services/resend";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import { apiKeyCache } from "@midday/cache/api-key-cache";
import {
  deleteApiKey,
  getApiKeysByTeam,
  upsertApiKey,
} from "@midday/db/queries";
import { ApiKeyCreatedEmail } from "@midday/email/emails/api-key-created";
import { logger } from "@midday/logger";

export const apiKeysRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx: { db, teamId } }) => {
    return getApiKeysByTeam(db, teamId!);
  }),

  upsert: protectedProcedure
    .input(upsertApiKeySchema)
    .mutation(async ({ ctx: { db, teamId, session, geo }, input }) => {
      const { data, key, keyHash } = await upsertApiKey(db, {
        teamId: teamId!,
        userId: session.user.id,
        ...input,
      });

      // Invalidate cache if this was an update (has keyHash)
      if (keyHash) {
        await apiKeyCache.delete(keyHash);
      }

      if (data) {
        try {
          // We don't need to await this, it will be sent in the background
          resend.emails.send({
            from: "Middaybot <middaybot@midday.ai>",
            to: session.user.email!,
            subject: "New API Key Created",
            react: ApiKeyCreatedEmail({
              fullName: session.user.full_name!,
              keyName: input.name,
              createdAt: data.createdAt,
              email: session.user.email!,
              ip: geo.ip!,
            }),
          });
        } catch (error) {
          logger.error("Failed to send API key created email", {
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      return {
        key,
        data,
      };
    }),

  delete: protectedProcedure
    .input(deleteApiKeySchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      const keyHash = await deleteApiKey(db, {
        teamId: teamId!,
        ...input,
      });

      // Invalidate cache if key was deleted
      if (keyHash) {
        await apiKeyCache.delete(keyHash);
      }

      return keyHash;
    }),
});
