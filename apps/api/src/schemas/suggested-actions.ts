import { z } from "zod";

export const getSuggestedActionsSchema = z.object({
  limit: z
    .number()
    .min(1)
    .max(20)
    .default(6)
    .describe("Maximum number of suggested actions to return"),
});

export const trackSuggestedActionUsageSchema = z.object({
  actionId: z.string().describe("Unique identifier for the action to track"),
});

export const suggestedActionSchema = z.object({
  id: z.string().describe("Unique identifier for the action"),
  toolName: z.string().describe("Name of the tool to call"),
  toolParams: z
    .record(z.string(), z.any())
    .describe("Parameters for the tool call"),
  usageCount: z.number().describe("Number of times this action has been used"),
  lastUsed: z.date().nullable().describe("Last time this action was used"),
});

export const getSuggestedActionsResponseSchema = z.object({
  actions: z.array(suggestedActionSchema),
  total: z.number().describe("Total number of available actions"),
});

export type GetSuggestedActionsInput = z.infer<
  typeof getSuggestedActionsSchema
>;
export type SuggestedAction = z.infer<typeof suggestedActionSchema>;
export type GetSuggestedActionsResponse = z.infer<
  typeof getSuggestedActionsResponseSchema
>;
