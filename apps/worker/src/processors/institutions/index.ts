import { SyncInstitutionsProcessor } from "./sync-institutions";

export { SyncInstitutionsProcessor } from "./sync-institutions";

/**
 * Institutions processor registry
 * Maps job names to processor instances
 */
export const institutionsProcessors = {
  "sync-institutions": new SyncInstitutionsProcessor(),
};
