import { CancellationEmailFollowupProcessor } from "./cancellation-email-followup";
import { CancellationEmailsProcessor } from "./cancellation-emails";
import { DeleteTeamProcessor } from "./delete-team";

/**
 * Export all team processors (for type imports)
 */
export { CancellationEmailFollowupProcessor } from "./cancellation-email-followup";
export { CancellationEmailsProcessor } from "./cancellation-emails";
export { DeleteTeamProcessor } from "./delete-team";

/**
 * Team processor registry
 * Maps job names to processor instances
 */
export const teamProcessors = {
  "delete-team": new DeleteTeamProcessor(),
  "cancellation-email-immediate": new CancellationEmailsProcessor(),
  "cancellation-email-followup": new CancellationEmailFollowupProcessor(),
};
