import {
  createBankAccount,
  deleteBankAccount,
  getBankAccounts,
  getBankAccountsBalances,
  getBankAccountsCurrencies,
  updateBankAccount,
} from "@api/db/queries/bank-accounts";
import {
  createBankAccountSchema,
  deleteBankAccountSchema,
  getBankAccountsSchema,
  updateBankAccountSchema,
} from "@api/schemas/bank-accounts";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import { nanoid } from "nanoid";

export const bankAccountsRouter = createTRPCRouter({
  get: protectedProcedure
    .input(getBankAccountsSchema)
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
    .mutation(async ({ input, ctx: { db } }) => {
      return deleteBankAccount(db, input.id);
    }),

  update: protectedProcedure
    .input(updateBankAccountSchema)
    .mutation(async ({ input, ctx: { db, teamId } }) => {
      return updateBankAccount(db, {
        ...input,
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
        accountId: nanoid(),
        manual: input.manual,
      });
    }),
});
