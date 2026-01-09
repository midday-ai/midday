import { DeleteTeamProcessor } from "./delete-team";

/**
 * Export all team processors (for type imports)
 */
export { DeleteTeamProcessor } from "./delete-team";

/**
 * Team processor registry
 * Maps job names to processor instances
 */
export const teamProcessors = {
  "delete-team": new DeleteTeamProcessor(),
};
