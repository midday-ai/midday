import {
  createBankConnectionSchema,
  deleteBankConnectionSchema,
  getBankConnectionsSchema,
} from "@api/schemas/bank-connections";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import {
  createBankConnection,
  deleteBankConnection,
  getBankConnections,
} from "@midday/db/queries";
import { TRPCError } from "@trpc/server";
import { deleteConnectionJob } from "@worker/jobs";

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

      // const event = await tasks.trigger("initial-bank-setup", {
      //   connectionId: data.id,
      //   teamId: teamId!,
      // } satisfies InitialBankSetupPayload);

      // return event;
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

      await deleteConnectionJob.trigger({
        referenceId: data.referenceId!,
        provider: data.provider!,
        accessToken: data.accessToken,
      });

      return data;
    }),
});
