import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { ToolLoopAgent, generateObject, stepCountIs, tool } from "ai";
import { z } from "zod";
import { detectCountryCode } from "./registries";
import {
  type CustomerEnrichmentResult,
  type EnrichCustomerOptions,
  type EnrichCustomerParams,
  type EnrichCustomerResult,
  customerEnrichmentSchema,
} from "./schema";
import {
  executeExtractData,
  executeReadWebsite,
  executeSearchCompany,
} from "./tools";
import { verifyEnrichmentData } from "./verify";

// Create Google AI instance
const google = createGoogleGenerativeAI();

// Default timeout for enrichment (60 seconds)
const DEFAULT_TIMEOUT_MS = 60_000;

// Fields to count for metrics
const DATA_FIELDS = [
  "description",
  "industry",
  "companyType",
  "employeeCount",
  "foundedYear",
  "linkedinUrl",
  "twitterUrl",
  "ceoName",
] as const;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Build context section from available customer data
 */
function buildContextSection(params: EnrichCustomerParams): string {
  const parts: string[] = [];

  // Email domain (if corporate)
  if (params.email) {
    const domain = params.email.split("@")[1];
    if (
      domain &&
      !["gmail", "yahoo", "hotmail", "outlook"].some((p) => domain.includes(p))
    ) {
      parts.push(`Email domain: ${domain}`);
    }
  }

  // Location
  const location = [
    params.city,
    params.state,
    params.country || params.countryCode,
  ]
    .filter(Boolean)
    .join(", ");
  if (location) parts.push(`Location: ${location}`);

  // Other context
  if (params.address) parts.push(`Address: ${params.address}`);
  if (params.phone) parts.push(`Phone: ${params.phone}`);
  if (params.vatNumber) parts.push(`VAT: ${params.vatNumber}`);
  if (params.contactName) parts.push(`Contact: ${params.contactName}`);
  if (params.note) parts.push(`Notes: ${params.note}`);

  return parts.length > 0 ? parts.map((p) => `- ${p}`).join("\n") : "";
}

/**
 * Combine multiple AbortSignals into one
 */
function combineAbortSignals(...signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();
  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort(signal.reason);
      return controller.signal;
    }
    signal.addEventListener("abort", () => controller.abort(signal.reason), {
      once: true,
    });
  }
  return controller.signal;
}

// ============================================================================
// Main Enrichment Function
// ============================================================================

/**
 * Enriches customer data using a 2-step agent pipeline:
 *
 * Step 0 (parallel): readWebsite + searchCompany
 * Step 1: extractData
 *
 * Total: 3 LLM calls
 */
export async function enrichCustomer(
  params: EnrichCustomerParams,
  options: EnrichCustomerOptions = {},
): Promise<EnrichCustomerResult> {
  const startTime = Date.now();
  const { timeoutMs = DEFAULT_TIMEOUT_MS, signal: externalSignal } = options;

  // Setup timeout
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => {
    timeoutController.abort(new Error("Enrichment timed out"));
  }, timeoutMs);

  const signal = externalSignal
    ? combineAbortSignals(externalSignal, timeoutController.signal)
    : timeoutController.signal;

  try {
    // Prepare inputs
    const domain = params.website
      .replace(/^https?:\/\//, "")
      .replace(/\/$/, "");
    const fullUrl = params.website.startsWith("http")
      ? params.website
      : `https://${params.website}`;
    const contextSection = buildContextSection(params);

    // Detect country from VAT, TLD, or explicit code
    const detectedCountry = detectCountryCode({
      countryCode: params.countryCode,
      vatNumber: params.vatNumber,
      website: params.website,
    });

    console.log("[Enrichment] Starting for", params.companyName, domain);
    console.log("[Enrichment] Country:", detectedCountry || "unknown");

    // Closure to collect data from tool calls
    let websiteData: string | null = null;
    let searchData: string | null = null;

    // Create agent with tools that call our execute functions
    const agent = new ToolLoopAgent({
      model: google("gemini-2.5-flash"),
      tools: {
        readWebsite: tool({
          description: "Read company website to extract information",
          inputSchema: z.object({
            url: z.string().describe("Website URL"),
          }),
          execute: async ({ url }) => {
            const result = await executeReadWebsite({ url });
            if (result.success) websiteData = result.data;
            return result;
          },
        }),

        searchCompany: tool({
          description:
            "Search for company info like LinkedIn, funding, social profiles",
          inputSchema: z.object({
            companyName: z.string().describe("Company name"),
            domain: z.string().describe("Company domain"),
            countryCode: z.string().nullable().describe("ISO country code"),
          }),
          execute: async ({ companyName, domain: d, countryCode }) => {
            const result = await executeSearchCompany({
              companyName,
              domain: d,
              countryCode,
            });
            if (result.success) searchData = result.data;
            return result;
          },
        }),

        extractData: tool({
          description: "Extract structured data from gathered information",
          inputSchema: z.object({
            companyName: z.string().describe("Company name"),
            domain: z.string().describe("Company domain"),
          }),
          execute: async ({ companyName, domain: d }) => {
            // Use collected data from closure
            return executeExtractData({
              companyName,
              domain: d,
              websiteData,
              searchData,
              context: contextSection,
            });
          },
        }),
      },
      stopWhen: stepCountIs(3),
      prepareStep: async ({ stepNumber }) => {
        if (stepNumber === 0) {
          // Step 0: Read website and search in parallel
          return { activeTools: ["readWebsite", "searchCompany"] };
        }
        // Step 1+: Extract structured data
        return {
          activeTools: ["extractData"],
          toolChoice: { type: "tool", toolName: "extractData" },
        };
      },
    });

    // Run agent
    const result = await agent.generate({
      prompt: `Research "${params.companyName}" at ${fullUrl}.

Step 1: Call BOTH tools in parallel:
- readWebsite with url="${fullUrl}"
- searchCompany with companyName="${params.companyName}", domain="${domain}", countryCode=${detectedCountry ? `"${detectedCountry}"` : "null"}

Step 2: Call extractData with companyName="${params.companyName}", domain="${domain}"`,
    });

    console.log("[Enrichment] Agent completed. Steps:", result.steps?.length);

    if (signal.aborted) {
      throw new Error("Enrichment cancelled");
    }

    // Get extracted data from tool results
    let extractedData: CustomerEnrichmentResult | null = null;
    for (const tr of result.toolResults || []) {
      const output = tr.output as Record<string, unknown>;
      if (
        tr.toolName === "extractData" &&
        output?.success &&
        output?.extractedData
      ) {
        extractedData = output.extractedData as CustomerEnrichmentResult;
      }
    }

    // Fallback extraction if agent didn't produce results
    if (!extractedData) {
      console.log("[Enrichment] Fallback extraction");
      const fallback = await generateObject({
        model: google("gemini-2.5-flash"),
        schema: customerEnrichmentSchema,
        prompt: `Extract structured data for "${params.companyName}" (${domain}).

=== WEBSITE DATA ===
${websiteData || "Not available"}

=== SEARCH DATA ===
${searchData || "Not available"}

=== CONTEXT ===
${contextSection || "None"}

Extract all available fields. Return null for fields without clear evidence.`,
        temperature: 0,
      });
      extractedData = fallback.object;
    }

    // Verify and validate data
    const verified = await verifyEnrichmentData(extractedData, { signal });
    const verifiedFieldCount = DATA_FIELDS.filter(
      (f) => verified[f] !== null,
    ).length;

    const durationMs = Date.now() - startTime;
    console.log(
      "[Enrichment] Complete. Fields:",
      verifiedFieldCount,
      "Duration:",
      durationMs,
      "ms",
    );

    return {
      raw: extractedData,
      verified,
      verifiedFieldCount,
      metrics: {
        stepsUsed: result.steps?.length || 0,
        websiteReadSuccess: websiteData !== null,
        linkedinFound: verified.linkedinUrl !== null,
        searchSuccess: searchData !== null,
        countryDetected: detectedCountry,
        durationMs,
      },
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
