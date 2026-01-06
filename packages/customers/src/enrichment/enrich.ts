import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { ToolLoopAgent, stepCountIs, tool } from "ai";
import { generateObject, generateText } from "ai";
import { z } from "zod";
import {
  type CustomerEnrichmentResult,
  type VerifiedEnrichmentData,
  customerEnrichmentSchema,
} from "./schema";
import { verifyEnrichmentData } from "./verify";

// Create Google AI instance
const google = createGoogleGenerativeAI();

// Default timeout for enrichment (60 seconds)
const DEFAULT_TIMEOUT_MS = 60_000;

export type EnrichCustomerParams = {
  website: string;
  companyName: string;
  email?: string | null;
  country?: string | null;
  countryCode?: string | null;
  city?: string | null;
  state?: string | null;
  address?: string | null;
  phone?: string | null;
  vatNumber?: string | null;
  note?: string | null;
  contactName?: string | null;
};

export type EnrichCustomerOptions = {
  timeoutMs?: number;
  signal?: AbortSignal;
};

export type EnrichmentMetrics = {
  stepsUsed: number;
  websiteReadSuccess: boolean;
  linkedinFound: boolean;
  fundingSearched: boolean;
};

export type EnrichCustomerResult = {
  raw: CustomerEnrichmentResult;
  verified: VerifiedEnrichmentData;
  verifiedFieldCount: number;
  metrics: EnrichmentMetrics;
};

const DATA_FIELDS = [
  "description",
  "industry",
  "companyType",
  "employeeCount",
  "foundedYear",
  "estimatedRevenue",
  "fundingStage",
  "totalFunding",
  "headquartersLocation",
  "timezone",
  "linkedinUrl",
  "twitterUrl",
] as const;

function buildContextSection(params: EnrichCustomerParams): string {
  const contextParts: string[] = [];

  if (params.email) {
    const domain = params.email.split("@")[1];
    if (
      domain &&
      !domain.includes("gmail") &&
      !domain.includes("yahoo") &&
      !domain.includes("hotmail")
    ) {
      contextParts.push(`Email domain: ${domain}`);
    }
  }

  const locationParts: string[] = [];
  if (params.city) locationParts.push(params.city);
  if (params.state) locationParts.push(params.state);
  if (params.country || params.countryCode) {
    locationParts.push(params.country || params.countryCode || "");
  }
  if (locationParts.length > 0) {
    contextParts.push(
      `Known location: ${locationParts.filter(Boolean).join(", ")}`,
    );
  }

  if (params.address) contextParts.push(`Address: ${params.address}`);
  if (params.phone) contextParts.push(`Phone: ${params.phone}`);
  if (params.vatNumber) contextParts.push(`VAT number: ${params.vatNumber}`);
  if (params.contactName) contextParts.push(`Contact: ${params.contactName}`);
  if (params.note) contextParts.push(`Notes: ${params.note}`);

  return contextParts.length > 0
    ? contextParts.map((p) => `- ${p}`).join("\n")
    : "";
}

/**
 * Enriches customer data using ToolLoopAgent with URL Context.
 */
export async function enrichCustomer(
  params: EnrichCustomerParams,
  options: EnrichCustomerOptions = {},
): Promise<EnrichCustomerResult> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, signal: externalSignal } = options;

  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => {
    timeoutController.abort(new Error("Enrichment timed out"));
  }, timeoutMs);

  const signal = externalSignal
    ? combineAbortSignals(externalSignal, timeoutController.signal)
    : timeoutController.signal;

  try {
    const contextSection = buildContextSection(params);
    const domain = params.website
      .replace(/^https?:\/\//, "")
      .replace(/\/$/, "");
    const fullUrl = params.website.startsWith("http")
      ? params.website
      : `https://${params.website}`;

    // Closure to collect data from tools
    let websiteData: string | null = null;
    let linkedinData: string | null = null;

    console.log("[Enrichment] Starting agent for", params.companyName, domain);

    // Create ToolLoopAgent with URL Context tools
    const agent = new ToolLoopAgent({
      model: google("gemini-2.5-flash"),
      tools: {
        // Tool 1: Read company website
        readWebsite: tool({
          description:
            "Read a company website to extract information about the company",
          inputSchema: z.object({
            url: z.string().describe("The website URL to read"),
          }),
          execute: async ({ url }: { url: string }) => {
            console.log("[Tool:readWebsite] Reading:", url);
            try {
              const result = await generateText({
                model: google("gemini-2.5-flash"),
                messages: [
                  {
                    role: "user",
                    content: [
                      {
                        type: "text",
                        text: `Extract company information from this website.
Look for: company description, industry, team size, headquarters location, year founded, LinkedIn URL, Twitter URL.
Be factual - only report what you can see on the website.`,
                        providerOptions: {
                          google: { urlContext: url },
                        },
                      },
                    ],
                  },
                ],
                temperature: 0,
              });
              websiteData = result.text;
              console.log(
                "[Tool:readWebsite] Success:",
                result.text.length,
                "chars",
              );
              return { success: true, data: result.text };
            } catch (error) {
              console.error("[Tool:readWebsite] Error:", error);
              return {
                success: false,
                error: error instanceof Error ? error.message : "Failed",
              };
            }
          },
        }),

        // Tool 2: Read LinkedIn page if found
        readLinkedIn: tool({
          description:
            "Read a LinkedIn company page to get employee count and details",
          inputSchema: z.object({
            linkedinUrl: z.string().describe("The LinkedIn company page URL"),
          }),
          execute: async ({ linkedinUrl }: { linkedinUrl: string }) => {
            console.log("[Tool:readLinkedIn] Reading:", linkedinUrl);
            try {
              const result = await generateText({
                model: google("gemini-2.5-flash"),
                messages: [
                  {
                    role: "user",
                    content: [
                      {
                        type: "text",
                        text: `Extract company information from this LinkedIn page.
Look for: company description, employee count, headquarters, industry, founded year.`,
                        providerOptions: {
                          google: { urlContext: linkedinUrl },
                        },
                      },
                    ],
                  },
                ],
                temperature: 0,
              });
              linkedinData = result.text;
              console.log(
                "[Tool:readLinkedIn] Success:",
                result.text.length,
                "chars",
              );
              return { success: true, data: result.text };
            } catch (error) {
              console.error("[Tool:readLinkedIn] Error:", error);
              return {
                success: false,
                error: error instanceof Error ? error.message : "Failed",
              };
            }
          },
        }),

        // Tool 3: Extract structured data
        extractData: tool({
          description:
            "Extract structured company data from gathered information",
          inputSchema: z.object({
            websiteInfo: z
              .string()
              .nullable()
              .describe("Information from the website"),
            linkedinInfo: z
              .string()
              .nullable()
              .describe("Information from LinkedIn"),
          }),
          execute: async ({
            websiteInfo,
            linkedinInfo,
          }: {
            websiteInfo: string | null;
            linkedinInfo: string | null;
          }) => {
            console.log("[Tool:extractData] Extracting structured data");
            try {
              const result = await generateObject({
                model: google("gemini-2.5-flash"),
                schema: customerEnrichmentSchema,
                prompt: `Extract structured data for "${params.companyName}" (${domain}).

=== WEBSITE DATA ===
${websiteInfo || websiteData || "Not available"}

=== LINKEDIN DATA ===
${linkedinInfo || linkedinData || "Not available"}

=== CONTEXT ===
${contextSection || "None"}

RULES:
- Prefer website data over other sources
- Return null if unsure about any field
- Missing data is better than wrong data`,
                temperature: 0,
              });
              console.log("[Tool:extractData] Success");
              return { success: true, extractedData: result.object };
            } catch (error) {
              console.error("[Tool:extractData] Error:", error);
              return {
                success: false,
                error: error instanceof Error ? error.message : "Failed",
              };
            }
          },
        }),
      },
      stopWhen: stepCountIs(5),
      // Force workflow: step 0 = readWebsite, step 1+ = extractData
      prepareStep: async ({ stepNumber }) => {
        if (stepNumber === 0) {
          return {
            activeTools: ["readWebsite"],
            toolChoice: { type: "tool", toolName: "readWebsite" },
          };
        }
        // After reading website, force extraction
        return {
          activeTools: ["extractData"],
          toolChoice: { type: "tool", toolName: "extractData" },
        };
      },
    });

    // Run the agent
    const result = await agent.generate({
      prompt: `Research "${params.companyName}" at ${fullUrl}.

WORKFLOW:
1. Use readWebsite to read ${fullUrl}
2. If you find a LinkedIn company page URL on the website, use readLinkedIn to read it
3. Use extractData with all gathered information to create structured output

Start by calling readWebsite with url="${fullUrl}"`,
    });

    console.log(
      "[Enrichment] Agent done. Steps:",
      result.steps?.length,
      "ToolResults:",
      result.toolResults?.length,
    );

    if (signal.aborted) throw new Error("Enrichment cancelled");

    // Get extracted data from tool results
    let extractedData: CustomerEnrichmentResult | null = null;

    for (const tr of result.toolResults || []) {
      const output = tr.output as Record<string, unknown>;
      if (tr.toolName === "extractData" && output?.success) {
        extractedData = output.extractedData as CustomerEnrichmentResult;
      }
    }

    // Fallback: if agent didn't call extractData, do it ourselves
    if (!extractedData) {
      console.log("[Enrichment] Fallback: calling generateObject manually");
      console.log(
        "[Enrichment] websiteData:",
        String(websiteData || "").substring(0, 200),
      );
      console.log(
        "[Enrichment] linkedinData:",
        String(linkedinData || "").substring(0, 200),
      );
      const fallbackResult = await generateObject({
        model: google("gemini-2.5-flash"),
        schema: customerEnrichmentSchema,
        prompt: `Extract structured data for "${params.companyName}" (${domain}).

=== WEBSITE DATA ===
${websiteData || "Not available"}

=== LINKEDIN DATA ===
${linkedinData || "Not available"}

=== CONTEXT ===
${contextSection || "None"}

RULES:
- Prefer website data over other sources
- Return null if unsure about any field
- Missing data is better than wrong data`,
        temperature: 0,
      });
      extractedData = fallbackResult.object;
    }

    // Verify the data
    const verified = await verifyEnrichmentData(extractedData, { signal });

    const verifiedFieldCount = DATA_FIELDS.filter(
      (field) => verified[field] !== null,
    ).length;

    console.log("[Enrichment] Complete. Verified fields:", verifiedFieldCount);

    return {
      raw: extractedData,
      verified,
      verifiedFieldCount,
      metrics: {
        stepsUsed: result.steps?.length || 0,
        websiteReadSuccess: websiteData !== null,
        linkedinFound: verified.linkedinUrl !== null,
        fundingSearched: linkedinData !== null,
      },
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

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
