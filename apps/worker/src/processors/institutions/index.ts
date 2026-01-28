import { SyncInstitutionsProcessor } from "./sync-institutions";

export { SyncInstitutionsProcessor };

// Create processor instances
const syncInstitutionsProcessor = new SyncInstitutionsProcessor();

// Job name to processor mapping
export const institutionsProcessorMap = {
  "sync-institutions": syncInstitutionsProcessor,
};
