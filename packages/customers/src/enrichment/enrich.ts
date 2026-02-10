import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createLoggerWithContext } from "@midday/logger";
import {
  generateObject,
  stepCountIs,
  ToolLoopAgent,
  tool,
  zodSchema,
} from "ai";
import Exa from "exa-js";
import { z } from "zod";
import type {
  CustomerEnrichmentResult,
  EnrichCustomerOptions,
  EnrichCustomerParams,
  EnrichCustomerResult,
  VerifiedEnrichmentData,
} from "./schema";
import { customerEnrichmentSchema } from "./schema";
import { verifyEnrichmentData } from "./verify";

// Create logger for enrichment
const logger = createLoggerWithContext("Enrichment");

// Create Google AI instance
const google = createGoogleGenerativeAI();

// Create Exa client
const exa = new Exa(process.env.EXA_API_KEY);

// Default timeout
const DEFAULT_TIMEOUT_MS = 120_000;

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
  "vatNumber",
] as const;

// ============================================================================
// Create the Agent
// ============================================================================

const agent = new ToolLoopAgent({
  model: google("gemini-3-flash-preview"),
  instructions: `You are a fast company research agent. Find key company information in ONE search.

## CRITICAL: Do exactly 1 search, then IMMEDIATELY summarize.

## Your single search
Use 2 queries:
1. "[Company] LinkedIn company"
2. "[Company] OpenCorporates" OR country-specific registry (allabolag.se for Sweden, Companies House for UK, Crunchbase for US startups)

## THEN STOP and write your summary with whatever you found. Do NOT search again.

## What to extract from results:
- LinkedIn company URL
- Tax ID/VAT/EIN/Org number
- Employee count, founded year
- CEO name, headquarters address
- Description of what they do

## Output format
After searching, IMMEDIATELY write a summary of everything found. Include source URLs.
Do NOT keep searching for "nice to have" info like social media.`,
  tools: {
    search: tool({
      description:
        "Search the web with 1-2 queries. Combine LinkedIn + registry in one query when possible.",
      inputSchema: zodSchema(
        z.object({
          queries: z.array(z.string()).max(2),
        }),
      ),
      execute: async ({ queries }: { queries: string[] }) => {
        logger.debug("Agent searching", { queries });

        const results = await Promise.all(
          queries.map((q) =>
            exa.search(q, {
              type: "auto",
              numResults: 4,
              contents: {
                text: { maxCharacters: 1500 },
              },
            }),
          ),
        );

        const allResults = results.flatMap((r) => r.results || []);
        logger.debug("Agent found results", { count: allResults.length });

        const formatted = allResults
          .map((r) => {
            const content = r.text?.slice(0, 600) || "";
            return `**${r.title || "Untitled"}**\nURL: ${r.url}\n${content}`;
          })
          .join("\n\n---\n\n");

        return formatted || "No results found. Try different queries.";
      },
    }),
  },
  stopWhen: stepCountIs(3),
});

// ============================================================================
// Main Enrichment Function
// ============================================================================

export async function enrichCustomer(
  params: EnrichCustomerParams,
  options: EnrichCustomerOptions = {},
): Promise<EnrichCustomerResult> {
  const startTime = Date.now();
  const { timeoutMs = DEFAULT_TIMEOUT_MS, signal: externalSignal } = options;

  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => {
    timeoutController.abort(new Error("Enrichment timed out"));
  }, timeoutMs);

  // Combine external signal with timeout signal so callers can cancel operations
  const combinedSignal = externalSignal
    ? AbortSignal.any([externalSignal, timeoutController.signal])
    : timeoutController.signal;

  try {
    const domain = extractDomain(params.website);

    logger.info("Starting enrichment", {
      companyName: params.companyName,
      domain,
    });

    if (combinedSignal.aborted) {
      throw new Error("Enrichment cancelled");
    }

    // ========================================
    // Phase 1: Agent Research
    // ========================================
    const prompt = buildPrompt(params, domain);

    logger.debug("Starting agent research");

    const { text: researchText, steps } = await agent.generate({
      prompt,
      abortSignal: combinedSignal,
    });

    const searchRounds = steps.filter((s) => s.toolCalls.length > 0).length;
    logger.debug("Agent research complete", {
      searchRounds,
      textLength: researchText.length,
    });

    if (combinedSignal.aborted) {
      throw new Error("Enrichment cancelled");
    }

    // ========================================
    // Phase 2: Structured Extraction
    // ========================================
    logger.debug("Extracting structured data");

    const { object: extractedData } = await generateObject({
      model: google("gemini-2.0-flash"),
      schema: customerEnrichmentSchema,
      prompt: buildExtractionPrompt(params, researchText),
      abortSignal: combinedSignal,
    });

    // ========================================
    // Phase 3: Verify
    // ========================================
    const verified = await verifyEnrichmentData(
      extractedData as CustomerEnrichmentResult,
      { signal: combinedSignal },
    );

    const verifiedFieldCount = DATA_FIELDS.filter(
      (f) => verified[f as keyof VerifiedEnrichmentData] !== null,
    ).length;

    const durationMs = Date.now() - startTime;
    logger.info("Enrichment complete", {
      companyName: params.companyName,
      verifiedFieldCount,
      durationMs,
    });

    return {
      raw: extractedData as CustomerEnrichmentResult,
      verified,
      verifiedFieldCount,
      metrics: {
        stepsUsed: searchRounds,
        websiteReadSuccess: researchText.length > 500,
        linkedinFound:
          researchText.toLowerCase().includes("linkedin.com/company") ||
          verified.linkedinUrl !== null,
        searchSuccess: searchRounds > 0,
        countryDetected: null,
        durationMs,
      },
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

// ============================================================================
// Helpers
// ============================================================================

function extractDomain(website: string): string {
  let result = website;

  // Remove protocol (without regex to avoid ReDoS)
  if (result.startsWith("https://")) {
    result = result.slice(8);
  } else if (result.startsWith("http://")) {
    result = result.slice(7);
  }

  // Remove www. prefix
  if (result.startsWith("www.")) {
    result = result.slice(4);
  }

  // Remove path - use indexOf instead of regex to avoid polynomial backtracking
  const slashIndex = result.indexOf("/");
  if (slashIndex !== -1) {
    result = result.slice(0, slashIndex);
  }

  return result;
}

function buildPrompt(params: EnrichCustomerParams, domain: string): string {
  const extras: string[] = [];
  if (params.countryCode) extras.push(`Country: ${params.countryCode}`);
  if (params.city) extras.push(`City: ${params.city}`);
  if (params.vatNumber) extras.push(`Known VAT: ${params.vatNumber}`);

  return `Research this company and find comprehensive information:

**Company:** ${params.companyName}
**Website:** ${domain}
${extras.length > 0 ? extras.join("\n") : ""}

Find:
- LinkedIn company page URL
- VAT/Tax ID/Organization number (search the appropriate business registry for their country)
- Employee count
- Founded year  
- CEO/Founder name
- Full headquarters address (street, city, state, ZIP, country)
- What the company does (description)
- Social media (Twitter, Instagram, Facebook)

Start by searching for their LinkedIn profile and business registry information.`;
}

function buildExtractionPrompt(
  params: EnrichCustomerParams,
  research: string,
): string {
  return `Extract structured company data from this research.

**Company:** ${params.companyName}
**Website:** ${params.website}

## Research Findings:

${research}

## Extraction Rules:

- Only extract data clearly about ${params.companyName}
- Return null for any field not found
- vatNumber: include country prefix if known (e.g. SE5567037485, GB123456789)
- linkedinUrl: full URL with https:// (e.g. https://linkedin.com/company/example)
- employeeCount: map to ranges "1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"
- headquartersLocation: "City, Country" format
- addressLine1: street address only
- city: city name only  
- state: state/province/region (or null if not applicable)
- zipCode: postal/ZIP code
- country: full country name

Extract the data now:`;
}
