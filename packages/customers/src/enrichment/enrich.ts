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
  searchSuccess: boolean;
  durationMs: number;
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
 * Enriches customer data using ToolLoopAgent.
 *
 * Pipeline:
 * Step 0: PARALLEL - readWebsite + searchCompany (both tools available)
 * Step 1: extractData
 */
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

    // Closure to collect data
    let websiteData: string | null = null;
    let searchData: string | null = null;
    let generatedDescription: string | null = null;

    console.log("[Enrichment] Starting agent for", params.companyName, domain);

    // Create ToolLoopAgent
    const agent = new ToolLoopAgent({
      model: google("gemini-2.5-flash"),
      tools: {
        // Tool 1: Read website using URL Context
        readWebsite: tool({
          description: "Read company website to extract information",
          inputSchema: z.object({
            url: z.string().describe("Website URL"),
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

IMPORTANT - Find these specific items:
1. DESCRIPTION: What does this company do? Write 1-2 sentences summarizing their business.
2. INDUSTRY: What industry are they in?
3. TEAM SIZE: How many employees? Check About/Team page.
4. LOCATION: Where is their headquarters?
5. FOUNDED: When was the company founded?
6. LINKEDIN: Find their LinkedIn company page URL (usually in footer or contact page)
7. TWITTER: Find their Twitter/X URL (usually in footer)
8. FUNDING: Any funding information mentioned?

Check the About page, Team page, Contact page, and Footer for this information.`,
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
              // Log if social links found
              const hasLinkedIn = result.text
                .toLowerCase()
                .includes("linkedin");
              const hasTwitter =
                result.text.toLowerCase().includes("twitter") ||
                result.text.toLowerCase().includes("x.com");
              console.log(
                "[Tool:readWebsite] Found LinkedIn:",
                hasLinkedIn,
                "Twitter:",
                hasTwitter,
              );
              if (hasLinkedIn) {
                // Try to extract URL
                const linkedInMatch = result.text.match(
                  /linkedin\.com\/company\/[\w-]+/i,
                );
                if (linkedInMatch)
                  console.log(
                    "[Tool:readWebsite] LinkedIn URL:",
                    linkedInMatch[0],
                  );
              }
              return { success: true, data: result.text };
            } catch (error) {
              console.error("[Tool:readWebsite] Error:", error);
              return { success: false, error: String(error) };
            }
          },
        }),

        // Tool 2: Search using Google (faster model)
        searchCompany: tool({
          description: "Search web for company info like LinkedIn, funding",
          inputSchema: z.object({
            query: z.string().describe("Company name and domain"),
          }),
          execute: async ({ query }: { query: string }) => {
            console.log("[Tool:searchCompany] Searching:", query);
            try {
              const result = await generateText({
                model: google("gemini-2.5-flash-lite"), // Faster model
                tools: {
                  google_search: google.tools.googleSearch({}),
                },
                prompt: `Search for "${params.companyName}" company LinkedIn page and social media.

SEARCH QUERIES TO USE:
- "${params.companyName}" LinkedIn company page
- "${domain}" site:linkedin.com/company
- "${params.companyName}" Twitter OR X account

FIND AND REPORT:
1. LinkedIn company page: Find the URL like linkedin.com/company/companyname
2. Twitter/X account: Find @handle or twitter.com/handle
3. Employee count
4. Headquarters city
5. Year founded

OUTPUT FORMAT:
LinkedIn: https://linkedin.com/company/[exact-slug]
Twitter: https://twitter.com/[exact-handle]
Employees: [number or range]
HQ: [city, country]
Founded: [year]`,
                temperature: 0,
              });
              searchData = result.text;
              console.log(
                "[Tool:searchCompany] Success:",
                result.text.length,
                "chars",
              );
              // Log if we found LinkedIn/Twitter in search results
              const hasLinkedIn = result.text
                .toLowerCase()
                .includes("linkedin");
              const hasTwitter =
                result.text.toLowerCase().includes("twitter") ||
                result.text.toLowerCase().includes("x.com");
              console.log(
                "[Tool:searchCompany] Found LinkedIn:",
                hasLinkedIn,
                "Twitter:",
                hasTwitter,
              );
              return { success: true, data: result.text };
            } catch (error) {
              console.error("[Tool:searchCompany] Error:", error);
              return { success: false, error: String(error) };
            }
          },
        }),

        // Tool 3: Dedicated social links finder (more aggressive)
        findSocialLinks: tool({
          description: "Find social media links using targeted searches",
          inputSchema: z.object({
            companyName: z.string().describe("Company name"),
          }),
          execute: async ({ companyName }: { companyName: string }) => {
            console.log("[Tool:findSocialLinks] Searching for:", companyName);
            const results: {
              linkedin: string | null;
              twitter: string | null;
              instagram: string | null;
              facebook: string | null;
            } = {
              linkedin: null,
              twitter: null,
              instagram: null,
              facebook: null,
            };

            try {
              // Search for all social links in one call (more efficient)
              const socialSearch = await generateText({
                model: google("gemini-2.5-flash-lite"),
                tools: { google_search: google.tools.googleSearch({}) },
                prompt: `Find official social media pages for "${companyName}" (website: ${domain}).

Search for:
1. site:linkedin.com/company "${companyName}"
2. site:twitter.com "${companyName}" OR site:x.com "${companyName}"
3. site:instagram.com "${companyName}"
4. site:facebook.com "${companyName}"

For each social network found, output the URL in this EXACT format:
LinkedIn: https://linkedin.com/company/[slug]
Twitter: https://twitter.com/[handle]
Instagram: https://instagram.com/[handle]
Facebook: https://facebook.com/[page]

IMPORTANT:
- Only include URLs that are clearly for this specific company at ${domain}
- If a social link is not found, omit that line
- Output ONLY the URLs in the format above, nothing else`,
                temperature: 0,
              });

              const text = socialSearch.text;

              // Extract LinkedIn
              const linkedInMatch = text.match(
                /https?:\/\/(www\.)?linkedin\.com\/company\/[\w-]+/i,
              );
              if (linkedInMatch) {
                results.linkedin = linkedInMatch[0].replace("www.", "");
                console.log(
                  "[Tool:findSocialLinks] Found LinkedIn:",
                  results.linkedin,
                );
              }

              // Extract Twitter/X
              const twitterMatch = text.match(
                /https?:\/\/(www\.)?(twitter\.com|x\.com)\/[\w]+/i,
              );
              if (twitterMatch) {
                results.twitter = twitterMatch[0].replace("www.", "");
                console.log(
                  "[Tool:findSocialLinks] Found Twitter:",
                  results.twitter,
                );
              }

              // Extract Instagram
              const instagramMatch = text.match(
                /https?:\/\/(www\.)?instagram\.com\/[\w.]+/i,
              );
              if (instagramMatch) {
                results.instagram = instagramMatch[0].replace("www.", "");
                console.log(
                  "[Tool:findSocialLinks] Found Instagram:",
                  results.instagram,
                );
              }

              // Extract Facebook
              const facebookMatch = text.match(
                /https?:\/\/(www\.)?facebook\.com\/[\w.]+/i,
              );
              if (facebookMatch) {
                results.facebook = facebookMatch[0].replace("www.", "");
                console.log(
                  "[Tool:findSocialLinks] Found Facebook:",
                  results.facebook,
                );
              }

              // Store in shared state for extraction
              const foundLinks = [
                results.linkedin && `LinkedIn: ${results.linkedin}`,
                results.twitter && `Twitter: ${results.twitter}`,
                results.instagram && `Instagram: ${results.instagram}`,
                results.facebook && `Facebook: ${results.facebook}`,
              ].filter(Boolean);

              if (foundLinks.length > 0) {
                searchData = `${searchData || ""}\n\nSOCIAL LINKS FOUND:\n${foundLinks.join("\n")}`;
              }

              return { success: true, ...results };
            } catch (error) {
              console.error("[Tool:findSocialLinks] Error:", error);
              return {
                success: false,
                linkedin: null,
                twitter: null,
                instagram: null,
                facebook: null,
              };
            }
          },
        }),

        // Tool 4: Generate company description
        generateDescription: tool({
          description:
            "Write a compelling description of what the company does",
          inputSchema: z.object({
            websiteInfo: z.string().nullable().describe("Website data"),
          }),
          execute: async ({ websiteInfo }: { websiteInfo: string | null }) => {
            console.log("[Tool:generateDescription] Generating");
            try {
              const result = await generateText({
                model: google("gemini-2.5-flash"),
                prompt: `Based on the following website information, write a clear and compelling 1-2 sentence description of what "${params.companyName}" does.

WEBSITE INFORMATION:
${websiteInfo || websiteData || "Not available"}

Write a description that:
- Clearly explains what the company does
- Is professional and concise
- Is 1-2 sentences maximum
- Does not start with "The company" or "${params.companyName} is"

Just output the description, nothing else.`,
                temperature: 0.3, // Slightly creative
              });
              const description = result.text.trim();
              generatedDescription = description;
              console.log(
                "[Tool:generateDescription] Success:",
                description.length,
                "chars",
              );
              return { success: true, description };
            } catch (error) {
              console.error("[Tool:generateDescription] Error:", error);
              return { success: false, error: String(error) };
            }
          },
        }),

        // Tool 4: Extract structured data
        extractData: tool({
          description: "Extract structured data from gathered info",
          inputSchema: z.object({
            websiteInfo: z.string().nullable().describe("Website data"),
            searchInfo: z.string().nullable().describe("Search data"),
            description: z
              .string()
              .nullable()
              .describe("Generated description"),
          }),
          execute: async ({
            websiteInfo,
            searchInfo,
            description,
          }: {
            websiteInfo: string | null;
            searchInfo: string | null;
            description: string | null;
          }) => {
            console.log("[Tool:extractData] Extracting");
            try {
              const result = await generateObject({
                model: google("gemini-2.5-flash"),
                schema: customerEnrichmentSchema,
                prompt: `Extract structured data for "${params.companyName}" (${domain}).

=== COMPANY DESCRIPTION (use this) ===
${description || "Generate from website data below"}

=== DATA FROM WEBSITE ===
${websiteInfo || websiteData || "Not available"}

=== DATA FROM SEARCH ===
${searchInfo || searchData || "Not available"}

=== KNOWN CONTEXT ===
${contextSection || "None"}

INSTRUCTIONS:
- Use the provided description if available
- Extract LinkedIn URL format: https://linkedin.com/company/[slug]
- Extract Twitter URL format: https://twitter.com/[handle]
- Extract all other available fields`,
                temperature: 0,
              });
              console.log("[Tool:extractData] Success");
              return { success: true, extractedData: result.object };
            } catch (error) {
              console.error("[Tool:extractData] Error:", error);
              return { success: false, error: String(error) };
            }
          },
        }),
      },
      stopWhen: stepCountIs(4),
      prepareStep: async ({ stepNumber }) => {
        if (stepNumber === 0) {
          // Step 0: Read website and search in parallel
          return {
            activeTools: ["readWebsite", "searchCompany"],
          };
        }
        if (stepNumber === 1) {
          // Step 1: Find social links (dedicated search) + generate description
          return {
            activeTools: ["findSocialLinks", "generateDescription"],
          };
        }
        // Step 2+: Extract structured data
        return {
          activeTools: ["extractData"],
          toolChoice: { type: "tool", toolName: "extractData" },
        };
      },
    });

    // Run agent
    const result = await agent.generate({
      prompt: `Research "${params.companyName}" at ${fullUrl}.

Step 1: Call BOTH tools:
- readWebsite with url="${fullUrl}"
- searchCompany with query="${params.companyName} ${domain}"

Step 2: Call findSocialLinks AND generateDescription to find social media and write description

Step 3: Call extractData to create the final structured output`,
    });

    console.log("[Enrichment] Agent done. Steps:", result.steps?.length);

    if (signal.aborted) throw new Error("Enrichment cancelled");

    // Get extracted data
    let extractedData: CustomerEnrichmentResult | null = null;
    for (const tr of result.toolResults || []) {
      const output = tr.output as Record<string, unknown>;
      if (tr.toolName === "extractData" && output?.success) {
        extractedData = output.extractedData as CustomerEnrichmentResult;
        console.log("[Enrichment] Raw extracted data:", {
          description: extractedData?.description?.substring(0, 50),
          linkedinUrl: extractedData?.linkedinUrl,
          twitterUrl: extractedData?.twitterUrl,
          industry: extractedData?.industry,
        });
      }
    }

    // Fallback
    if (!extractedData) {
      console.log("[Enrichment] Fallback extraction");
      const fallback = await generateObject({
        model: google("gemini-2.5-flash"),
        schema: customerEnrichmentSchema,
        prompt: `Extract structured data for "${params.companyName}" (${domain}).

=== COMPANY DESCRIPTION (use this) ===
${generatedDescription || "Generate from website data below"}

=== WEBSITE DATA ===
${websiteData || "Not available"}

=== SEARCH DATA ===
${searchData || "Not available"}

=== CONTEXT ===
${contextSection || "None"}

INSTRUCTIONS:
- Use the provided description if available
- Extract LinkedIn URL format: https://linkedin.com/company/[slug]
- Extract Twitter URL format: https://twitter.com/[handle]
- Extract all other available fields.`,
        temperature: 0,
      });
      extractedData = fallback.object;
    }

    // Verify
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
        durationMs,
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
