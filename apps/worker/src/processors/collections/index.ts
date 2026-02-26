import { CollectionsAutoEscalateProcessor } from "./auto-escalate";
import { CollectionsFollowUpRemindersProcessor } from "./follow-up-reminders";
import { CollectionsSlaCheckProcessor } from "./sla-check";

/**
 * Export all collections processors (for type imports)
 */
export { CollectionsAutoEscalateProcessor } from "./auto-escalate";
export { CollectionsSlaCheckProcessor } from "./sla-check";
export { CollectionsFollowUpRemindersProcessor } from "./follow-up-reminders";

/**
 * Collections processor registry
 * Maps job names to processor instances
 */
export const collectionsProcessors = {
  "collections-auto-escalate": new CollectionsAutoEscalateProcessor(),
  "collections-sla-check": new CollectionsSlaCheckProcessor(),
  "collections-follow-up-reminders": new CollectionsFollowUpRemindersProcessor(),
};
