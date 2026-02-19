import {
  createBankAccountSchema,
  deleteBankAccountSchema,
  getBankAccountDetailsSchema,
  getBankAccountsSchema,
  updateBankAccountSchema,
} from "@api/schemas/bank-accounts";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import { chatCache } from "@midday/cache/chat-cache";
import {
  createBankAccount,
  deleteBankAccount,
  getBankAccountDetails,
  getBankAccounts,
  getBankAccountsBalances,
  getBankAccountsCurrencies,
  getBankAccountsWithPaymentInfo,
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

  /**
   * Get bank accounts with payment info (IBAN, routing numbers, etc.)
   * Used for invoice payment details slash command.
   * Only returns accounts that have at least one payment field populated.
   */
  getWithPaymentInfo: protectedProcedure.query(
    async ({ ctx: { db, teamId } }) => {
      return getBankAccountsWithPaymentInfo(db, {
        teamId: teamId!,
      });
    },
  ),

  currencies: protectedProcedure.query(async ({ ctx: { db, teamId } }) => {
    return getBankAccountsCurrencies(db, teamId!);
  }),

  balances: protectedProcedure.query(async ({ ctx: { db, teamId } }) => {
    return getBankAccountsBalances(db, teamId!);
  }),

  delete: protectedProcedure
    .input(deleteBankAccountSchema)
    .mutation(async ({ input, ctx: { db, teamId } }) => {
      const result = await deleteBankAccount(db, {
        id: input.id,
        teamId: teamId!,
      });

      try {
        await chatCache.invalidateTeamContext(teamId!);
      } catch {
        // Non-fatal — cache will expire naturally
      }

      return result;
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
      const result = await createBankAccount(db, {
        ...input,
        teamId: teamId!,
        userId: session.user.id,
        manual: input.manual,
      });

      try {
        await chatCache.invalidateTeamContext(teamId!);
      } catch {
        // Non-fatal — cache will expire naturally
      }

      return result;
    }),
});
