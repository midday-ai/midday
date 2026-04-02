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

const ENRICHMENT_TIMEOUT_MS = 30_000;

/**
 * Enriches customer data via CompanyEnrich API.
 * Looks up by company name, validates the domain matches, maps to schema.
 */
export class EnrichCustomerProcessor extends BaseProcessor<EnrichCustomerPayload> {
  async process(job: Job<EnrichCustomerPayload>): Promise<{
    customerId: string;
    status: string;
    fieldsEnriched?: number;
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

    try {
      const result = await enrichCustomer(
        {
          companyName: customer.name,
          website: customer.website,
          email: customer.email,
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
        source: result.metrics.source,
        domainMatch: result.metrics.domainMatch,
      });

      return {
        customerId,
        status: "enriched",
        fieldsEnriched: result.verifiedFieldCount,
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
