import {
  createBankConnection,
  deleteBankConnection,
  getBankConnections,
} from "@api/db/queries/bank-connections";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import type { deleteConnection } from "@midday/jobs/tasks/bank/delete/delete-connection";
import type { initialBankSetup } from "@midday/jobs/tasks/bank/setup/initial";
import { tasks } from "@trigger.dev/sdk/v3";
import { TRPCError } from "@trpc/server";
import {
  createBankConnectionSchema,
  deleteBankConnectionSchema,
  getBankConnectionsSchema,
} from "./schema";

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

      const event = await tasks.trigger<typeof initialBankSetup>(
        "initial-bank-setup",
        {
          connectionId: data.id,
          teamId: teamId!,
        },
      );

      return event;
    }),

  delete: protectedProcedure
    .input(deleteBankConnectionSchema)
    .mutation(async ({ input, ctx: { db } }) => {
      const data = await deleteBankConnection(db, input.id);

      if (!data) {
        throw new Error("Bank connection not found");
      }

      await tasks.trigger<typeof deleteConnection>("delete-connection", {
        referenceId: data.referenceId,
        provider: data.provider!,
        accessToken: data.accessToken,
      });

      return data;
    }),
});
