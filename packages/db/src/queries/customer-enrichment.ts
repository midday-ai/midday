import { and, eq } from "drizzle-orm";
import type { Database } from "../client";
import { customers } from "../schema";

export type CustomerForEnrichment = {
  id: string;
  name: string;
  website: string | null;
  teamId: string;
  // Additional context for better enrichment
  email: string | null;
  country: string | null;
  countryCode: string | null;
  city: string | null;
  state: string | null;
  addressLine1: string | null;
  phone: string | null;
  vatNumber: string | null;
  note: string | null;
  contact: string | null;
};

export type CustomerEnrichmentUpdateData = {
  description?: string | null;
  industry?: string | null;
  companyType?: string | null;
  employeeCount?: string | null;
  foundedYear?: number | null;
  estimatedRevenue?: string | null;
  fundingStage?: string | null;
  totalFunding?: string | null;
  headquartersLocation?: string | null;
  timezone?: string | null;
  linkedinUrl?: string | null;
  twitterUrl?: string | null;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  ceoName?: string | null;
  financeContact?: string | null;
  financeContactEmail?: string | null;
  primaryLanguage?: string | null;
  fiscalYearEnd?: string | null;
  vatNumber?: string | null;
};

export type UpdateCustomerEnrichmentParams = {
  customerId: string;
  teamId: string;
  data: CustomerEnrichmentUpdateData;
};

/**
 * Get customer for enrichment with additional context
 */
export async function getCustomerForEnrichment(
  db: Database,
  params: { customerId: string; teamId: string },
): Promise<CustomerForEnrichment | null> {
  const [result] = await db
    .select({
      id: customers.id,
      name: customers.name,
      website: customers.website,
      teamId: customers.teamId,
      // Additional context for LLM
      email: customers.email,
      country: customers.country,
      countryCode: customers.countryCode,
      city: customers.city,
      state: customers.state,
      addressLine1: customers.addressLine1,
      phone: customers.phone,
      vatNumber: customers.vatNumber,
      note: customers.note,
      contact: customers.contact,
    })
    .from(customers)
    .where(
      and(
        eq(customers.id, params.customerId),
        eq(customers.teamId, params.teamId),
      ),
    )
    .limit(1);

  return result ?? null;
}

/**
 * Update customer enrichment status
 */
export async function updateCustomerEnrichmentStatus(
  db: Database,
  params: {
    customerId: string;
    status: "pending" | "processing" | "completed" | "failed" | null;
  },
): Promise<void> {
  await db
    .update(customers)
    .set({
      enrichmentStatus: params.status,
      ...(params.status === "completed"
        ? { enrichedAt: new Date().toISOString() }
        : {}),
    })
    .where(eq(customers.id, params.customerId));
}

/**
 * Update customer with enrichment data
 * Only updates fields that are provided (non-undefined)
 */
export async function updateCustomerEnrichment(
  db: Database,
  params: UpdateCustomerEnrichmentParams,
): Promise<void> {
  const { customerId, teamId, data } = params;

  // Build update object with only defined fields
  const updateData: Record<string, unknown> = {
    enrichmentStatus: "completed",
    enrichedAt: new Date().toISOString(),
  };

  // Only include fields that are explicitly set (not undefined)
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      updateData[key] = value;
    }
  }

  await db
    .update(customers)
    .set(updateData)
    .where(and(eq(customers.id, customerId), eq(customers.teamId, teamId)));
}

/**
 * Mark customer enrichment as failed
 */
export async function markCustomerEnrichmentFailed(
  db: Database,
  customerId: string,
): Promise<void> {
  await db
    .update(customers)
    .set({ enrichmentStatus: "failed" })
    .where(eq(customers.id, customerId));
}

/**
 * Get customers that need enrichment (have website but not yet enriched)
 */
export async function getCustomersNeedingEnrichment(
  db: Database,
  params: { teamId: string; limit?: number },
): Promise<CustomerForEnrichment[]> {
  return db
    .select({
      id: customers.id,
      name: customers.name,
      website: customers.website,
      teamId: customers.teamId,
      // Additional context for LLM
      email: customers.email,
      country: customers.country,
      countryCode: customers.countryCode,
      city: customers.city,
      state: customers.state,
      addressLine1: customers.addressLine1,
      phone: customers.phone,
      vatNumber: customers.vatNumber,
      note: customers.note,
      contact: customers.contact,
    })
    .from(customers)
    .where(
      and(
        eq(customers.teamId, params.teamId),
        eq(customers.enrichmentStatus, "pending"),
      ),
    )
    .limit(params.limit ?? 50);
}

/**
 * Clear all enrichment data for a customer
 */
export async function clearCustomerEnrichment(
  db: Database,
  params: { customerId: string; teamId: string },
): Promise<void> {
  await db
    .update(customers)
    .set({
      description: null,
      industry: null,
      companyType: null,
      employeeCount: null,
      foundedYear: null,
      estimatedRevenue: null,
      fundingStage: null,
      totalFunding: null,
      headquartersLocation: null,
      timezone: null,
      linkedinUrl: null,
      twitterUrl: null,
      instagramUrl: null,
      facebookUrl: null,
      ceoName: null,
      financeContact: null,
      financeContactEmail: null,
      primaryLanguage: null,
      fiscalYearEnd: null,
      enrichmentStatus: null,
      enrichedAt: null,
    })
    .where(
      and(
        eq(customers.id, params.customerId),
        eq(customers.teamId, params.teamId),
      ),
    );
}
