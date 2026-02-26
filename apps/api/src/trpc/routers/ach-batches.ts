import {
  createTRPCRouter,
  protectedProcedure,
  adminProcedure,
} from "@api/trpc/init";
import {
  getAchBatches,
  getAchBatchById,
  createAchBatch,
  addAchBatchItems,
  removeAchBatchItems,
  updateAchBatchStatus,
  getUpcomingPayments,
} from "@midday/db/queries";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

const RECONCILIATION_ROLES = ["owner", "admin", "member", "bookkeeper"];

const ensureReconciliationAccess = (role?: string | null) => {
  if (!role || !RECONCILIATION_ROLES.includes(role)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "ACH access required",
    });
  }
};

export const achBatchesRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(
      z.object({
        status: z.string().optional(),
        cursor: z.string().nullish(),
        pageSize: z.number().min(1).max(100).optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      ensureReconciliationAccess(ctx.role);
      return getAchBatches(ctx.db, {
        ...input,
        teamId: ctx.teamId!,
      });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      ensureReconciliationAccess(ctx.role);
      return getAchBatchById(ctx.db, {
        id: input.id,
        teamId: ctx.teamId!,
      });
    }),

  getUpcomingPayments: protectedProcedure
    .input(z.object({ effectiveDate: z.string() }))
    .query(async ({ input, ctx }) => {
      ensureReconciliationAccess(ctx.role);
      return getUpcomingPayments(ctx.db, {
        teamId: ctx.teamId!,
        effectiveDate: input.effectiveDate,
      });
    }),

  create: protectedProcedure
    .input(
      z.object({
        effectiveDate: z.string(),
        description: z.string().optional(),
        originatorBankAccountId: z.string().uuid().optional(),
        originatorName: z.string().optional(),
        originatorRouting: z.string().optional(),
        originatorAccount: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      ensureReconciliationAccess(ctx.role);
      return createAchBatch(ctx.db, {
        ...input,
        teamId: ctx.teamId!,
        createdBy: ctx.session.user.id,
      });
    }),

  addItems: protectedProcedure
    .input(
      z.object({
        batchId: z.string().uuid(),
        items: z.array(
          z.object({
            dealId: z.string().uuid(),
            mcaPaymentId: z.string().uuid().optional(),
            receiverName: z.string(),
            receiverRouting: z.string(),
            receiverAccount: z.string(),
            amount: z.number().positive(),
            transactionCode: z.string().optional(),
            individualId: z.string().optional(),
            addenda: z.string().optional(),
          }),
        ),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      ensureReconciliationAccess(ctx.role);
      return addAchBatchItems(ctx.db, {
        batchId: input.batchId,
        teamId: ctx.teamId!,
        items: input.items,
      });
    }),

  removeItems: protectedProcedure
    .input(
      z.object({
        batchId: z.string().uuid(),
        itemIds: z.array(z.string().uuid()),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      ensureReconciliationAccess(ctx.role);
      return removeAchBatchItems(ctx.db, {
        batchId: input.batchId,
        teamId: ctx.teamId!,
        itemIds: input.itemIds,
      });
    }),

  validate: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      ensureReconciliationAccess(ctx.role);

      const batch = await getAchBatchById(ctx.db, {
        id: input.id,
        teamId: ctx.teamId!,
      });

      if (!batch) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const errors: { itemId?: string; field: string; message: string }[] = [];

      // Validate each item
      for (const item of batch.items) {
        // Routing number: must be 9 digits
        if (!/^\d{9}$/.test(item.receiverRouting)) {
          errors.push({
            itemId: item.id,
            field: "receiverRouting",
            message: `Invalid routing number for ${item.receiverName}`,
          });
        }

        // Account number: must not be empty
        if (!item.receiverAccount || item.receiverAccount.length < 4) {
          errors.push({
            itemId: item.id,
            field: "receiverAccount",
            message: `Invalid account number for ${item.receiverName}`,
          });
        }

        // Amount: must be positive and reasonable
        if (item.amount <= 0 || item.amount > 999999.99) {
          errors.push({
            itemId: item.id,
            field: "amount",
            message: `Invalid amount $${item.amount} for ${item.receiverName}`,
          });
        }
      }

      const newStatus = errors.length === 0 ? "validated" : "draft";

      await updateAchBatchStatus(ctx.db, {
        id: input.id,
        teamId: ctx.teamId!,
        status: newStatus,
        validationErrors: errors,
      });

      return { valid: errors.length === 0, errors };
    }),

  generate: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      ensureReconciliationAccess(ctx.role);

      const batch = await getAchBatchById(ctx.db, {
        id: input.id,
        teamId: ctx.teamId!,
      });

      if (!batch || batch.status !== "validated") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Batch must be validated before generating",
        });
      }

      // NACHA generation will be triggered as a Trigger.dev task
      // For now, mark as processing
      await updateAchBatchStatus(ctx.db, {
        id: input.id,
        teamId: ctx.teamId!,
        status: "processing",
      });

      return { generating: true, batchId: input.id };
    }),

  updateStatus: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        status: z.enum(["submitted", "cancelled"]),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return updateAchBatchStatus(ctx.db, {
        id: input.id,
        teamId: ctx.teamId!,
        status: input.status,
      });
    }),
});
