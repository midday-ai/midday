import type { Database } from "@midday/db/client";
import {
  getInvoiceById,
  updateEInvoiceRegistrationByTeam,
  updateInvoice,
} from "@midday/db/queries";
import { fetchEntry } from "@midday/e-invoice/client";
import {
  extractPeppolId,
  extractRegistrationUrl,
  mapFaults,
} from "@midday/e-invoice/parsers";
import type {
  InvopopSiloEntry,
  InvopopWebhookPayload,
} from "@midday/e-invoice/types";
import { logger } from "@midday/logger";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Safely fetch a silo entry, returning null on failure. */
async function safeFetchEntry(
  siloEntryId: string | undefined,
): Promise<InvopopSiloEntry | null> {
  if (!siloEntryId) return null;
  const apiKey = process.env.INVOPOP_API_KEY;
  if (!apiKey) return null;

  try {
    return await fetchEntry(apiKey, siloEntryId);
  } catch (err) {
    logger.warn("Failed to fetch silo entry", {
      siloEntryId,
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

// ---------------------------------------------------------------------------
// Party registration handlers
// ---------------------------------------------------------------------------

export async function handlePartyError(
  db: Database,
  teamId: string,
  payload: InvopopWebhookPayload,
) {
  logger.warn("Peppol registration failed", {
    teamId,
    faults: payload.faults,
  });

  await updateEInvoiceRegistrationByTeam(db, {
    teamId,
    provider: "peppol",
    status: "error",
    faults: mapFaults(payload.faults),
  });
}

export async function handlePartyProcessing(
  db: Database,
  teamId: string,
  payload: InvopopWebhookPayload,
) {
  logger.info("Peppol registration processing", { teamId });

  const entry = await safeFetchEntry(payload.silo_entry_id);
  const registrationUrl = entry ? extractRegistrationUrl(entry) : null;

  await updateEInvoiceRegistrationByTeam(db, {
    teamId,
    provider: "peppol",
    status: "processing",
    faults: null,
    ...(registrationUrl && { registrationUrl }),
  });
}

export async function handlePartyRegistered(
  db: Database,
  teamId: string,
  payload: InvopopWebhookPayload,
) {
  logger.info("Peppol registration succeeded", { teamId });

  const entry = await safeFetchEntry(payload.silo_entry_id);
  const { peppolId, peppolScheme } = entry
    ? extractPeppolId(entry)
    : { peppolId: null, peppolScheme: null };

  if (!peppolId) {
    // Don't persist "registered" without identifiers — throw so the webhook
    // returns 500 and Invopop retries later when the silo entry is available.
    logger.warn("Peppol registration callback missing peppolId, will retry", {
      teamId,
      siloEntryId: payload.silo_entry_id,
      hadEntry: entry !== null,
    });

    throw new Error(
      "Cannot complete registration: peppolId could not be extracted",
    );
  }

  await updateEInvoiceRegistrationByTeam(db, {
    teamId,
    provider: "peppol",
    status: "registered",
    faults: null,
    peppolId,
    ...(peppolScheme && { peppolScheme }),
  });
}

// ---------------------------------------------------------------------------
// Invoice e-invoice handler
// ---------------------------------------------------------------------------

export async function handleInvoiceCallback(
  db: Database,
  invoiceId: string,
  payload: InvopopWebhookPayload,
) {
  const invoice = await getInvoiceById(db, { id: invoiceId });

  if (!invoice) {
    logger.warn("Invopop webhook: invoice not found", { invoiceId });
    return;
  }

  const isError =
    payload.event === "error" || (payload.faults && payload.faults.length > 0);

  if (isError) {
    logger.warn("E-invoice submission failed", {
      invoiceId,
      faults: payload.faults,
    });

    await updateInvoice(db, {
      id: invoiceId,
      teamId: invoice.teamId,
      eInvoiceStatus: "error",
      eInvoiceFaults: mapFaults(payload.faults),
    });
  } else {
    logger.info("E-invoice submission succeeded", {
      invoiceId,
      siloEntryId: payload.silo_entry_id,
    });

    await updateInvoice(db, {
      id: invoiceId,
      teamId: invoice.teamId,
      eInvoiceStatus: "sent",
      eInvoiceFaults: null,
    });
  }
}
