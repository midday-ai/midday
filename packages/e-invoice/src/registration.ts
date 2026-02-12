/**
 * Supplier Registration
 *
 * Handles registering teams as Peppol participants (or other e-invoice
 * providers) through the Invopop API. Registration is required before
 * invoices can be sent via Peppol.
 *
 * Flow:
 * 1. Build org.party GOBL document from team data
 * 2. Upload to Invopop Silo
 * 3. Run through Party registration workflow
 * 4. Invopop generates a registration link for proof of ownership
 * 5. Team completes verification (up to 72h)
 * 6. Webhook fires on completion -> update registration status
 */

import { createEntry, createJob } from "./client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TeamRegistrationData {
  teamId: string;
  name: string;
  email: string | null;
  countryCode: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  vatNumber: string | null;
  /** Pre-existing Peppol ID (reused instead of auto-generated) */
  peppolId: string | null;
}

// ---------------------------------------------------------------------------
// Build org.party document
// ---------------------------------------------------------------------------

/**
 * Build a GOBL org.party document for Peppol registration.
 * This is the supplier's company information in GOBL format.
 */
export function buildPartyDocument(data: TeamRegistrationData): {
  $schema: string;
  name: string;
  tax_id?: { country: string; code?: string };
  addresses?: {
    street?: string;
    street_extra?: string;
    locality?: string;
    region?: string;
    code?: string;
    country?: string;
  }[];
  emails?: { addr: string }[];
  inboxes?: { key: string; code: string }[];
} {
  const party: Record<string, unknown> = {
    $schema: "https://gobl.org/draft-0/org/party",
    name: data.name,
  };

  // Tax ID
  if (data.countryCode) {
    const taxId: Record<string, string> = { country: data.countryCode };
    if (data.vatNumber) taxId.code = data.vatNumber;
    party.tax_id = taxId;
  }

  // Address
  if (data.addressLine1 || data.city) {
    const address: Record<string, string> = {};
    if (data.addressLine1) address.street = data.addressLine1;
    if (data.addressLine2) address.street_extra = data.addressLine2;
    if (data.city) address.locality = data.city;
    if (data.state) address.region = data.state;
    if (data.zip) address.code = data.zip;
    if (data.countryCode) address.country = data.countryCode;
    party.addresses = [address];
  }

  // Email
  if (data.email) {
    party.emails = [{ addr: data.email }];
  }

  // Pre-existing Peppol ID
  if (data.peppolId) {
    party.inboxes = [{ key: "peppol", code: data.peppolId }];
  }

  return party as ReturnType<typeof buildPartyDocument>;
}

// ---------------------------------------------------------------------------
// Registration flow
// ---------------------------------------------------------------------------

/**
 * Submit a team for Peppol registration through Invopop.
 *
 * 1. Creates a silo entry with the org.party document
 * 2. Creates a job to run the party registration workflow
 *
 * Returns the silo entry ID and job ID for tracking.
 */
export async function submitRegistration(
  apiKey: string,
  partyWorkflowId: string,
  data: TeamRegistrationData,
): Promise<{ siloEntryId: string; jobId: string }> {
  const partyDoc = buildPartyDocument(data);
  const key = partyKey(data.teamId);

  // Step 1: Create silo entry with org.party
  const entry = await createEntry(
    apiKey,
    partyDoc as unknown as Record<string, unknown>,
    key,
  );

  // Step 2: Run party registration workflow
  const job = await createJob(apiKey, partyWorkflowId, entry.id, key);

  return {
    siloEntryId: entry.id,
    jobId: job.id,
  };
}

// ---------------------------------------------------------------------------
// Key helpers
// ---------------------------------------------------------------------------

/**
 * Generate the idempotency key for a party registration.
 */
export function partyKey(teamId: string): string {
  return `midday-party-${teamId}`;
}

/**
 * Extract team ID from a webhook party key.
 */
export function parsePartyKey(key: string): string | null {
  const prefix = "midday-party-";
  if (!key.startsWith(prefix)) return null;
  return key.slice(prefix.length);
}
