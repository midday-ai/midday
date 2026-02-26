import { z } from "@hono/zod-openapi";

// ============================================================================
// Shared enums
// ============================================================================

export const collectionPrioritySchema = z.enum([
  "low",
  "medium",
  "high",
  "critical",
]);

export const collectionOutcomeSchema = z.enum([
  "paid_in_full",
  "settled",
  "payment_plan",
  "defaulted",
  "written_off",
  "sent_to_agency",
]);

export const escalationTriggerTypeSchema = z.enum([
  "time_based",
  "event_based",
]);

export const slaMetricSchema = z.enum([
  "time_in_stage",
  "response_time",
  "resolution_time",
]);

export const contactMethodSchema = z.enum([
  "phone",
  "email",
  "text",
  "in_person",
  "other",
]);

export const collectionStatusSchema = z.enum(["active", "resolved"]);

// ============================================================================
// Collection cases
// ============================================================================

export const getCollectionCasesSchema = z.object({
  status: collectionStatusSchema.nullish(),
  stageId: z.string().uuid().nullish(),
  assignedTo: z.string().uuid().nullish(),
  priority: collectionPrioritySchema.nullish(),
  cursor: z.string().nullish(),
  pageSize: z.number().min(1).max(100).optional(),
  sort: z.array(z.string()).nullish(),
});

export const createCollectionCaseSchema = z.object({
  dealId: z.string().uuid(),
  stageId: z.string().uuid().optional(),
  priority: collectionPrioritySchema.optional(),
  assignedTo: z.string().uuid().optional(),
});

export const updateCollectionCaseSchema = z.object({
  id: z.string().uuid(),
  stageId: z.string().uuid().optional(),
  assignedTo: z.string().uuid().nullable().optional(),
  priority: collectionPrioritySchema.optional(),
  nextFollowUp: z.string().nullable().optional(),
});

export const resolveCollectionCaseSchema = z.object({
  id: z.string().uuid(),
  outcome: collectionOutcomeSchema,
  agencyId: z.string().uuid().optional(),
});

// ============================================================================
// Collection notes
// ============================================================================

export const getCollectionNotesSchema = z.object({
  caseId: z.string().uuid(),
  cursor: z.string().nullish(),
  pageSize: z.number().min(1).max(100).optional(),
});

export const addCollectionNoteSchema = z.object({
  caseId: z.string().uuid(),
  contactName: z.string().optional(),
  contactMethod: contactMethodSchema.optional(),
  followUpDate: z.string().optional(),
  summary: z.string().min(1, "Summary is required"),
});

// ============================================================================
// Collection config — Stages
// ============================================================================

export const upsertCollectionStageSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  position: z.number().int().min(0),
  color: z.string().optional(),
  isDefault: z.boolean().optional(),
  isTerminal: z.boolean().optional(),
});

export const swapStagePositionsSchema = z.object({
  stageAId: z.string().uuid(),
  stageBId: z.string().uuid(),
});

export const deleteByIdSchema = z.object({
  id: z.string().uuid(),
});

// ============================================================================
// Collection config — Agencies
// ============================================================================

export const upsertCollectionAgencySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Name is required"),
  contactName: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
  contactPhone: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().optional(),
});

// ============================================================================
// Collection config — Escalation Rules
// ============================================================================

export const upsertEscalationRuleSchema = z.object({
  id: z.string().uuid().optional(),
  triggerType: escalationTriggerTypeSchema,
  fromStageId: z.string().uuid(),
  toStageId: z.string().uuid(),
  condition: z.record(z.string(), z.unknown()),
  isActive: z.boolean().optional(),
});

// ============================================================================
// Collection config — SLA Configs
// ============================================================================

export const upsertSlaConfigSchema = z.object({
  id: z.string().uuid().optional(),
  stageId: z.string().uuid().optional(),
  metric: slaMetricSchema,
  thresholdMinutes: z.number().int().positive(),
});

// ============================================================================
// Collection notifications
// ============================================================================

export const markNotificationReadSchema = z.object({
  id: z.string().uuid(),
});
