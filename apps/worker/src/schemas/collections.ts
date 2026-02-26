import { z } from "zod";

/**
 * Collections job schemas
 */

export const collectionsAutoEscalateSchema = z.object({
  // Empty payload - runs globally across all teams
});

export type CollectionsAutoEscalatePayload = z.infer<
  typeof collectionsAutoEscalateSchema
>;

export const collectionsSlaCheckSchema = z.object({
  // Empty payload - runs globally across all teams
});

export type CollectionsSlaCheckPayload = z.infer<
  typeof collectionsSlaCheckSchema
>;

export const collectionsFollowUpRemindersSchema = z.object({
  // Empty payload - runs globally across all teams
});

export type CollectionsFollowUpRemindersPayload = z.infer<
  typeof collectionsFollowUpRemindersSchema
>;
