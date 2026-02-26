import { z } from "zod/v3";

export const profileStepSchema = z.object({
  merchantId: z.string().uuid(),
  merchantName: z.string().min(1),
  requestedAmountMin: z.coerce.number().positive().optional(),
  requestedAmountMax: z.coerce.number().positive().optional(),
  useOfFunds: z.string().optional(),
  ficoRange: z.string().optional(),
  timeInBusinessMonths: z.coerce.number().int().positive().optional(),
  brokerNotes: z.string().optional(),
  priorMcaHistory: z.string().optional(),
});

export const documentsStepSchema = z.object({
  applicationId: z.string().uuid(),
  documentsUploaded: z.number().int().min(0),
});

export const reviewStepSchema = z.object({
  decision: z.enum(["approved", "declined", "review_needed"]).optional(),
  decisionNotes: z.string().optional(),
});

export type ProfileStepData = z.infer<typeof profileStepSchema>;
export type DocumentsStepData = z.infer<typeof documentsStepSchema>;
export type ReviewStepData = z.infer<typeof reviewStepSchema>;
