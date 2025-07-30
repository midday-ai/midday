import {
  createBankAccountSchema,
  deleteBankAccountSchema,
  getBankAccountsSchema,
  updateBankAccountSchema,
} from "@api/schemas/bank-accounts";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import {
  createBankAccount,
  deleteBankAccount,
  getBankAccounts,
  getBankAccountsBalances,
  getBankAccountsCurrencies,
  updateBankAccount,
} from "@midday/db/queries";

export const bankAccountsRouter = createTRPCRouter({
  get: protectedProcedure
    .input(getBankAccountsSchema.optional())
    .query(async ({ input, ctx: { db, teamId } }) => {
      return getBankAccounts(db, {
        teamId: teamId!,
        enabled: input?.enabled,
        manual: input?.manual,
      });
    }),

  currencies: protectedProcedure.query(async ({ ctx: { db, teamId } }) => {
    return getBankAccountsCurrencies(db, teamId!);
  }),

  balances: protectedProcedure.query(async ({ ctx: { db, teamId } }) => {
    return getBankAccountsBalances(db, teamId!);
  }),

  delete: protectedProcedure
    .input(deleteBankAccountSchema)
    .mutation(async ({ input, ctx: { db, teamId } }) => {
      return deleteBankAccount(db, {
        id: input.id,
        teamId: teamId!,
      });
    }),

  update: protectedProcedure
    .input(updateBankAccountSchema)
    .mutation(async ({ input, ctx: { db, teamId } }) => {
      return updateBankAccount(db, {
        ...input,
        id: input.id!,
        teamId: teamId!,
      });
    }),

  create: protectedProcedure
    .input(createBankAccountSchema)
    .mutation(async ({ input, ctx: { db, teamId, session } }) => {
      return createBankAccount(db, {
        ...input,
        teamId: teamId!,
        userId: session.user.id,
        manual: input.manual,
      });
    }),
});
