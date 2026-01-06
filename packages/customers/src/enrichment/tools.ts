import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject, generateText, tool } from "ai";
import { z } from "zod";
import {
  type CustomerEnrichmentResult,
  customerEnrichmentSchema,
} from "./schema";

// Create Google AI instance
const google = createGoogleGenerativeAI();

// Input schemas
const readWebsiteInputSchema = z.object({
  url: z.string().describe("The company website URL to read"),
  companyName: z.string().describe("The company name"),
});

const searchInputSchema = z.object({
  website: z.string().describe("The company website domain"),
  companyName: z.string().describe("The company name"),
});

const verifyExtractInputSchema = z.object({
  websiteData: z
    .string()
    .nullable()
    .describe("Data extracted from company website"),
  linkedinData: z.string().nullable().describe("Data from LinkedIn search"),
  fundingData: z.string().nullable().describe("Data from funding/news search"),
  website: z.string().describe("The company website domain"),
  companyName: z.string().describe("The company name"),
});

/**
 * Tool 1: Read company website directly using URL Context
 * This fetches and analyzes the actual website content - no search, no conflation risk
 */
export const readWebsiteTool = tool({
  description:
    "Read and analyze a company website directly to extract information",
  inputSchema: readWebsiteInputSchema,
  execute: async ({
    url,
    companyName,
  }: z.infer<typeof readWebsiteInputSchema>) => {
    try {
      // Ensure URL has protocol
      const fullUrl = url.startsWith("http") ? url : `https://${url}`;

      const result = await generateText({
        model: google("gemini-2.5-flash"),
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Extract company information from this website for "${companyName}".
                
Look for and extract:
- What the company does (description)
- Industry/sector
- Business model (B2B, SaaS, etc.)
- Team/employee information
- Location/headquarters
- Founded year
- Social media links (LinkedIn, Twitter)

Be factual and only report what you can see on the website.
If something is not visible on the website, say "Not found on website".`,
                providerOptions: {
                  google: { urlContext: fullUrl },
                },
              },
            ],
          },
        ],
        temperature: 0,
      });

      return {
        success: true as const,
        source: "website",
        data: result.text,
      };
    } catch (error) {
      return {
        success: false as const,
        source: "website",
        error:
          error instanceof Error ? error.message : "Failed to read website",
        data: null,
      };
    }
  },
});

/**
 * Tool 2: Search for LinkedIn company page
 * Uses Google Search grounding to find the official LinkedIn page
 */
export const searchLinkedInTool = tool({
  description: "Find the official LinkedIn company page using Google Search",
  inputSchema: searchInputSchema,
  execute: async ({
    website,
    companyName,
  }: z.infer<typeof searchInputSchema>) => {
    try {
      const domain = website.replace(/^https?:\/\//, "").replace(/\/$/, "");

      const result = await generateText({
        model: google("gemini-2.5-flash-lite"),
        tools: {
          google_search: google.tools.googleSearch({}),
        },
        prompt: `Find the official LinkedIn company page for "${companyName}" (${domain}).

IMPORTANT: Only return a LinkedIn URL if it's clearly the official company page for ${domain}.
The LinkedIn page should either:
- Link to ${domain} in its website field
- Be clearly about the same company

If you find it, return ONLY the URL in this format: linkedin.com/company/[slug]
If you cannot find it or are unsure, say "Not found".

Do NOT return personal LinkedIn profiles, only company pages.`,
        temperature: 0,
      });

      // Extract LinkedIn URL from response
      const linkedInMatch = result.text.match(
        /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/company\/[\w-]+/i,
      );

      return {
        success: true as const,
        source: "linkedin_search",
        linkedinUrl: linkedInMatch
          ? `https://${linkedInMatch[0].replace(/^https?:\/\//, "")}`
          : null,
        rawResponse: result.text,
      };
    } catch (error) {
      return {
        success: false as const,
        source: "linkedin_search",
        error: error instanceof Error ? error.message : "Search failed",
        linkedinUrl: null,
      };
    }
  },
});

/**
 * Tool 3: Search for funding and company intelligence
 * Uses Google Search grounding to find funding info, news, etc.
 */
export const searchFundingTool = tool({
  description:
    "Find funding information and company intelligence using Google Search",
  inputSchema: searchInputSchema,
  execute: async ({
    website,
    companyName,
  }: z.infer<typeof searchInputSchema>) => {
    try {
      const domain = website.replace(/^https?:\/\//, "").replace(/\/$/, "");

      const result = await generateText({
        model: google("gemini-2.5-flash-lite"),
        tools: {
          google_search: google.tools.googleSearch({}),
        },
        prompt: `Search for funding and business information about "${companyName}" (${domain}).

CRITICAL: Only report information that is VERIFIED to be about the company at ${domain}.
There may be other companies with similar names - ignore them.

Look for:
1. Crunchbase profile for ${domain}
2. Press releases or news about funding rounds
3. Number of employees (from LinkedIn or press)
4. Headquarters location
5. Year founded
6. Twitter/X company account

For each piece of information, note the source.
If information might be about a different company with a similar name, say "Not verified for ${domain}".
When in doubt, say "Not found".`,
        temperature: 0,
      });

      return {
        success: true as const,
        source: "funding_search",
        data: result.text,
      };
    } catch (error) {
      return {
        success: false as const,
        source: "funding_search",
        error: error instanceof Error ? error.message : "Search failed",
        data: null,
      };
    }
  },
});

/**
 * Tool 4: Verify and extract structured data
 * Takes all gathered data and extracts verified, structured information
 */
export const verifyAndExtractTool = tool({
  description:
    "Cross-reference all sources and extract verified structured data",
  inputSchema: verifyExtractInputSchema,
  execute: async ({
    websiteData,
    linkedinData,
    fundingData,
    website,
    companyName,
  }: z.infer<typeof verifyExtractInputSchema>) => {
    const domain = website.replace(/^https?:\/\//, "").replace(/\/$/, "");

    const result = await generateObject({
      model: google("gemini-2.5-flash"),
      schema: customerEnrichmentSchema,
      prompt: `Extract structured data for "${companyName}" (${domain}).

SOURCES GATHERED:

=== FROM WEBSITE (${domain}) ===
${websiteData || "Could not read website"}

=== FROM LINKEDIN SEARCH ===
${linkedinData || "No LinkedIn data found"}

=== FROM FUNDING/NEWS SEARCH ===
${fundingData || "No funding data found"}

EXTRACTION RULES:

1. PREFER data from the company's own website - it's the most reliable
2. Only use search data if it's VERIFIED to be about ${domain}
3. If sources conflict, prefer website > LinkedIn > other sources
4. If unsure whether data is about ${domain} or a different company, return null
5. Return null for any field without clear evidence

FIELD-SPECIFIC RULES:
- description: Use the company's own description from their website
- industry/companyType: Infer from what they clearly do
- employeeCount: Only from LinkedIn or website, not estimates
- foundedYear: Only if explicitly stated
- estimatedRevenue: Return null (rarely public)
- fundingStage/totalFunding: Only if clearly about ${domain}
- headquartersLocation: From website or LinkedIn
- timezone: Derive from verified HQ, or null
- linkedinUrl: Only if verified company page for ${domain}
- twitterUrl: Only if verified official account

When in doubt, return null. Missing data is better than wrong data.`,
      temperature: 0,
    });

    return {
      success: true as const,
      extractedData: result.object,
    };
  },
});

// Result types for the tools
export type ReadWebsiteResult =
  | { success: true; source: string; data: string }
  | { success: false; source: string; error: string; data: null };

export type SearchLinkedInResult =
  | {
      success: true;
      source: string;
      linkedinUrl: string | null;
      rawResponse: string;
    }
  | { success: false; source: string; error: string; linkedinUrl: null };

export type SearchFundingResult =
  | { success: true; source: string; data: string }
  | { success: false; source: string; error: string; data: null };

export type VerifyAndExtractResult = {
  success: true;
  extractedData: CustomerEnrichmentResult;
};
