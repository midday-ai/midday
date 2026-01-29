import {
  createBankConnectionSchema,
  deleteBankConnectionSchema,
  getBankConnectionsSchema,
  reconnectBankConnectionSchema,
  syncBankConnectionSchema,
} from "@api/schemas/bank-connections";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import {
  createBankConnection,
  deleteBankConnection,
  getBankConnections,
} from "@midday/db/queries";
import { triggerJob } from "@midday/job-client";
import { TRPCError } from "@trpc/server";

export const bankConnectionsRouter = createTRPCRouter({
  get: protectedProcedure
    .input(getBankConnectionsSchema)
    .query(async ({ ctx: { db, teamId }, input }) => {
      return getBankConnections(db, {
        teamId: teamId!,
        enabled: input?.enabled,
      });
    }),

  create: protectedProcedure
    .input(createBankConnectionSchema)
    .mutation(async ({ input, ctx: { db, teamId, session } }) => {
      const data = await createBankConnection(db, {
        ...input,
        teamId: teamId!,
        userId: session.user.id,
      });

      if (!data) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Bank connection not found",
        });
      }

      const { id: jobId } = await triggerJob(
        "initial-bank-setup",
        {
          connectionId: data.id,
          teamId: teamId!,
        },
        "banking",
      );

      return { id: jobId };
    }),

  delete: protectedProcedure
    .input(deleteBankConnectionSchema)
    .mutation(async ({ input, ctx: { db, teamId } }) => {
      const data = await deleteBankConnection(db, {
        id: input.id,
        teamId: teamId!,
      });

      if (!data) {
        throw new Error("Bank connection not found");
      }

      await triggerJob(
        "delete-connection",
        {
          referenceId: data.referenceId,
          provider: data.provider!,
          accessToken: data.accessToken,
        },
        "banking",
      );

      return data;
    }),

  sync: protectedProcedure
    .input(syncBankConnectionSchema)
    .mutation(async ({ input }) => {
      const { id: jobId } = await triggerJob(
        "sync-connection",
        {
          connectionId: input.connectionId,
          manualSync: true,
        },
        "banking",
      );

      return { id: jobId };
    }),

  reconnect: protectedProcedure
    .input(reconnectBankConnectionSchema)
    .mutation(async ({ input, ctx: { teamId } }) => {
      const { id: jobId } = await triggerJob(
        "reconnect-connection",
        {
          teamId: teamId!,
          connectionId: input.connectionId,
          provider: input.provider,
        },
        "banking",
      );

      return { id: jobId };
    }),
});
