import {
  cancelScheduledDealSchema,
  createDealSchema,
  deleteDealSchema,
  draftDealSchema,
  duplicateDealSchema,
  getDealByIdSchema,
  getDealByTokenSchema,
  getDealsSchema,
  dealSummarySchema,
  remindDealSchema,
  searchDealNumberSchema,
  updateDealSchema,
  updateScheduledDealSchema,
} from "@api/schemas/deal";
import {
  createTRPCRouter,
  memberProcedure,
  protectedProcedure,
  publicProcedure,
} from "@api/trpc/init";
import { parseInputValue } from "@api/utils/parse";
import { UTCDate } from "@date-fns/utc";
import {
  deleteDeal,
  draftDeal,
  duplicateDeal,
  getAverageDaysToPayment,
  getAverageDealSize,
  getInactiveMerchantsCount,
  getDealById,
  getDealSummary,
  getDealTemplate,
  getDeals,
  getMerchantById,
  getMostActiveMerchant,
  getNewMerchantsCount,
  getNextDealNumber,
  getPaymentStatus,
  getTeamById,
  getTopRevenueMerchant,
  getUserById,
  searchDealNumber,
  updateDeal,
} from "@midday/db/queries";
import { DEFAULT_TEMPLATE } from "@midday/deal";
import { verify } from "@midday/deal/token";
import { transformMerchantToContent } from "@midday/deal/utils";
import { decodeJobId, getQueue, triggerJob } from "@midday/job-client";
import { TRPCError } from "@trpc/server";
import { addDays } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

// Use the shared default template from @midday/deal
const defaultTemplate = DEFAULT_TEMPLATE;

export const dealRouter = createTRPCRouter({
  get: protectedProcedure
    .input(getDealsSchema.optional())
    .query(async ({ input, ctx: { db, teamId } }) => {
      return getDeals(db, {
        teamId: teamId!,
        ...input,
      });
    }),

  getById: protectedProcedure
    .input(getDealByIdSchema)
    .query(async ({ input, ctx: { db, teamId } }) => {
      return getDealById(db, {
        id: input.id,
        teamId: teamId!,
      });
    }),

  getDealByToken: publicProcedure
    .input(getDealByTokenSchema)
    .query(async ({ input, ctx: { db } }) => {
      const { id } = (await verify(decodeURIComponent(input.token))) as {
        id: string;
      };

      if (!id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return getDealById(db, {
        id,
      });
    }),

  paymentStatus: protectedProcedure.query(async ({ ctx: { db, teamId } }) => {
    return getPaymentStatus(db, teamId!);
  }),

  searchDealNumber: protectedProcedure
    .input(searchDealNumberSchema)
    .query(async ({ input, ctx: { db, teamId } }) => {
      return searchDealNumber(db, {
        teamId: teamId!,
        query: input.query,
      });
    }),

  dealSummary: protectedProcedure
    .input(dealSummarySchema.optional())
    .query(async ({ ctx: { db, teamId }, input }) => {
      return getDealSummary(db, {
        teamId: teamId!,
        statuses: input?.statuses,
      });
    }),

  defaultSettings: protectedProcedure.query(
    async ({ ctx: { db, teamId, session, geo } }) => {
      // Fetch deal number, template, and team details concurrently
      const [nextDealNumber, template, team, user] = await Promise.all([
        getNextDealNumber(db, teamId!),
        getDealTemplate(db, teamId!),
        getTeamById(db, teamId!),
        getUserById(db, session?.user.id!),
      ]);

      const locale = user?.locale ?? geo?.locale ?? "en";
      const timezone = user?.timezone ?? geo?.timezone ?? "America/New_York";
      const currency =
        template?.currency ?? team?.baseCurrency ?? defaultTemplate.currency;
      const dateFormat =
        template?.dateFormat ?? user?.dateFormat ?? defaultTemplate.dateFormat;
      const logoUrl = template?.logoUrl ?? defaultTemplate.logoUrl;
      const countryCode = geo?.country ?? "US";

      // Default to letter size for US/CA, A4 for rest of world
      const size = ["US", "CA"].includes(countryCode) ? "letter" : "a4";

      const savedTemplate = {
        id: template?.id,
        name: template?.name ?? "Default",
        isDefault: template?.isDefault ?? true,
        title: template?.title ?? defaultTemplate.title,
        logoUrl,
        currency,
        size: template?.size ?? defaultTemplate.size,
        includeDiscount:
          template?.includeDiscount ?? defaultTemplate.includeDiscount,
        includeDecimals:
          template?.includeDecimals ?? defaultTemplate.includeDecimals,
        includeUnits: template?.includeUnits ?? defaultTemplate.includeUnits,
        includeQr: template?.includeQr ?? defaultTemplate.includeQr,
        includePdf: template?.includePdf ?? defaultTemplate.includePdf,
        sendCopy: template?.sendCopy ?? defaultTemplate.sendCopy,
        customerLabel: template?.customerLabel ?? defaultTemplate.customerLabel,
        fromLabel: template?.fromLabel ?? defaultTemplate.fromLabel,
        dealNoLabel:
          template?.dealNoLabel ?? defaultTemplate.dealNoLabel,
        subtotalLabel: template?.subtotalLabel ?? defaultTemplate.subtotalLabel,
        issueDateLabel:
          template?.issueDateLabel ?? defaultTemplate.issueDateLabel,
        totalSummaryLabel:
          template?.totalSummaryLabel ?? defaultTemplate.totalSummaryLabel,
        dueDateLabel: template?.dueDateLabel ?? defaultTemplate.dueDateLabel,
        discountLabel: template?.discountLabel ?? defaultTemplate.discountLabel,
        descriptionLabel:
          template?.descriptionLabel ?? defaultTemplate.descriptionLabel,
        priceLabel: template?.priceLabel ?? defaultTemplate.priceLabel,
        quantityLabel: template?.quantityLabel ?? defaultTemplate.quantityLabel,
        totalLabel: template?.totalLabel ?? defaultTemplate.totalLabel,
        paymentLabel: template?.paymentLabel ?? defaultTemplate.paymentLabel,
        noteLabel: template?.noteLabel ?? defaultTemplate.noteLabel,
        dateFormat,
        deliveryType: template?.deliveryType ?? defaultTemplate.deliveryType,
        fromDetails: template?.fromDetails ?? defaultTemplate.fromDetails,
        paymentDetails:
          template?.paymentDetails ?? defaultTemplate.paymentDetails,
        noteDetails: template?.noteDetails ?? defaultTemplate.noteDetails,
        timezone,
        locale,
        paymentEnabled:
          template?.paymentEnabled ?? defaultTemplate.paymentEnabled,
        paymentTermsDays: template?.paymentTermsDays ?? 30,
      };

      // Calculate due date based on payment terms (default 30 days)
      const paymentTermsDays = savedTemplate.paymentTermsDays ?? 30;

      return {
        // Default values first
        id: uuidv4(),
        currency,
        status: "draft",
        size,
        includeDiscount: false,
        includeDecimals: false,
        includePdf: false,
        sendCopy: false,
        includeUnits: false,
        includeQr: true,
        dealNumber: nextDealNumber,
        timezone,
        locale,
        fromDetails: savedTemplate.fromDetails,
        paymentDetails: savedTemplate.paymentDetails,
        merchantDetails: undefined,
        noteDetails: savedTemplate.noteDetails,
        merchantId: undefined,
        issueDate: new UTCDate().toISOString(),
        dueDate: addDays(new UTCDate(), paymentTermsDays).toISOString(),
        lineItems: [{ name: "", quantity: 0, price: 0 }],
        token: undefined,
        discount: undefined,
        subtotal: undefined,
        topBlock: undefined,
        bottomBlock: undefined,
        amount: undefined,
        merchantName: undefined,
        logoUrl: undefined,
        template: savedTemplate,
      };
    },
  ),

  update: memberProcedure
    .input(updateDealSchema)
    .mutation(async ({ input, ctx: { db, teamId, session } }) => {
      return updateDeal(db, {
        ...input,
        teamId: teamId!,
        userId: session.user.id,
      });
    }),

  delete: memberProcedure
    .input(deleteDealSchema)
    .mutation(async ({ input, ctx: { db, teamId } }) => {
      return deleteDeal(db, {
        id: input.id,
        teamId: teamId!,
      });
    }),

  draft: memberProcedure
    .input(draftDealSchema)
    .mutation(async ({ input, ctx: { db, teamId, session } }) => {
      // Generate deal number if not provided
      const dealNumber =
        input.dealNumber || (await getNextDealNumber(db, teamId!));

      return draftDeal(db, {
        ...input,
        dealNumber,
        teamId: teamId!,
        userId: session?.user.id!,
        paymentDetails: parseInputValue(input.paymentDetails),
        fromDetails: parseInputValue(input.fromDetails),
        merchantDetails: parseInputValue(input.merchantDetails),
        noteDetails: parseInputValue(input.noteDetails),
      });
    }),

  create: memberProcedure
    .input(createDealSchema)
    .mutation(async ({ input, ctx: { db, teamId, session } }) => {
      // Handle different delivery types
      if (input.deliveryType === "scheduled") {
        if (!input.scheduledAt) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "scheduledAt is required for scheduled delivery",
          });
        }

        // Convert to Date object and validate it's in the future
        const scheduledDate = new Date(input.scheduledAt);
        const now = new Date();

        if (scheduledDate <= now) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "scheduledAt must be in the future",
          });
        }

        // Check if this is an existing scheduled deal
        const existingDeal = await getDealById(db, {
          id: input.id,
          teamId: teamId!,
        });

        let scheduledJobId: string | null = null;

        try {
          // Calculate delay in milliseconds from now
          const delayMs = scheduledDate.getTime() - now.getTime();

          // Create the new scheduled job FIRST to ensure we don't lose the job if creation fails
          const scheduledRun = await triggerJob(
            "schedule-deal",
            {
              dealId: input.id,
            },
            "deals",
            {
              delay: delayMs,
            },
          );

          if (!scheduledRun?.id) {
            throw new Error(
              "Failed to create scheduled job - no job ID returned",
            );
          }

          scheduledJobId = scheduledRun.id;

          // Only remove the old job AFTER successfully creating the new one
          // This ensures we never lose the scheduled job even if there are transient failures
          if (existingDeal?.scheduledJobId) {
            const queue = getQueue("deals");
            // Decode composite ID (format: "deals:123") to get raw job ID for BullMQ
            const { jobId: rawJobId } = decodeJobId(
              existingDeal.scheduledJobId,
            );
            const existingJob = await queue.getJob(rawJobId);
            if (existingJob) {
              await existingJob.remove().catch((err) => {
                // Log but don't fail - the old job will eventually be cleaned up or run (harmlessly)
                // since we've already created the new job and will update the deal
                console.error("Failed to remove old scheduled job:", err);
              });
            }
          }
        } catch (error) {
          throw new TRPCError({
            code: "SERVICE_UNAVAILABLE",
            cause: error,
          });
        }

        // Only update the deal status to "scheduled" if we successfully created/rescheduled the job
        if (!scheduledJobId) {
          throw new TRPCError({
            code: "SERVICE_UNAVAILABLE",
          });
        }

        // Update the deal with scheduling information
        const data = await updateDeal(db, {
          id: input.id,
          status: "scheduled",
          scheduledAt: input.scheduledAt,
          scheduledJobId,
          teamId: teamId!,
        });

        if (!data) {
          // Clean up the orphaned job before throwing
          try {
            const queue = getQueue("deals");
            const { jobId: rawJobId } = decodeJobId(scheduledJobId);
            const job = await queue.getJob(rawJobId);
            if (job) {
              await job.remove();
            }
          } catch (err) {
            console.error("Failed to clean up orphaned scheduled job:", err);
          }

          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Deal not found",
          });
        }

        // Fire and forget notification - don't block the response
        triggerJob(
          "deal-notification",
          {
            type: "scheduled",
            teamId: teamId!,
            dealId: input.id,
            dealNumber: data.dealNumber!,
            scheduledAt: input.scheduledAt,
            merchantName: data.merchantName ?? undefined,
          },
          "deals",
        ).catch(() => {
          // Ignore notification errors - deal was scheduled successfully
        });

        return data;
      }

      const data = await updateDeal(db, {
        id: input.id,
        status: "unpaid",
        teamId: teamId!,
        userId: session.user.id,
      });

      if (!data) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Deal not found",
        });
      }

      await triggerJob(
        "generate-deal",
        {
          dealId: data.id,
          deliveryType: input.deliveryType,
        },
        "deals",
      );

      return data;
    }),

  remind: memberProcedure
    .input(remindDealSchema)
    .mutation(async ({ input, ctx: { db, teamId } }) => {
      await triggerJob(
        "send-deal-reminder",
        {
          dealId: input.id,
        },
        "deals",
      );

      return updateDeal(db, {
        id: input.id,
        teamId: teamId!,
        reminderSentAt: input.date,
      });
    }),

  duplicate: memberProcedure
    .input(duplicateDealSchema)
    .mutation(async ({ input, ctx: { db, session, teamId } }) => {
      const nextDealNumber = await getNextDealNumber(db, teamId!);

      return duplicateDeal(db, {
        id: input.id,
        userId: session?.user.id!,
        dealNumber: nextDealNumber!,
        teamId: teamId!,
      });
    }),

  updateSchedule: memberProcedure
    .input(updateScheduledDealSchema)
    .mutation(async ({ input, ctx: { db, teamId } }) => {
      // Get the current deal to find the old scheduled job ID
      const deal = await getDealById(db, {
        id: input.id,
        teamId: teamId!,
      });

      if (!deal || !deal.scheduledJobId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Scheduled deal not found",
        });
      }

      // Convert to Date object and validate it's in the future
      const scheduledDate = new Date(input.scheduledAt);
      const now = new Date();

      if (scheduledDate <= now) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "scheduledAt must be in the future",
        });
      }

      // Calculate new delay
      const delayMs = scheduledDate.getTime() - now.getTime();

      // Create new scheduled job FIRST to ensure we don't lose the job if creation fails
      const scheduledRun = await triggerJob(
        "schedule-deal",
        {
          dealId: input.id,
        },
        "deals",
        {
          delay: delayMs,
        },
      );

      if (!scheduledRun?.id) {
        throw new TRPCError({
          code: "SERVICE_UNAVAILABLE",
          message: "Failed to create scheduled job",
        });
      }

      // Update the scheduled date and job ID in the database
      const updatedDeal = await updateDeal(db, {
        id: input.id,
        scheduledAt: input.scheduledAt,
        scheduledJobId: scheduledRun.id,
        teamId: teamId!,
      });

      if (!updatedDeal) {
        // Database update failed - clean up the newly created job to avoid orphans
        const queue = getQueue("deals");
        const { jobId: newRawJobId } = decodeJobId(scheduledRun.id);
        const newJob = await queue.getJob(newRawJobId);
        if (newJob) {
          await newJob.remove().catch((err) => {
            console.error("Failed to clean up orphaned scheduled job:", err);
          });
        }

        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Deal not found or update failed",
        });
      }

      // Only remove the old job AFTER successfully creating the new one and updating the database
      // This ensures we never lose the scheduled job even if there are transient failures
      const queue = getQueue("deals");
      // Decode composite ID (format: "deals:123") to get raw job ID for BullMQ
      const { jobId: rawJobId } = decodeJobId(deal.scheduledJobId);
      const existingJob = await queue.getJob(rawJobId);
      if (existingJob) {
        await existingJob.remove().catch((err) => {
          // Log but don't fail - the old job will be detected as stale by the processor
          // since it verifies job.id matches deal.scheduledJobId before processing
          console.error("Failed to remove old scheduled job:", err);
        });
      }

      return updatedDeal;
    }),

  cancelSchedule: memberProcedure
    .input(cancelScheduledDealSchema)
    .mutation(async ({ input, ctx: { db, teamId } }) => {
      // Get the current deal to find the scheduled job ID
      const deal = await getDealById(db, {
        id: input.id,
        teamId: teamId!,
      });

      if (!deal) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Scheduled deal not found",
        });
      }

      if (deal.scheduledJobId) {
        // Cancel the scheduled job by removing it from the queue
        const queue = getQueue("deals");
        // Decode composite ID (format: "deals:123") to get raw job ID for BullMQ
        const { jobId: rawJobId } = decodeJobId(deal.scheduledJobId);
        const job = await queue.getJob(rawJobId);
        if (job) {
          await job.remove();
        }
      }

      // Update the deal status back to draft and clear scheduling fields
      const updatedDeal = await updateDeal(db, {
        id: input.id,
        status: "draft",
        scheduledAt: null,
        scheduledJobId: null,
        teamId: teamId!,
      });

      return updatedDeal;
    }),

  mostActiveMerchant: protectedProcedure.query(
    async ({ ctx: { db, teamId } }) => {
      return getMostActiveMerchant(db, { teamId: teamId! });
    },
  ),

  inactiveMerchantsCount: protectedProcedure.query(
    async ({ ctx: { db, teamId } }) => {
      return getInactiveMerchantsCount(db, { teamId: teamId! });
    },
  ),

  averageDaysToPayment: protectedProcedure.query(
    async ({ ctx: { db, teamId } }) => {
      return getAverageDaysToPayment(db, { teamId: teamId! });
    },
  ),

  averageDealSize: protectedProcedure.query(
    async ({ ctx: { db, teamId } }) => {
      return getAverageDealSize(db, { teamId: teamId! });
    },
  ),

  topRevenueMerchant: protectedProcedure.query(
    async ({ ctx: { db, teamId } }) => {
      return getTopRevenueMerchant(db, { teamId: teamId! });
    },
  ),

  newMerchantsCount: protectedProcedure.query(
    async ({ ctx: { db, teamId } }) => {
      return getNewMerchantsCount(db, { teamId: teamId! });
    },
  ),
});
