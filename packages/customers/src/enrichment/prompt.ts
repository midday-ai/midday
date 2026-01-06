import type { EnrichCustomerParams } from "./enrich";
import {
  companyTypeOptions,
  employeeCountOptions,
  fundingStageOptions,
  industryOptions,
  revenueOptions,
} from "./schema";

/**
 * Build context section from available customer data
 */
function buildContextSection(params: EnrichCustomerParams): string {
  const contextParts: string[] = [];

  // Email domain can confirm company identity
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

  // Location context
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

  if (params.address) {
    contextParts.push(`Address: ${params.address}`);
  }

  if (params.phone) {
    contextParts.push(`Phone: ${params.phone}`);
  }

  if (params.vatNumber) {
    contextParts.push(`VAT number: ${params.vatNumber}`);
  }

  if (params.contactName) {
    contextParts.push(`Contact person: ${params.contactName}`);
  }

  if (params.note) {
    contextParts.push(`Notes: ${params.note}`);
  }

  if (contextParts.length === 0) {
    return "";
  }

  return contextParts.map((p) => `- ${p}`).join("\n");
}

/**
 * Generate prompt for Google Search grounding step.
 * This searches for real information about the company.
 * CRITICAL: Must be specific to the exact domain to avoid conflating with other companies.
 */
export function generateSearchPrompt(params: EnrichCustomerParams): string {
  const context = buildContextSection(params);
  const domain = params.website.replace(/^https?:\/\//, "").replace(/\/$/, "");

  return `Search for information SPECIFICALLY about the company at the domain "${domain}".

CRITICAL: There may be multiple companies with similar names. You MUST only report information that is:
1. From the website ${domain} itself
2. From LinkedIn/Twitter pages that link to ${domain}
3. From sources that explicitly mention the domain ${domain}

DO NOT include information about other companies with similar names.

Search for:
- What ${domain} does (from their own website)
- Their LinkedIn company page (must link to ${domain})
- Their Twitter/X page (must be official account for ${domain})

For the following, ONLY include if found on ${domain} itself or explicitly attributed to ${domain}:
- Number of employees
- Year founded  
- Headquarters location
- Funding information

${context ? `Known context:\n${context}\n` : ""}
If you find conflicting information or information about a different company, say "Not found" for that field.
For any field you cannot verify is specifically about ${domain}, say "Not found".`;
}

/**
 * Generate prompt for structuring search results into our schema.
 * Takes the search results as context.
 */
export function generateCustomerEnrichmentPrompt(
  params: EnrichCustomerParams,
  searchContext: string,
): string {
  const domain = params.website.replace(/^https?:\/\//, "").replace(/\/$/, "");

  return `Extract structured data from search results about ${domain}.

SEARCH RESULTS:
${searchContext}

CRITICAL RULES:
1. If search results say "Not found" for a field, return null
2. If information might be about a DIFFERENT company with a similar name, return null
3. Only use information explicitly verified to be about ${domain}
4. When in doubt, return null - it's better to have missing data than wrong data

FIELDS:

description: What ${domain} does, from their own website. Return null if unclear.

industry: One of: ${industryOptions.join(", ")}
Only if clearly evident. Return null if unsure.

companyType: One of: ${companyTypeOptions.join(", ")}
Only if clearly evident. Return null if unsure.

employeeCount: One of: ${employeeCountOptions.join(", ")}
Only from their LinkedIn or website. Return null otherwise.

foundedYear: Only if stated on ${domain} or their official LinkedIn. Return null otherwise.

estimatedRevenue: One of: ${revenueOptions.join(", ")}
Return null - most companies don't disclose this.

fundingStage: One of: ${fundingStageOptions.join(", ")}
Only if clearly verified for ${domain}. Return null if any doubt.

totalFunding: Only if clearly verified for ${domain}. Return null if any doubt about which company.

headquartersLocation: Only from ${domain} or their official LinkedIn. Return null otherwise.

timezone: Based on verified HQ. Return null if HQ is null.

linkedinUrl: Only if verified to be the official page for ${domain}. Return null otherwise.

twitterUrl: Only if verified to be the official account for ${domain}. Return null otherwise.

Most fields should be null unless you have high confidence the data is about ${domain} specifically.`;
}
