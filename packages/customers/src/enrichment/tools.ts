import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject, generateText, tool } from "ai";
import { z } from "zod";
import { buildRegistrySearchHint } from "./registries";
import {
  type CustomerEnrichmentResult,
  customerEnrichmentSchema,
} from "./schema";

// Create Google AI instance
const google = createGoogleGenerativeAI();

// ============================================================================
// Input Types
// ============================================================================

export type ReadWebsiteInput = {
  url: string;
};

export type SearchCompanyInput = {
  companyName: string;
  domain: string;
  countryCode: string | null;
};

export type ExtractDataInput = {
  companyName: string;
  domain: string;
  websiteData: string | null;
  searchData: string | null;
  context: string | null;
};

// ============================================================================
// Result Types
// ============================================================================

export type ReadWebsiteResult =
  | { success: true; data: string }
  | { success: false; error: string; data: null };

export type SearchCompanyResult =
  | { success: true; data: string }
  | { success: false; error: string; data: null };

export type ExtractDataResult =
  | { success: true; extractedData: CustomerEnrichmentResult }
  | { success: false; error: string; extractedData: null };

// ============================================================================
// Execution Functions (can be called directly)
// ============================================================================

/**
 * Read and analyze a company website using Gemini URL Context
 */
export async function executeReadWebsite(
  input: ReadWebsiteInput,
): Promise<ReadWebsiteResult> {
  console.log("[Tool:readWebsite] Reading:", input.url);
  try {
    const fullUrl = input.url.startsWith("http")
      ? input.url
      : `https://${input.url}`;

    const result = await generateText({
      model: google("gemini-2.5-flash"),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Extract company information from this website.

FIND THESE ITEMS:
1. DESCRIPTION: What does this company do? (1-2 sentences)
2. INDUSTRY: What industry are they in?
3. EMPLOYEES: Team size from About/Team page
4. LOCATION: Headquarters location
5. FOUNDED: Year founded
6. CEO/FOUNDER: Name of CEO or founder from About/Team/Leadership page
7. LINKEDIN: Company LinkedIn URL (usually in footer)
8. TWITTER: Company Twitter/X URL (usually in footer)
9. INSTAGRAM: Company Instagram URL (if present)
10. FACEBOOK: Company Facebook URL (if present)

Check About, Team, Leadership, Contact pages and Footer for this information.
Only report what you can actually find on the website.`,
              providerOptions: {
                google: { urlContext: fullUrl },
              },
            },
          ],
        },
      ],
      temperature: 0,
    });

    console.log("[Tool:readWebsite] Success:", result.text.length, "chars");
    return { success: true, data: result.text };
  } catch (error) {
    console.error("[Tool:readWebsite] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to read website",
      data: null,
    };
  }
}

/**
 * Search for company information using Google Search grounding
 */
export async function executeSearchCompany(
  input: SearchCompanyInput,
): Promise<SearchCompanyResult> {
  console.log(
    "[Tool:searchCompany] Searching:",
    input.companyName,
    input.domain,
  );
  try {
    const registryHint = input.countryCode
      ? buildRegistrySearchHint(input.countryCode, input.companyName)
      : null;

    const searchPrompt = `Search for "${input.companyName}" company information.

SEARCH FOR:
1. LinkedIn company page: site:linkedin.com/company "${input.companyName}"
2. Twitter/X account: site:twitter.com OR site:x.com "${input.companyName}"
3. Instagram: site:instagram.com "${input.companyName}"
4. Facebook: site:facebook.com "${input.companyName}"
${registryHint ? `\nCOUNTRY-SPECIFIC SOURCES:\n${registryHint}` : ""}

FIND AND REPORT:
- LinkedIn URL: https://linkedin.com/company/[slug]
- Twitter URL: https://twitter.com/[handle] or https://x.com/[handle]
- Instagram URL: https://instagram.com/[handle]
- Facebook URL: https://facebook.com/[page]
- Employee count
- Headquarters location
- Year founded
- Industry
- CEO/Founder name

IMPORTANT:
- Only include URLs that are clearly for the company at ${input.domain}
- If not found, say "Not found" for that item`;

    const result = await generateText({
      model: google("gemini-2.5-flash-lite"),
      tools: {
        google_search: google.tools.googleSearch({}),
      },
      prompt: searchPrompt,
      temperature: 0,
    });

    console.log("[Tool:searchCompany] Success:", result.text.length, "chars");
    return { success: true, data: result.text };
  } catch (error) {
    console.error("[Tool:searchCompany] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Search failed",
      data: null,
    };
  }
}

/**
 * Extract structured data from gathered information
 */
export async function executeExtractData(
  input: ExtractDataInput,
): Promise<ExtractDataResult> {
  console.log("[Tool:extractData] Extracting for:", input.companyName);
  try {
    const result = await generateObject({
      model: google("gemini-2.5-flash"),
      schema: customerEnrichmentSchema,
      prompt: `Extract structured data for "${input.companyName}" (${input.domain}).

=== DATA FROM WEBSITE ===
${input.websiteData || "Not available"}

=== DATA FROM SEARCH ===
${input.searchData || "Not available"}

=== KNOWN CONTEXT ===
${input.context || "None"}

EXTRACTION RULES:
1. PREFER data from the company's own website - it's most reliable
2. Only use search data if verified to be about ${input.domain}
3. If sources conflict: website > LinkedIn > other
4. Return null for any field without clear evidence

FIELD RULES:
- description: From company's website, 1-2 sentences
- industry/companyType: Infer from what they do
- employeeCount: Only from LinkedIn or website
- foundedYear: Only if explicitly stated
- estimatedRevenue: Usually null (rarely public)
- linkedinUrl: Must be linkedin.com/company/[slug] format
- twitterUrl: Must be twitter.com/[handle] or x.com/[handle] format
- ceoName: From About/Team page or LinkedIn

When in doubt, return null. Missing data is better than wrong data.`,
      temperature: 0,
    });

    console.log("[Tool:extractData] Success");
    return { success: true, extractedData: result.object };
  } catch (error) {
    console.error("[Tool:extractData] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Extraction failed",
      extractedData: null,
    };
  }
}

// ============================================================================
// Tool Definitions (for ToolLoopAgent)
// ============================================================================

export const readWebsiteTool = tool({
  description: "Read and analyze a company website to extract information",
  inputSchema: z.object({
    url: z.string().describe("The company website URL to read"),
  }),
  execute: async ({ url }) => executeReadWebsite({ url }),
});

export const searchCompanyTool = tool({
  description:
    "Search for company information including LinkedIn, social profiles, and business registry data",
  inputSchema: z.object({
    companyName: z.string().describe("The company name"),
    domain: z.string().describe("The company website domain"),
    countryCode: z.string().nullable().describe("ISO country code if known"),
  }),
  execute: async ({ companyName, domain, countryCode }) =>
    executeSearchCompany({ companyName, domain, countryCode }),
});

export const extractDataTool = tool({
  description: "Extract structured company data from gathered information",
  inputSchema: z.object({
    companyName: z.string().describe("The company name"),
    domain: z.string().describe("The company website domain"),
    websiteData: z.string().nullable().describe("Data extracted from website"),
    searchData: z.string().nullable().describe("Data from Google Search"),
    context: z
      .string()
      .nullable()
      .describe("Additional context about the company"),
  }),
  execute: async ({ companyName, domain, websiteData, searchData, context }) =>
    executeExtractData({
      companyName,
      domain,
      websiteData,
      searchData,
      context,
    }),
});
