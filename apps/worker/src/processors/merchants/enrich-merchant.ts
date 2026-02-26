import { enrichMerchant } from "@midday/merchants";
import {
  getMerchantForEnrichment,
  markMerchantEnrichmentFailed,
  updateMerchantEnrichment,
  updateMerchantEnrichmentStatus,
} from "@midday/db/queries";
import type { Job } from "bullmq";
import type { EnrichMerchantPayload } from "../../schemas/merchants";
import { getDb } from "../../utils/db";
import { BaseProcessor } from "../base";

// Enrichment timeout (60 seconds - faster with parallel execution)
const ENRICHMENT_TIMEOUT_MS = 60_000;

/**
 * Enriches merchant data using a multi-step agentic pipeline with ToolLoopAgent.
 *
 * Pipeline:
 * 1. Read website directly using URL Context
 * 2. Search for LinkedIn company page
 * 3. Search for funding/news information
 * 4. Cross-reference and extract verified structured data
 *
 * Features:
 * - Multi-step agentic enrichment with ToolLoopAgent
 * - Automatic timeout (60s for full pipeline)
 * - Retry support via BullMQ (3 attempts with exponential backoff)
 * - Manual re-run via TRPC endpoint
 */
export class EnrichMerchantProcessor extends BaseProcessor<EnrichMerchantPayload> {
  async process(job: Job<EnrichMerchantPayload>): Promise<{
    merchantId: string;
    status: string;
    fieldsEnriched?: number;
    stepsUsed?: number;
  }> {
    const { merchantId, teamId } = job.data;
    const db = getDb();

    this.logger.info("Starting merchant enrichment", {
      jobId: job.id,
      merchantId,
      teamId,
      attempt: job.attemptsMade + 1,
    });

    // Get merchant data
    const merchant = await getMerchantForEnrichment(db, { merchantId, teamId });

    if (!merchant) {
      this.logger.warn("Merchant not found for enrichment", {
        merchantId,
        teamId,
      });
      return { merchantId, status: "not_found" };
    }

    // Mark as processing
    await updateMerchantEnrichmentStatus(db, {
      merchantId,
      status: "processing",
    });

    // Skip if no website
    if (!merchant.website) {
      await updateMerchantEnrichmentStatus(db, {
        merchantId,
        status: "completed",
      });
      this.logger.info("No website for merchant, skipping enrichment", {
        merchantId,
      });
      return { merchantId, status: "no_website" };
    }

    try {
      // Call enrichment package with full merchant context
      const result = await enrichMerchant(
        {
          website: merchant.website,
          companyName: merchant.name,
          email: merchant.email,
          country: merchant.country,
          countryCode: merchant.countryCode,
          city: merchant.city,
          state: merchant.state,
          address: merchant.addressLine1,
          phone: merchant.phone,
          vatNumber: merchant.vatNumber,
          note: merchant.note,
          contactName: merchant.contact,
        },
        {
          timeoutMs: ENRICHMENT_TIMEOUT_MS,
        },
      );

      // Store verified data (only update vatNumber if not already set)
      const { vatNumber: _, ...dataWithoutVat } = result.verified;
      const dataToUpdate = merchant.vatNumber
        ? dataWithoutVat
        : result.verified;

      await updateMerchantEnrichment(db, {
        merchantId,
        teamId,
        data: dataToUpdate,
      });

      this.logger.info("Merchant enriched successfully", {
        merchantId,
        teamId,
        verifiedFields: result.verifiedFieldCount,
        durationMs: result.metrics.durationMs,
        websiteReadSuccess: result.metrics.websiteReadSuccess,
        searchSuccess: result.metrics.searchSuccess,
        linkedinFound: result.metrics.linkedinFound,
      });

      return {
        merchantId,
        status: "enriched",
        fieldsEnriched: result.verifiedFieldCount,
        stepsUsed: result.metrics.stepsUsed,
      };
    } catch (error) {
      const isTimeout =
        error instanceof Error && error.message.includes("timed out");
      const isCancelled =
        error instanceof Error && error.message.includes("cancelled");

      this.logger.error("Failed to enrich merchant", {
        merchantId,
        teamId,
        error: error instanceof Error ? error.message : "Unknown error",
        isTimeout,
        isCancelled,
      });

      // Attempt to mark as failed, but don't let this mask the original error
      try {
        await markMerchantEnrichmentFailed(db, merchantId);
      } catch (statusError) {
        this.logger.error("Failed to mark merchant enrichment as failed", {
          merchantId,
          teamId,
          statusError:
            statusError instanceof Error
              ? statusError.message
              : "Unknown error",
        });
      }

      throw error;
    }
  }
}
