import {
  getEInvoiceRegistration,
  getTeamById,
  updateEInvoiceRegistrationByTeam,
} from "@midday/db/queries";
import { submitRegistration } from "@midday/e-invoice/registration";
import type { Job } from "bullmq";
import { getDb } from "../../utils/db";
import { BaseProcessor } from "../base";

export interface RegisterSupplierPayload {
  teamId: string;
}

/**
 * Register Supplier Processor
 *
 * Handles registering a team as a Peppol participant through Invopop.
 * This is a one-time process per team that must complete before
 * e-invoices can be sent.
 *
 * Flow:
 * 1. Build org.party from team data
 * 2. Submit to Invopop Silo + Party registration workflow
 * 3. Store silo entry ID on the registration record
 * 4. Completion comes async via webhook
 */
export class RegisterSupplierProcessor extends BaseProcessor<RegisterSupplierPayload> {
  async process(job: Job<RegisterSupplierPayload>): Promise<void> {
    const { teamId } = job.data;
    const db = getDb();

    this.logger.info("Starting supplier registration", {
      jobId: job.id,
      teamId,
    });

    const apiKey = process.env.INVOPOP_API_KEY;
    const partyWorkflowId = process.env.INVOPOP_PARTY_WORKFLOW_ID;

    if (!apiKey || !partyWorkflowId) {
      this.logger.error("Invopop platform not configured for registration", {
        teamId,
        hasApiKey: !!apiKey,
        hasPartyWorkflowId: !!partyWorkflowId,
      });
      throw new Error("Invopop platform not configured");
    }

    const team = await getTeamById(db, teamId);

    if (!team) {
      this.logger.error("Team not found", { teamId });
      throw new Error(`Team not found: ${teamId}`);
    }

    if (
      !team.name ||
      !team.countryCode ||
      !team.addressLine1 ||
      !team.vatNumber
    ) {
      this.logger.error("Team missing required data for registration", {
        teamId,
        hasName: !!team.name,
        hasCountry: !!team.countryCode,
        hasAddress: !!team.addressLine1,
        hasVat: !!team.vatNumber,
      });
      throw new Error(
        "Team missing required company data for e-invoice registration",
      );
    }

    // Guard: skip if a prior registration already reached a terminal state.
    // Retries or duplicate triggers must not regress a "registered" team.
    const existing = await getEInvoiceRegistration(db, {
      teamId,
      provider: "peppol",
    });

    if (existing?.status === "registered") {
      this.logger.info(
        "Team already registered for Peppol, skipping duplicate registration",
        { teamId },
      );
      return;
    }

    try {
      const result = await submitRegistration(apiKey, partyWorkflowId, {
        teamId,
        name: team.name,
        email: team.email,
        countryCode: team.countryCode,
        addressLine1: team.addressLine1,
        addressLine2: team.addressLine2,
        city: team.city,
        state: team.state,
        zip: team.zip,
        vatNumber: team.vatNumber,
        peppolId: team.peppolId,
      });

      this.logger.info("Supplier registration submitted", {
        teamId,
        siloEntryId: result.siloEntryId,
        jobId: result.jobId,
      });

      if (result.jobId) {
        // We successfully created a new job — safe to mark as "processing"
        // now that we know this is not a duplicate.
        await updateEInvoiceRegistrationByTeam(db, {
          teamId,
          provider: "peppol",
          status: "processing",
          siloEntryId: result.siloEntryId,
        });
      } else {
        // Job already existed (409 conflict) — the registration workflow is
        // already in flight or completed. Do NOT overwrite the status; the
        // webhook will reconcile the final state.
        this.logger.info(
          "Registration job already exists (conflict), skipping status update",
          { teamId, siloEntryId: result.siloEntryId },
        );
      }
    } catch (error) {
      this.logger.error("Failed to submit supplier registration", {
        teamId,
        error: error instanceof Error ? error.message : String(error),
      });

      // Update registration status to error
      try {
        await updateEInvoiceRegistrationByTeam(db, {
          teamId,
          provider: "peppol",
          status: "error",
          faults: [
            {
              message: error instanceof Error ? error.message : "Unknown error",
              provider: "invopop",
            },
          ],
        });
      } catch {
        // Don't mask the original error
      }

      throw error;
    }

    this.logger.info("Supplier registration flow initiated", { teamId });
  }
}
