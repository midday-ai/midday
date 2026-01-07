import { enrichCustomer } from "@midday/customers";
import {
  getCustomerForEnrichment,
  markCustomerEnrichmentFailed,
  updateCustomerEnrichment,
  updateCustomerEnrichmentStatus,
} from "@midday/db/queries";
import type { Job } from "bullmq";
import type { EnrichCustomerPayload } from "../../schemas/customers";
import { getDb } from "../../utils/db";
import { BaseProcessor } from "../base";

// Enrichment timeout (60 seconds - faster with parallel execution)
const ENRICHMENT_TIMEOUT_MS = 60_000;

/**
 * Enriches customer data using a multi-step agentic pipeline with ToolLoopAgent.
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
export class EnrichCustomerProcessor extends BaseProcessor<EnrichCustomerPayload> {
  async process(job: Job<EnrichCustomerPayload>): Promise<{
    customerId: string;
    status: string;
    fieldsEnriched?: number;
    stepsUsed?: number;
  }> {
    const { customerId, teamId } = job.data;
    const db = getDb();

    this.logger.info("Starting customer enrichment", {
      jobId: job.id,
      customerId,
      teamId,
      attempt: job.attemptsMade + 1,
    });

    // Get customer data
    const customer = await getCustomerForEnrichment(db, { customerId, teamId });

    if (!customer) {
      this.logger.warn("Customer not found for enrichment", {
        customerId,
        teamId,
      });
      return { customerId, status: "not_found" };
    }

    // Mark as processing
    await updateCustomerEnrichmentStatus(db, {
      customerId,
      status: "processing",
    });

    // Skip if no website
    if (!customer.website) {
      await updateCustomerEnrichmentStatus(db, {
        customerId,
        status: "completed",
      });
      this.logger.info("No website for customer, skipping enrichment", {
        customerId,
      });
      return { customerId, status: "no_website" };
    }

    try {
      // Call enrichment package with full customer context
      const result = await enrichCustomer(
        {
          website: customer.website,
          companyName: customer.name,
          email: customer.email,
          country: customer.country,
          countryCode: customer.countryCode,
          city: customer.city,
          state: customer.state,
          address: customer.addressLine1,
          phone: customer.phone,
          vatNumber: customer.vatNumber,
          note: customer.note,
          contactName: customer.contact,
        },
        {
          timeoutMs: ENRICHMENT_TIMEOUT_MS,
        },
      );

      // Store verified data (only update vatNumber if not already set)
      const { vatNumber: _, ...dataWithoutVat } = result.verified;
      const dataToUpdate = customer.vatNumber
        ? dataWithoutVat
        : result.verified;

      await updateCustomerEnrichment(db, {
        customerId,
        teamId,
        data: dataToUpdate,
      });

      this.logger.info("Customer enriched successfully", {
        customerId,
        teamId,
        verifiedFields: result.verifiedFieldCount,
        durationMs: result.metrics.durationMs,
        websiteReadSuccess: result.metrics.websiteReadSuccess,
        searchSuccess: result.metrics.searchSuccess,
        linkedinFound: result.metrics.linkedinFound,
      });

      return {
        customerId,
        status: "enriched",
        fieldsEnriched: result.verifiedFieldCount,
        stepsUsed: result.metrics.stepsUsed,
      };
    } catch (error) {
      const isTimeout =
        error instanceof Error && error.message.includes("timed out");
      const isCancelled =
        error instanceof Error && error.message.includes("cancelled");

      this.logger.error("Failed to enrich customer", {
        customerId,
        teamId,
        error: error instanceof Error ? error.message : "Unknown error",
        isTimeout,
        isCancelled,
      });

      // Attempt to mark as failed, but don't let this mask the original error
      try {
        await markCustomerEnrichmentFailed(db, customerId);
      } catch (statusError) {
        this.logger.error("Failed to mark customer enrichment as failed", {
          customerId,
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
