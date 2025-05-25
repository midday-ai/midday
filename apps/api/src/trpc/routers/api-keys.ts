import {
  createApiKey,
  deleteApiKey,
  getApiKeysByTeam,
} from "@api/db/queries/api-keys";
import { createApiKeySchema, deleteApiKeySchema } from "@api/schemas/api-keys";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";

export const apiKeysRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx: { db, teamId } }) => {
    return getApiKeysByTeam(db, teamId!);
  }),

  create: protectedProcedure
    .input(createApiKeySchema)
    .mutation(async ({ ctx: { db, teamId, session }, input }) => {
      return createApiKey(db, {
        teamId: teamId!,
        userId: session.user.id,
        ...input,
      });
    }),

  delete: protectedProcedure
    .input(deleteApiKeySchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      return deleteApiKey(db, {
        teamId: teamId!,
        ...input,
      });
    }),
});
