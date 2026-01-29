import { DeleteTeamProcessor } from "./delete-team";
import { InviteTeamMembersProcessor } from "./invite-team-members";

/**
 * Export all team processors (for type imports)
 */
export { DeleteTeamProcessor } from "./delete-team";
export { InviteTeamMembersProcessor } from "./invite-team-members";

/**
 * Team processor registry
 * Maps job names to processor instances
 */
export const teamProcessors = {
  "delete-team": new DeleteTeamProcessor(),
  "invite-team-members": new InviteTeamMembersProcessor(),
};
