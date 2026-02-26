import {
  createBankAccountSchema,
  deleteBankAccountSchema,
  getBankAccountDetailsSchema,
  getBankAccountsSchema,
  updateBankAccountSchema,
} from "@api/schemas/bank-accounts";
import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "@api/trpc/init";
import {
  createBankAccount,
  deleteBankAccount,
  getBankAccountById,
  getBankAccountDetails,
  getBankAccounts,
  getBankAccountsBalances,
  getBankAccountsCurrencies,
  updateBankAccount,
} from "@midday/db/queries";
import { z } from "zod";

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

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx: { db, teamId } }) => {
      return getBankAccountById(db, { id: input.id, teamId: teamId! });
    }),

  /**
   * Get decrypted account details (IBAN, account number, etc.)
   * Only call this when user explicitly requests to reveal account details.
   */
  getDetails: protectedProcedure
    .input(getBankAccountDetailsSchema)
    .query(async ({ input, ctx: { db, teamId } }) => {
      return getBankAccountDetails(db, {
        accountId: input.id,
        teamId: teamId!,
      });
    }),

  currencies: protectedProcedure.query(async ({ ctx: { db, teamId } }) => {
    return getBankAccountsCurrencies(db, teamId!);
  }),

  balances: protectedProcedure.query(async ({ ctx: { db, teamId } }) => {
    return getBankAccountsBalances(db, teamId!);
  }),

  delete: adminProcedure
    .input(deleteBankAccountSchema)
    .mutation(async ({ input, ctx: { db, teamId } }) => {
      return deleteBankAccount(db, {
        id: input.id,
        teamId: teamId!,
      });
    }),

  update: adminProcedure
    .input(updateBankAccountSchema)
    .mutation(async ({ input, ctx: { db, teamId } }) => {
      return updateBankAccount(db, {
        ...input,
        id: input.id!,
        teamId: teamId!,
      });
    }),

  create: adminProcedure
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
