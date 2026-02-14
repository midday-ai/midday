/**
 * Invopop Response Parsers
 *
 * Pure functions for extracting structured data from Invopop API
 * responses (silo entries, faults) into Midday's DB-compatible format.
 */

import type { InvopopFault, InvopopMeta, InvopopSiloEntry } from "./types";

// ---------------------------------------------------------------------------
// Fault mapping
// ---------------------------------------------------------------------------

/**
 * Map Invopop faults to our DB-compatible format where `message` is required.
 * Invopop's `InvopopFault.message` is optional, so we default to "Unknown error".
 */
export function mapFaults(
  faults?: InvopopFault[],
): { message: string; [key: string]: unknown }[] {
  if (!faults || faults.length === 0) return [];
  return faults.map((f) => ({
    message: f.message ?? "Unknown error",
    ...(f.code && { code: f.code }),
    ...(f.provider && { provider: f.provider }),
  }));
}

// ---------------------------------------------------------------------------
// Silo entry extraction
// ---------------------------------------------------------------------------

/**
 * Extract the Peppol participant ID and scheme from an org.party silo entry.
 * After registration the party document contains an `inboxes` array
 * with a `key: "peppol"` entry holding the assigned participant ID.
 */
export function extractPeppolId(entry: InvopopSiloEntry): {
  peppolId: string | null;
  peppolScheme: string | null;
} {
  const partyData = entry.data as Record<string, unknown> | undefined;
  const doc = (partyData?.doc ?? partyData) as
    | Record<string, unknown>
    | undefined;
  const inboxes = doc?.inboxes as
    | Array<{ key?: string; scheme?: string; code?: string }>
    | undefined;
  const peppolInbox = inboxes?.find((i) => i.key === "peppol");

  return {
    peppolId: peppolInbox?.code ?? null,
    peppolScheme: peppolInbox?.scheme ?? null,
  };
}

/**
 * Extract the registration / proof-of-ownership URL from a silo entry's
 * `meta` array.  The Peppol registration workflow stores this after the
 * "Register Party for Approval" step.
 */
export function extractRegistrationUrl(entry: InvopopSiloEntry): string | null {
  const meta = entry.meta as InvopopMeta[] | undefined;
  if (!meta) return null;

  const regMeta = meta.find(
    (m) =>
      m.key === "peppol-register-link" ||
      m.key === "register-link" ||
      m.link_url,
  );

  return regMeta?.link_url ?? null;
}
