import {
  addProviderAccountsSchema,
  createBankConnectionSchema,
  deleteBankConnectionSchema,
  getBankConnectionsSchema,
  reconnectBankConnectionSchema,
} from "@api/schemas/bank-connections";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import { chatCache } from "@midday/cache/chat-cache";
import {
  addProviderAccounts,
  createBankConnection,
  deleteBankConnection,
  getBankConnections,
  reconnectBankConnection,
} from "@midday/db/queries";
import type {
  DeleteConnectionPayload,
  InitialBankSetupPayload,
} from "@midday/jobs/schema";
import { tasks } from "@trigger.dev/sdk";
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

      try {
        await chatCache.invalidateTeamContext(teamId!);
      } catch {
        // Non-fatal — cache will expire naturally
      }

      const event = await tasks.trigger("initial-bank-setup", {
        connectionId: data.id,
        teamId: teamId!,
      } satisfies InitialBankSetupPayload);

      return event;
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

      await tasks.trigger("delete-connection", {
        referenceId: data.referenceId,
        provider: data.provider!,
        accessToken: data.accessToken,
      } satisfies DeleteConnectionPayload);

      return data;
    }),

  addAccounts: protectedProcedure
    .input(addProviderAccountsSchema)
    .mutation(async ({ input, ctx: { db, teamId, session } }) => {
      const result = await addProviderAccounts(db, {
        connectionId: input.connectionId,
        teamId: teamId!,
        userId: session.user.id,
        accounts: input.accounts,
      });

      try {
        await chatCache.invalidateTeamContext(teamId!);
      } catch {
        // Non-fatal
      }

      return result;
    }),

  reconnect: protectedProcedure
    .input(reconnectBankConnectionSchema)
    .mutation(async ({ input, ctx: { db, teamId } }) => {
      const result = await reconnectBankConnection(db, {
        referenceId: input.referenceId,
        newReferenceId: input.newReferenceId,
        expiresAt: input.expiresAt,
        teamId: teamId!,
      });

      if (!result) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Bank connection not found",
        });
      }

      return result;
    }),
});
