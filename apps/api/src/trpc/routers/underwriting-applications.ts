import {
  createTRPCRouter,
  memberProcedure,
  protectedProcedure,
} from "@api/trpc/init";
import {
  getUnderwritingByMerchant,
  getUnderwritingApplicationById,
  createUnderwritingApplication,
  updateUnderwritingApplication,
} from "@db/queries/underwriting-applications";
import {
  getUnderwritingDocuments,
  createUnderwritingDocument,
  updateUnderwritingDocument,
} from "@db/queries/underwriting-documents";
import { getUnderwritingScore } from "@db/queries/underwriting-scores";
import {
  getUnderwritingDocRequirements,
  upsertUnderwritingDocRequirement,
  deleteUnderwritingDocRequirement,
  seedDefaultDocRequirements,
} from "@db/queries/underwriting-requirements";
import { z } from "zod";

export const underwritingApplicationsRouter = createTRPCRouter({
  // ===========================================================================
  // Applications
  // ===========================================================================

  getByMerchant: protectedProcedure
    .input(z.object({ merchantId: z.string().uuid() }))
    .query(async ({ ctx: { db, teamId }, input }) => {
      return getUnderwritingByMerchant(db, {
        merchantId: input.merchantId,
        teamId: teamId!,
      });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx: { db, teamId }, input }) => {
      return getUnderwritingApplicationById(db, {
        id: input.id,
        teamId: teamId!,
      });
    }),

  create: memberProcedure
    .input(
      z.object({
        merchantId: z.string().uuid(),
        requestedAmountMin: z.number().optional(),
        requestedAmountMax: z.number().optional(),
        useOfFunds: z.string().optional(),
        ficoRange: z.string().optional(),
        timeInBusinessMonths: z.number().optional(),
        brokerNotes: z.string().optional(),
        priorMcaHistory: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      return createUnderwritingApplication(db, {
        merchantId: input.merchantId,
        teamId: teamId!,
        requestedAmountMin: input.requestedAmountMin,
        requestedAmountMax: input.requestedAmountMax,
        useOfFunds: input.useOfFunds,
        ficoRange: input.ficoRange,
        timeInBusinessMonths: input.timeInBusinessMonths,
        brokerNotes: input.brokerNotes,
        priorMcaHistory: input.priorMcaHistory,
      });
    }),

  update: memberProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        status: z
          .enum([
            "pending_documents",
            "in_review",
            "scoring",
            "approved",
            "declined",
            "review_needed",
          ])
          .optional(),
        requestedAmountMin: z.number().nullable().optional(),
        requestedAmountMax: z.number().nullable().optional(),
        useOfFunds: z.string().nullable().optional(),
        ficoRange: z.string().nullable().optional(),
        timeInBusinessMonths: z.number().nullable().optional(),
        brokerNotes: z.string().nullable().optional(),
        priorMcaHistory: z.string().nullable().optional(),
        decision: z
          .enum(["approved", "declined", "review_needed"])
          .nullable()
          .optional(),
        decisionNotes: z.string().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx: { db, teamId, session }, input }) => {
      const { id, decision, ...rest } = input;

      // Auto-populate decisionDate and decidedBy when a decision is set
      const decisionFields =
        decision !== undefined && decision !== null
          ? {
              decision,
              decisionDate: new Date().toISOString(),
              decidedBy: session.user.id,
            }
          : decision === null
            ? {
                decision: null,
                decisionDate: null,
                decidedBy: null,
              }
            : {};

      return updateUnderwritingApplication(db, {
        id,
        teamId: teamId!,
        ...rest,
        ...decisionFields,
      });
    }),

  // ===========================================================================
  // Documents
  // ===========================================================================

  getDocuments: protectedProcedure
    .input(z.object({ applicationId: z.string().uuid() }))
    .query(async ({ ctx: { db, teamId }, input }) => {
      return getUnderwritingDocuments(db, {
        applicationId: input.applicationId,
        teamId: teamId!,
      });
    }),

  uploadDocument: memberProcedure
    .input(
      z.object({
        applicationId: z.string().uuid(),
        requirementId: z.string().uuid().optional(),
        filePath: z.string(),
        fileName: z.string(),
        fileSize: z.number().optional(),
        documentType: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      return createUnderwritingDocument(db, {
        applicationId: input.applicationId,
        teamId: teamId!,
        requirementId: input.requirementId,
        filePath: input.filePath,
        fileName: input.fileName,
        fileSize: input.fileSize,
        documentType: input.documentType,
      });
    }),

  updateDocument: memberProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        processingStatus: z
          .enum(["pending", "processing", "completed", "failed"])
          .optional(),
        extractionResults: z.unknown().optional(),
        waived: z.boolean().optional(),
        waiveReason: z.string().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      return updateUnderwritingDocument(db, {
        id: input.id,
        teamId: teamId!,
        processingStatus: input.processingStatus,
        extractionResults: input.extractionResults,
        waived: input.waived,
        waiveReason: input.waiveReason,
      });
    }),

  // ===========================================================================
  // Scores
  // ===========================================================================

  getScore: protectedProcedure
    .input(z.object({ applicationId: z.string().uuid() }))
    .query(async ({ ctx: { db, teamId }, input }) => {
      return getUnderwritingScore(db, {
        applicationId: input.applicationId,
        teamId: teamId!,
      });
    }),

  // ===========================================================================
  // Document Requirements
  // ===========================================================================

  getRequirements: protectedProcedure.query(
    async ({ ctx: { db, teamId } }) => {
      return getUnderwritingDocRequirements(db, {
        teamId: teamId!,
      });
    },
  ),

  upsertRequirement: memberProcedure
    .input(
      z.object({
        id: z.string().uuid().optional(),
        name: z.string().min(1),
        description: z.string().optional(),
        required: z.boolean().optional(),
        appliesToStates: z.array(z.string()).optional(),
        sortOrder: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      return upsertUnderwritingDocRequirement(db, {
        id: input.id,
        teamId: teamId!,
        name: input.name,
        description: input.description,
        required: input.required,
        appliesToStates: input.appliesToStates,
        sortOrder: input.sortOrder,
      });
    }),

  deleteRequirement: memberProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      return deleteUnderwritingDocRequirement(db, {
        id: input.id,
        teamId: teamId!,
      });
    }),

  seedDefaults: memberProcedure.mutation(async ({ ctx: { db, teamId } }) => {
    return seedDefaultDocRequirements(db, {
      teamId: teamId!,
    });
  }),
});
