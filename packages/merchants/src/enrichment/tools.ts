import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject, generateText, tool } from "ai";
import { z } from "zod";
import { buildRegistrySearchHint } from "./registries";
import {
  type MerchantEnrichmentResult,
  merchantEnrichmentSchema,
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
  | { success: true; extractedData: MerchantEnrichmentResult }
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
              text: `Extract company information from this website. Report ONLY what you find - use "Not found" for missing items.

=== BASIC INFO ===
1. DESCRIPTION: 1-2 sentence summary of what the company does
2. INDUSTRY: Software, Healthcare, Finance, E-commerce, Manufacturing, Education, Real Estate, Media, Consulting, Legal, Marketing, Logistics, Energy, Hospitality, Retail, or Other
3. COMPANY TYPE: B2B, B2C, B2B2C, SaaS, Agency, Consultancy, E-commerce, Marketplace, Enterprise, SMB, Startup, or Other
4. FOUNDED YEAR: 4-digit year (check About page, footer, or press releases)

=== LOCATION & SIZE ===
5. HEADQUARTERS: City, Country (e.g., "Stockholm, Sweden") - check Contact, About, Footer
6. EMPLOYEES: Team size (1-10, 11-50, 51-200, 201-500, 501-1000, 1000+) - check About, Team, Careers pages
7. CEO/FOUNDER: Full name from Leadership, About, or Team page

=== FUNDING (check Investors, Press, News, About pages) ===
8. FUNDING STAGE: Look for "backed by", "raised", "Series X", "funded by" mentions
   Options: Bootstrapped, Pre-seed, Seed, Series A, Series B, Series C+, Public, Acquired
9. TOTAL FUNDING: Amount raised - look for "$Xm raised", "secured $X funding"
10. REVENUE: If mentioned in press/about (<1M, 1M-10M, 10M-50M, 50M-100M, 100M+)

=== SOCIAL LINKS (check Footer, Contact, About pages) ===
11. LINKEDIN: Look for linkedin.com/company/[slug] - must be company page not personal
12. TWITTER/X: Look for twitter.com/[handle] or x.com/[handle]
13. INSTAGRAM: Look for instagram.com/[handle]
14. FACEBOOK: Look for facebook.com/[page]

=== FINANCE CONTACT (check Contact, Team, About pages) ===
15. FINANCE CONTACT: Name of CFO, Finance Director, Controller, or AP Manager
16. FINANCE EMAIL: Look for these patterns in order of preference:
    - ap@, accounts.payable@, payable@
    - deals@, billing@
    - finance@, accounting@
    - ar@ (accounts receivable sometimes handles both)

=== COMPLIANCE ===
17. VAT/TAX NUMBER: Check footer, legal pages, terms, imprint (often near copyright)
18. PRIMARY LANGUAGE: Full language name based on website content (English, Swedish, German, French, Spanish, Dutch, etc.)
19. FISCAL YEAR END: Month name if mentioned in annual reports or investor pages

PAGES TO CHECK: Homepage, About, Team, Leadership, Contact, Careers, Investors, Press, News, Legal, Footer, Imprint.`,
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

    const searchPrompt = `Search for "${input.companyName}" (${input.domain}) company information.

=== SOCIAL MEDIA SEARCHES (run each separately) ===
1. site:linkedin.com/company "${input.companyName}"
   - Find the OFFICIAL company page (not personal profiles)
   - Verify: company name matches, domain in website field if shown

2. site:twitter.com OR site:x.com "${input.companyName}"
   - Look for verified/official accounts
   - Check bio mentions domain or matches company description

3. site:instagram.com "${input.companyName}"
   - Look for business accounts with company branding

4. site:facebook.com "${input.companyName}" company OR business
   - Find official company page (not groups)

=== FUNDING SEARCHES ===
5. site:crunchbase.com "${input.companyName}"
   - Crunchbase has authoritative funding data

6. site:techcrunch.com OR site:pitchbook.com "${input.companyName}" funding
   - News about funding rounds

7. "${input.companyName}" "raised" OR "funding round" OR "series" OR "backed by"
   - Look for: "raised $Xm", "Series A/B/C", "seed round", "backed by [investors]"
   - Patterns: "raised $5 million", "$10M Series A", "secured $2.5M seed funding"

=== COMPANY INFO SEARCHES ===
8. "${input.companyName}" ${input.domain} employees OR "team of" OR headcount
9. "${input.companyName}" headquarters OR "based in" OR founded
10. "${input.companyName}" revenue OR ARR (if public info available)
${registryHint ? `\n=== COUNTRY-SPECIFIC REGISTRY ===\n${registryHint}` : ""}

=== EXTRACT AND REPORT ===
SOCIAL LINKS (verify domain connection):
- LinkedIn URL: https://linkedin.com/company/[exact-slug]
- Twitter/X URL: https://x.com/[handle] or https://twitter.com/[handle]
- Instagram URL: https://instagram.com/[handle]
- Facebook URL: https://facebook.com/[page-name]

FUNDING (be specific about sources):
- Funding stage: Bootstrapped, Pre-seed, Seed, Series A, Series B, Series C+, Public, Acquired
- Total funding: Exact amount if found (e.g., "$10M", "$2.5M")
- Latest round: Most recent round details
- Key investors: Notable investors if mentioned

COMPANY DETAILS:
- Employee count: 1-10, 11-50, 51-200, 201-500, 501-1000, 1000+
- Headquarters: City, Country
- Founded year: YYYY
- Industry: Software, Healthcare, Finance, etc.
- Company type: B2B, SaaS, Agency, E-commerce, etc.
- CEO/Founder: Full name
- Revenue: <1M, 1M-10M, 10M-50M, 50M-100M, 100M+ (if public)
- VAT/Tax ID/Org number

CRITICAL: Only report data that is CLEARLY about ${input.domain}. Verify social accounts belong to this company. Say "Not found" for anything uncertain.`;

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
      schema: merchantEnrichmentSchema,
      prompt: `Extract structured data for "${input.companyName}" (${input.domain}).

=== DATA FROM WEBSITE ===
${input.websiteData || "Not available"}

=== DATA FROM SEARCH ===
${input.searchData || "Not available"}

=== KNOWN CONTEXT ===
${input.context || "None"}

=== DATA PRIORITY ===
1. Website data (most authoritative)
2. Crunchbase/LinkedIn data
3. Other search results
Return null if uncertain or conflicting.

=== FIELD EXTRACTION RULES ===

BASIC INFO:
- description: 1-2 sentences describing what the company does. Use website copy.
- industry: One of: Software, Healthcare, Finance, E-commerce, Manufacturing, Education, Real Estate, Media, Consulting, Legal, Marketing, Logistics, Energy, Hospitality, Retail, Other
- companyType: One of: B2B, B2C, B2B2C, SaaS, Agency, Consultancy, E-commerce, Marketplace, Enterprise, SMB, Startup, Other
- foundedYear: 4-digit year (1900-2030)

LOCATION (derive timezone from HQ, use context as fallback):
- headquartersLocation: "City, Country" format (e.g., "Stockholm, Sweden", "San Francisco, USA")
- If headquartersLocation not found but countryCode is in KNOWN CONTEXT, derive full country name:
  * SE → Sweden, US → United States, GB/UK → United Kingdom, DE → Germany, FR → France
  * NL → Netherlands, NO → Norway, DK → Denmark, FI → Finland, ES → Spain, IT → Italy
  * JP → Japan, CN → China, AU → Australia, CA → Canada, BR → Brazil, IN → India
- timezone: IANA timezone based on headquarters location. Common mappings:
  * Stockholm/Sweden → Europe/Stockholm
  * London/UK → Europe/London
  * San Francisco/California → America/Los_Angeles
  * New York → America/New_York
  * Berlin/Germany → Europe/Berlin
  * Paris/France → Europe/Paris
  * Amsterdam/Netherlands → Europe/Amsterdam
  * Sydney/Australia → Australia/Sydney
  * Singapore → Asia/Singapore
  * Tokyo/Japan → Asia/Tokyo

TEAM:
- employeeCount: One of: 1-10, 11-50, 51-200, 201-500, 501-1000, 1000+
- ceoName: Full name of CEO, founder, or managing director

FUNDING (extract carefully from Crunchbase, news, or company announcements):
- fundingStage: One of: Bootstrapped, Pre-seed, Seed, Series A, Series B, Series C+, Public, Acquired
  * "Bootstrap" or no funding mentions → Bootstrapped
  * "Pre-seed" or "angel" → Pre-seed
  * "Seed round" → Seed
  * "Series A/B/C" → Series A/B/C+
  * Stock ticker or "IPO" → Public
  * "Acquired by" → Acquired
- totalFunding: EXTERNAL FUNDING ONLY - money raised from investors
  * IMPORTANT: If fundingStage is "Bootstrapped", totalFunding MUST be null (bootstrapped = no external funding)
  * Format with WHOLE NUMBERS (no decimals): "$10M", "€150M", "£1B" (NOT "$3.97M")
  * Round to nearest whole number: 3.97M → 4M, 2.3M → 2M, 1.7B → 2B
  * Keep the original currency symbol from the source
  * Look for: "raised $X", "total funding", "funding to date"
  * DO NOT confuse revenue/turnover with funding - these are different!
- estimatedRevenue: One of: <$1M, $1M-10M, $10M-50M, $50M-100M, $100M+ (only if explicitly mentioned or can be derived from public financials)
  * This is REVENUE/TURNOVER, not funding - different from totalFunding

SOCIAL LINKS (verify company ownership):
- linkedinUrl: Must be linkedin.com/company/[slug] format. Verify it's the official company page.
- twitterUrl: Must be twitter.com/[handle] or x.com/[handle]. Check bio references the domain.
- instagramUrl: Must be instagram.com/[handle]. Verify company branding.
- facebookUrl: Must be facebook.com/[page]. Must be official company page, not group.

FINANCE CONTACT (prioritize department emails over personal):
- financeContact: Name of CFO, Finance Director, Controller, or AP Manager
- financeContactEmail: Email in priority order:
  1. ap@, accounts.payable@, payable@${input.domain}
  2. deals@, billing@${input.domain}
  3. finance@, accounting@${input.domain}
  4. Specific person's email if they handle finance

COMPLIANCE:
- vatNumber: Uppercase, no spaces. Format: [COUNTRY_CODE][NUMBER] (e.g., SE556703748501, GB123456789, DE123456789)
- primaryLanguage: Full language name (English, Swedish, German, French, Spanish, Dutch, Danish, Norwegian, Finnish, Japanese, Chinese, etc.)
- fiscalYearEnd: Month name (January, February, ..., December). Most companies use December unless stated otherwise.

Return null for ANY field without clear, verified evidence. Do not guess.`,
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
