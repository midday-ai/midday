import type { DocumentFormat } from "../utils/format-detection";
import { getFormatSpecificHints } from "../utils/format-detection";
import {
  accuracyGuidelines,
  baseInvoiceInstructions,
  commonErrors,
  extractionRequirements,
  fieldSpecificRules,
  validationRequirements,
} from "./base";
import { chainOfThoughtInstructions } from "./chain-of-thought";
import { invoiceFewShotExamples } from "./examples";

export interface PromptComponents {
  base: string;
  examples: string;
  chainOfThought: string;
  requirements: string;
  fieldRules: string;
  accuracyGuidelines: string;
  commonErrors: string;
  validation: string;
  context?: string;
  formatHints?: string;
}

export function createInvoicePromptComponents(
  companyName?: string | null,
  useChainOfThought = false,
  format?: DocumentFormat,
): PromptComponents {
  const context = companyName
    ? `CRITICAL CONTEXT: "${companyName}" is the RECIPIENT/CUSTOMER company receiving this invoice.

VENDOR IDENTIFICATION:
- vendor_name = Company ISSUING the invoice TO "${companyName}" (NOT "${companyName}" itself)
- Look for vendor in: document header, letterhead, "From:" section, top-left area
- "${companyName}" appears in: "Bill To:", "Customer:", recipient sections

EXAMPLE:
Header shows "ABC Services Ltd" → vendor_name = "ABC Services Ltd"
"Bill To: ${companyName}" → customer_name = "${companyName}"
NEVER set vendor_name = "${companyName}"`
    : undefined;

  return {
    base: baseInvoiceInstructions,
    examples: invoiceFewShotExamples,
    chainOfThought: useChainOfThought ? chainOfThoughtInstructions : "",
    requirements: extractionRequirements.invoice,
    fieldRules: fieldSpecificRules.invoice,
    accuracyGuidelines: accuracyGuidelines.invoice,
    commonErrors: commonErrors.invoice,
    validation: validationRequirements,
    context,
    formatHints: format ? getFormatSpecificHints(format) : undefined,
  };
}
