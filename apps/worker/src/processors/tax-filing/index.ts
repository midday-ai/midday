import { ExportTaxFilingProcessor } from "./export";

/**
 * Export all tax-filing processors (for type imports)
 */
export { ExportTaxFilingProcessor } from "./export";

/**
 * Tax-filing processor registry
 * Maps job names to processor instances
 */
export const taxFilingProcessors = {
  "export-tax-filing": new ExportTaxFilingProcessor(),
};
