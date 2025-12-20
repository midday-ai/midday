import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { createLoggerWithContext } from "@midday/logger";
import { generateText } from "ai";
import { removeProtocolFromDomain } from "../utils";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY!,
});

const DOMAIN_LOOKUP_TIMEOUT = 8000; // 8 seconds

/**
 * Lookup company domain using Gemini Grounding with Google Search
 * This function searches for the official website domain of a company by name
 *
 * @param companyName - The company/vendor name to lookup
 * @param logger - Optional logger instance for logging lookup attempts
 * @returns The domain name (e.g., "example.com") or null if not found/failed
 */
export async function lookupDomainByCompanyName(
  companyName: string | null | undefined,
  logger?: ReturnType<typeof createLoggerWithContext>,
): Promise<string | null> {
  // Validate input
  if (!companyName || companyName.trim().length === 0) {
    return null;
  }

  const cleanedCompanyName = companyName.trim();

  // Skip if company name is too short or looks invalid
  if (cleanedCompanyName.length < 2) {
    return null;
  }

  logger?.info("Attempting domain lookup", { companyName: cleanedCompanyName });

  try {
    // Use AbortSignal for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, DOMAIN_LOOKUP_TIMEOUT);

    const prompt = `What is the official website domain for the company "${cleanedCompanyName}"? 

Respond with ONLY the domain name (e.g., "example.com"), without protocol (http://, https://), without www prefix, and without any paths. 
If you cannot find the official website, respond with "unknown".

Domain:`;

    const result = await generateText({
      model: google("gemini-3-flash-preview"),
      tools: {
        google_search: google.tools.googleSearch({}),
      } as any,
      prompt,
      temperature: 0.1,
      abortSignal: controller.signal,
    });

    clearTimeout(timeoutId);

    const responseText = result.text.trim().toLowerCase();

    // Check if model returned "unknown" or similar
    if (
      responseText === "unknown" ||
      responseText === "not found" ||
      responseText === "n/a" ||
      responseText.length === 0
    ) {
      logger?.info("Domain lookup returned unknown", {
        companyName: cleanedCompanyName,
      });
      return null;
    }

    // Clean the domain using existing utility
    const domain = removeProtocolFromDomain(responseText);

    if (!domain) {
      logger?.warn("Domain lookup returned invalid domain", {
        companyName: cleanedCompanyName,
        response: responseText,
      });
      return null;
    }

    logger?.info("Domain lookup successful", {
      companyName: cleanedCompanyName,
      domain,
    });

    return domain.toLowerCase();
  } catch (error) {
    // Handle timeout
    if (error instanceof Error && error.name === "AbortError") {
      logger?.warn("Domain lookup timed out", {
        companyName: cleanedCompanyName,
        timeout: DOMAIN_LOOKUP_TIMEOUT,
      });
      return null;
    }

    // Handle other errors gracefully
    logger?.warn("Domain lookup failed", {
      companyName: cleanedCompanyName,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return null;
  }
}
