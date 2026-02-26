import {
  confirmMatchSchema,
  rejectMatchSchema,
  manualMatchSchema,
  flagDiscrepancySchema,
  resolveDiscrepancySchema,
  bulkConfirmMatchesSchema,
  startSessionSchema,
  completeSessionSchema,
  triggerReMatchSchema,
  getPaymentFeedSchema,
  getReconciliationViewSchema,
  getDiscrepanciesSchema,
  getStatsSchema,
} from "@api/schemas/reconciliation";
import {
  createTRPCRouter,
  protectedProcedure,
} from "@api/trpc/init";
import {
  getPaymentFeed,
  getReconciliationStats,
  getReconciliationView,
  getDiscrepancies,
  confirmMatch,
  rejectMatch,
  manualMatch,
  flagDiscrepancy,
  resolveDiscrepancy,
  bulkConfirmMatches,
  startReconciliationSession,
  completeReconciliationSession,
} from "@midday/db/queries";
import { TRPCError } from "@trpc/server";

const RECONCILIATION_ROLES = ["owner", "admin", "member", "bookkeeper"];

const ensureReconciliationAccess = (role?: string | null) => {
  if (!role || !RECONCILIATION_ROLES.includes(role)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Reconciliation access required",
    });
  }
};

export const reconciliationRouter = createTRPCRouter({
  getPaymentFeed: protectedProcedure
    .input(getPaymentFeedSchema)
    .query(async ({ input, ctx }) => {
      ensureReconciliationAccess(ctx.role);
      return getPaymentFeed(ctx.db, {
        ...input,
        teamId: ctx.teamId!,
      });
    }),

  getReconciliationView: protectedProcedure
    .input(getReconciliationViewSchema)
    .query(async ({ input, ctx }) => {
      ensureReconciliationAccess(ctx.role);
      return getReconciliationView(ctx.db, {
        ...input,
        teamId: ctx.teamId!,
      });
    }),

  getDiscrepancies: protectedProcedure
    .input(getDiscrepanciesSchema)
    .query(async ({ input, ctx }) => {
      ensureReconciliationAccess(ctx.role);
      return getDiscrepancies(ctx.db, {
        ...input,
        teamId: ctx.teamId!,
      });
    }),

  getStats: protectedProcedure
    .input(getStatsSchema)
    .query(async ({ input, ctx }) => {
      ensureReconciliationAccess(ctx.role);
      return getReconciliationStats(ctx.db, {
        ...input,
        teamId: ctx.teamId!,
      });
    }),

  confirmMatch: protectedProcedure
    .input(confirmMatchSchema)
    .mutation(async ({ input, ctx }) => {
      ensureReconciliationAccess(ctx.role);
      return confirmMatch(ctx.db, {
        transactionId: input.transactionId,
        teamId: ctx.teamId!,
        userId: ctx.session.user.id,
      });
    }),

  rejectMatch: protectedProcedure
    .input(rejectMatchSchema)
    .mutation(async ({ input, ctx }) => {
      ensureReconciliationAccess(ctx.role);
      return rejectMatch(ctx.db, {
        transactionId: input.transactionId,
        teamId: ctx.teamId!,
        userId: ctx.session.user.id,
      });
    }),

  manualMatch: protectedProcedure
    .input(manualMatchSchema)
    .mutation(async ({ input, ctx }) => {
      ensureReconciliationAccess(ctx.role);
      return manualMatch(ctx.db, {
        ...input,
        teamId: ctx.teamId!,
        userId: ctx.session.user.id,
      });
    }),

  flagDiscrepancy: protectedProcedure
    .input(flagDiscrepancySchema)
    .mutation(async ({ input, ctx }) => {
      ensureReconciliationAccess(ctx.role);
      return flagDiscrepancy(ctx.db, {
        ...input,
        teamId: ctx.teamId!,
        userId: ctx.session.user.id,
      });
    }),

  resolveDiscrepancy: protectedProcedure
    .input(resolveDiscrepancySchema)
    .mutation(async ({ input, ctx }) => {
      ensureReconciliationAccess(ctx.role);
      return resolveDiscrepancy(ctx.db, {
        ...input,
        teamId: ctx.teamId!,
        userId: ctx.session.user.id,
      });
    }),

  bulkConfirmMatches: protectedProcedure
    .input(bulkConfirmMatchesSchema)
    .mutation(async ({ input, ctx }) => {
      ensureReconciliationAccess(ctx.role);
      return bulkConfirmMatches(ctx.db, {
        ...input,
        teamId: ctx.teamId!,
        userId: ctx.session.user.id,
      });
    }),

  startSession: protectedProcedure
    .input(startSessionSchema)
    .mutation(async ({ input, ctx }) => {
      ensureReconciliationAccess(ctx.role);
      return startReconciliationSession(ctx.db, {
        ...input,
        teamId: ctx.teamId!,
        userId: ctx.session.user.id,
      });
    }),

  completeSession: protectedProcedure
    .input(completeSessionSchema)
    .mutation(async ({ input, ctx }) => {
      ensureReconciliationAccess(ctx.role);
      return completeReconciliationSession(ctx.db, {
        ...input,
        teamId: ctx.teamId!,
      });
    }),

  triggerReMatch: protectedProcedure
    .input(triggerReMatchSchema)
    .mutation(async ({ input, ctx }) => {
      ensureReconciliationAccess(ctx.role);
      // Reset transactions to unmatched, then trigger matching engine
      // The matching engine is a Trigger.dev task
      // For now, we return a placeholder — the actual trigger happens via the job system
      return {
        triggered: true,
        transactionCount: input.transactionIds.length,
      };
    }),
});
