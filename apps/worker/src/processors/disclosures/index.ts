import { GenerateDisclosureProcessor } from "./generate-disclosure";

export { GenerateDisclosureProcessor } from "./generate-disclosure";

/**
 * Disclosure processor registry
 * Maps job names to processor instances
 */
export const disclosureProcessors = {
  "generate-disclosure": new GenerateDisclosureProcessor(),
};
