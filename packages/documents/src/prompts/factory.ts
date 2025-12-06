import type { DocumentFormat } from "../utils/format-detection";
import { getFormatSpecificHints } from "../utils/format-detection";
import {
  accuracyGuidelines,
  baseInvoiceInstructions,
  baseReceiptInstructions,
  commonErrors,
  extractionRequirements,
  fieldSpecificRules,
  validationRequirements,
} from "./base";
import {
  chainOfThoughtInstructions,
  receiptChainOfThoughtInstructions,
} from "./chain-of-thought";
import { invoiceFewShotExamples, receiptFewShotExamples } from "./examples";

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

/**
 * Create invoice prompt components
 */
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

/**
 * Create receipt prompt components
 */
export function createReceiptPromptComponents(
  companyName?: string | null,
  useChainOfThought = false,
  format?: DocumentFormat,
): PromptComponents {
  const context = companyName
    ? `CRITICAL CONTEXT: "${companyName}" is the CUSTOMER/BUYER making the purchase.

MERCHANT IDENTIFICATION:
- store_name = BUSINESS/MERCHANT that sold items TO "${companyName}" (NOT "${companyName}" itself)
- Look for merchant in: receipt header, store logo, business address at top
- "${companyName}" appears in: loyalty card sections, customer info areas

EXAMPLE:
Header shows "Starbucks Coffee" → store_name = "Starbucks Coffee"
Loyalty card shows "${companyName}" → customer is "${companyName}"
NEVER set store_name = "${companyName}"`
    : undefined;

  return {
    base: baseReceiptInstructions,
    examples: receiptFewShotExamples,
    chainOfThought: useChainOfThought ? receiptChainOfThoughtInstructions : "",
    requirements: extractionRequirements.receipt,
    fieldRules: fieldSpecificRules.receipt,
    accuracyGuidelines: accuracyGuidelines.receipt,
    commonErrors: commonErrors.receipt,
    validation: validationRequirements,
    context,
    formatHints: format ? getFormatSpecificHints(format) : undefined,
  };
}

/**
 * Compose prompt components into a single prompt string
 */
export function composePrompt(components: PromptComponents): string {
  const parts: string[] = [];

  parts.push(components.base);
  parts.push(
    "Extract structured data with maximum accuracy. Follow these instructions precisely:",
  );
  parts.push("");
  parts.push(components.examples);

  if (components.chainOfThought) {
    parts.push("");
    parts.push(components.chainOfThought);
  }

  if (components.context) {
    parts.push("");
    parts.push(components.context);
  }

  if (components.formatHints) {
    parts.push("");
    parts.push(components.formatHints);
  }

  parts.push("");
  parts.push(components.requirements);
  parts.push("");
  parts.push(components.fieldRules);
  parts.push("");
  parts.push(components.accuracyGuidelines);
  parts.push("");
  parts.push(components.commonErrors);
  parts.push("");
  parts.push(components.validation);

  return parts.join("\n");
}

/**
 * Create full invoice prompt
 */
export function createInvoicePrompt(companyName?: string | null): string {
  const components = createInvoicePromptComponents(companyName, false);
  return composePrompt(components);
}

/**
 * Create invoice prompt with chain-of-thought
 */
export function createInvoicePromptWithChainOfThought(
  companyName?: string | null,
): string {
  const components = createInvoicePromptComponents(companyName, true);
  return composePrompt(components);
}

/**
 * Create full receipt prompt
 */
export function createReceiptPrompt(companyName?: string | null): string {
  const components = createReceiptPromptComponents(companyName, false);
  return composePrompt(components);
}

/**
 * Create receipt prompt with chain-of-thought
 */
export function createReceiptPromptWithChainOfThought(
  companyName?: string | null,
): string {
  const components = createReceiptPromptComponents(companyName, true);
  return composePrompt(components);
}
