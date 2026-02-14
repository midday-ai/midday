import type { Database } from "@midday/db/client";
import {
  getInvoiceById,
  updateEInvoiceRegistrationByTeam,
  updateInvoice,
} from "@midday/db/queries";
import { fetchEntry } from "@midday/e-invoice/client";
import { E_INVOICE_PROVIDER_PEPPOL } from "@midday/e-invoice/constants";
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
import { Notifications } from "@midday/notifications";

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

  const faults = mapFaults(payload.faults);

  await updateEInvoiceRegistrationByTeam(db, {
    teamId,
    provider: E_INVOICE_PROVIDER_PEPPOL,
    status: "error",
    faults,
  });

  // Notify team owners — fire and forget
  const notifications = new Notifications(db);
  notifications
    .create(
      "e_invoice_registration_error",
      teamId,
      {
        teamId,
        errorMessage: faults[0]?.message ?? "Registration failed",
      },
      { sendEmail: true },
    )
    .catch((err) =>
      logger.warn("Failed to send e-invoice error notification", {
        teamId,
        error: err instanceof Error ? err.message : String(err),
      }),
    );
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
    provider: E_INVOICE_PROVIDER_PEPPOL,
    status: "processing",
    faults: null,
    ...(registrationUrl && { registrationUrl }),
  });

  // Notify team owners — fire and forget so the webhook returns 200 quickly
  const notifications = new Notifications(db);
  notifications
    .create(
      "e_invoice_registration_processing",
      teamId,
      { teamId, registrationUrl: registrationUrl ?? undefined },
      { sendEmail: true },
    )
    .catch((err) =>
      logger.warn("Failed to send e-invoice processing notification", {
        teamId,
        error: err instanceof Error ? err.message : String(err),
      }),
    );
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
    provider: E_INVOICE_PROVIDER_PEPPOL,
    status: "registered",
    faults: null,
    peppolId,
    ...(peppolScheme && { peppolScheme }),
  });

  // Notify team owners — fire and forget
  const notifications = new Notifications(db);
  notifications
    .create(
      "e_invoice_registration_complete",
      teamId,
      { teamId, peppolId },
      { sendEmail: true },
    )
    .catch((err) =>
      logger.warn("Failed to send e-invoice registered notification", {
        teamId,
        error: err instanceof Error ? err.message : String(err),
      }),
    );
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
  const isProcessing = payload.event === "processing";

  const notifications = new Notifications(db);

  if (isError) {
    logger.warn("E-invoice submission failed", {
      invoiceId,
      faults: payload.faults,
    });

    const faults = mapFaults(payload.faults);

    await updateInvoice(db, {
      id: invoiceId,
      teamId: invoice.teamId,
      eInvoiceStatus: "error",
      eInvoiceFaults: faults,
    });

    // In-app notification — fire and forget
    notifications
      .create("e_invoice_error", invoice.teamId, {
        invoiceId,
        invoiceNumber: invoice.invoiceNumber ?? undefined,
        customerName: invoice.customerName ?? undefined,
        errorMessage: faults[0]?.message ?? "E-invoice delivery failed",
      })
      .catch((err) =>
        logger.warn("Failed to send e-invoice error notification", {
          invoiceId,
          error: err instanceof Error ? err.message : String(err),
        }),
      );
  } else if (isProcessing) {
    logger.info("E-invoice submission processing", {
      invoiceId,
      siloEntryId: payload.silo_entry_id,
    });

    await updateInvoice(db, {
      id: invoiceId,
      teamId: invoice.teamId,
      eInvoiceStatus: "processing",
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

    // In-app notification — fire and forget
    notifications
      .create("e_invoice_sent", invoice.teamId, {
        invoiceId,
        invoiceNumber: invoice.invoiceNumber ?? undefined,
        customerName: invoice.customerName ?? undefined,
      })
      .catch((err) =>
        logger.warn("Failed to send e-invoice sent notification", {
          invoiceId,
          error: err instanceof Error ? err.message : String(err),
        }),
      );
  }
}
