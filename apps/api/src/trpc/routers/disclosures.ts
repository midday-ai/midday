import {
  createTRPCRouter,
  memberProcedure,
  protectedProcedure,
} from "@api/trpc/init";
import {
  acknowledgeDisclosureSchema,
  generateDisclosureSchema,
  getDisclosureByIdSchema,
  getDisclosuresByDealSchema,
  listDisclosuresSchema,
  previewDisclosureSchema,
} from "@api/schemas/disclosures";
import {
  acknowledgeDisclosure,
  createDisclosure,
  getDealFeesByDeal,
  getDisclosureById,
  getDisclosures,
  getDisclosuresByDeal,
  getMcaDealById,
  supersedeDealDisclosures,
} from "@midday/db/queries";
import {
  calculateDisclosureFigures,
  getApplicableState,
  isDealSubjectToDisclosure,
} from "@midday/disclosures";
import type { DealFee, DealTerms } from "@midday/disclosures/types";
import { getAllActiveStates, getAllStates } from "@midday/disclosures/states";
import { TRPCError } from "@trpc/server";

export const disclosuresRouter = createTRPCRouter({
  /** Generate a disclosure for a deal — creates record and queues PDF generation */
  generate: memberProcedure
    .input(generateDisclosureSchema)
    .mutation(async ({ input, ctx: { db, teamId, session } }) => {
      const deal = await getMcaDealById(db, {
        id: input.dealId,
        teamId: teamId!,
      });

      if (!deal) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Deal not found",
        });
      }

      if (!deal.fundedAt || !deal.expectedPayoffDate) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Deal must have both fundedAt and expectedPayoffDate set before generating a disclosure",
        });
      }

      const merchantState =
        input.stateOverride ?? (deal as { merchant?: { state?: string } }).merchant?.state;

      if (!merchantState) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Merchant state is required. Set the merchant's state or provide a stateOverride.",
        });
      }

      const stateConfig = getApplicableState(merchantState);

      if (!stateConfig) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `No active disclosure requirements for state: ${merchantState}`,
        });
      }

      // Get deal fees
      const fees = await getDealFeesByDeal(db, {
        dealId: input.dealId,
        teamId: teamId!,
      });

      const dealTerms: DealTerms = {
        fundingAmount: deal.fundingAmount,
        factorRate: deal.factorRate,
        paybackAmount: deal.paybackAmount,
        dailyPayment: deal.dailyPayment,
        paymentFrequency: (deal.paymentFrequency ?? "daily") as DealTerms["paymentFrequency"],
        fundedAt: deal.fundedAt,
        expectedPayoffDate: deal.expectedPayoffDate,
        fees: fees.map(
          (f): DealFee => ({
            feeType: f.feeType as DealFee["feeType"],
            feeName: f.feeName,
            amount: f.amount,
            percentage: f.percentage,
          }),
        ),
      };

      if (!isDealSubjectToDisclosure(dealTerms, stateConfig)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Deal funding amount ($${deal.fundingAmount.toLocaleString()}) exceeds ${stateConfig.stateName} threshold ($${stateConfig.maxFundingThreshold.toLocaleString()})`,
        });
      }

      // Calculate figures
      const figures = calculateDisclosureFigures(dealTerms, stateConfig);

      // Mark existing completed disclosures as superseded
      await supersedeDealDisclosures(db, {
        dealId: input.dealId,
        teamId: teamId!,
      });

      // Create disclosure record
      const disclosure = await createDisclosure(db, {
        dealId: input.dealId,
        teamId: teamId!,
        stateCode: stateConfig.stateCode,
        templateVersion: stateConfig.version,
        generatedBy: session?.user?.id,
        dealSnapshot: {
          deal: dealTerms,
          merchantState,
          merchantName: (deal as { merchant?: { name?: string } }).merchant?.name,
        },
      });

      // Queue BullMQ job for PDF generation
      // Note: The worker will independently calculate figures and render the PDF.
      // We pass the figures here for immediate UI display while the PDF generates async.
      try {
        const { disclosuresQueue } = await import(
          // @ts-ignore - worker module, may not be available in all environments
          "../../../../worker/src/queues/disclosures"
        );
        await disclosuresQueue.add("generate-disclosure", {
          disclosureId: disclosure.id,
          dealId: input.dealId,
          teamId: teamId!,
          stateCode: stateConfig.stateCode,
        });
      } catch {
        // Queue may not be available in all environments (e.g., edge runtime)
        // The disclosure record is created; PDF can be generated later
      }

      return { disclosure, figures };
    }),

  /** Preview disclosure figures without generating a document */
  preview: protectedProcedure
    .input(previewDisclosureSchema)
    .query(async ({ input, ctx: { db, teamId } }) => {
      const deal = await getMcaDealById(db, {
        id: input.dealId,
        teamId: teamId!,
      });

      if (!deal) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Deal not found",
        });
      }

      if (!deal.fundedAt || !deal.expectedPayoffDate) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Deal must have both fundedAt and expectedPayoffDate set to preview disclosure figures",
        });
      }

      const merchantState =
        input.stateOverride ?? (deal as { merchant?: { state?: string } }).merchant?.state;

      if (!merchantState) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Merchant state is required",
        });
      }

      const stateConfig = getApplicableState(merchantState);

      if (!stateConfig) {
        return { applicable: false, stateCode: merchantState, figures: null };
      }

      const fees = await getDealFeesByDeal(db, {
        dealId: input.dealId,
        teamId: teamId!,
      });

      const dealTerms: DealTerms = {
        fundingAmount: deal.fundingAmount,
        factorRate: deal.factorRate,
        paybackAmount: deal.paybackAmount,
        dailyPayment: deal.dailyPayment,
        paymentFrequency: (deal.paymentFrequency ?? "daily") as DealTerms["paymentFrequency"],
        fundedAt: deal.fundedAt,
        expectedPayoffDate: deal.expectedPayoffDate,
        fees: fees.map(
          (f): DealFee => ({
            feeType: f.feeType as DealFee["feeType"],
            feeName: f.feeName,
            amount: f.amount,
            percentage: f.percentage,
          }),
        ),
      };

      const subjectToDisclosure = isDealSubjectToDisclosure(
        dealTerms,
        stateConfig,
      );

      const figures = calculateDisclosureFigures(dealTerms, stateConfig);

      return {
        applicable: subjectToDisclosure,
        stateCode: stateConfig.stateCode,
        stateName: stateConfig.stateName,
        lawName: stateConfig.lawName,
        threshold: stateConfig.maxFundingThreshold,
        figures,
      };
    }),

  getById: protectedProcedure
    .input(getDisclosureByIdSchema)
    .query(async ({ input, ctx: { db, teamId } }) => {
      return getDisclosureById(db, {
        id: input.id,
        teamId: teamId!,
      });
    }),

  getByDeal: protectedProcedure
    .input(getDisclosuresByDealSchema)
    .query(async ({ input, ctx: { db, teamId } }) => {
      return getDisclosuresByDeal(db, {
        dealId: input.dealId,
        teamId: teamId!,
      });
    }),

  list: protectedProcedure
    .input(listDisclosuresSchema)
    .query(async ({ input, ctx: { db, teamId } }) => {
      return getDisclosures(db, {
        ...input,
        teamId: teamId!,
      });
    }),

  acknowledge: memberProcedure
    .input(acknowledgeDisclosureSchema)
    .mutation(async ({ input, ctx: { db, teamId } }) => {
      return acknowledgeDisclosure(db, {
        ...input,
        teamId: teamId!,
      });
    }),

  /** Get all configured state disclosure requirements */
  getStates: protectedProcedure.query(async () => {
    return getAllStates().map((config) => ({
      stateCode: config.stateCode,
      stateName: config.stateName,
      lawName: config.lawName,
      effectiveDate: config.effectiveDate,
      status: config.status,
      version: config.version,
      maxFundingThreshold: config.maxFundingThreshold,
      requiresRegistration: config.requiresRegistration,
    }));
  }),

  /** Get only active state configs */
  getActiveStates: protectedProcedure.query(async () => {
    return getAllActiveStates().map((config) => ({
      stateCode: config.stateCode,
      stateName: config.stateName,
      lawName: config.lawName,
      effectiveDate: config.effectiveDate,
      version: config.version,
      maxFundingThreshold: config.maxFundingThreshold,
    }));
  }),
});
