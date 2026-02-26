import type { Database } from "@db/client";
import { merchants } from "@db/schema";
import { and, eq } from "drizzle-orm";

export type MerchantForEnrichment = {
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

export type MerchantEnrichmentUpdateData = {
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

export type UpdateMerchantEnrichmentParams = {
  merchantId: string;
  teamId: string;
  data: MerchantEnrichmentUpdateData;
};

/**
 * Get merchant for enrichment with additional context
 */
export async function getMerchantForEnrichment(
  db: Database,
  params: { merchantId: string; teamId: string },
): Promise<MerchantForEnrichment | null> {
  const [result] = await db
    .select({
      id: merchants.id,
      name: merchants.name,
      website: merchants.website,
      teamId: merchants.teamId,
      // Additional context for LLM
      email: merchants.email,
      country: merchants.country,
      countryCode: merchants.countryCode,
      city: merchants.city,
      state: merchants.state,
      addressLine1: merchants.addressLine1,
      phone: merchants.phone,
      vatNumber: merchants.vatNumber,
      note: merchants.note,
      contact: merchants.contact,
    })
    .from(merchants)
    .where(
      and(
        eq(merchants.id, params.merchantId),
        eq(merchants.teamId, params.teamId),
      ),
    )
    .limit(1);

  return result ?? null;
}

/**
 * Update merchant enrichment status
 */
export async function updateMerchantEnrichmentStatus(
  db: Database,
  params: {
    merchantId: string;
    status: "pending" | "processing" | "completed" | "failed" | null;
  },
): Promise<void> {
  await db
    .update(merchants)
    .set({
      enrichmentStatus: params.status,
      ...(params.status === "completed"
        ? { enrichedAt: new Date().toISOString() }
        : {}),
    })
    .where(eq(merchants.id, params.merchantId));
}

/**
 * Update merchant with enrichment data
 * Only updates fields that are provided (non-undefined)
 */
export async function updateMerchantEnrichment(
  db: Database,
  params: UpdateMerchantEnrichmentParams,
): Promise<void> {
  const { merchantId, teamId, data } = params;

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
    .update(merchants)
    .set(updateData)
    .where(and(eq(merchants.id, merchantId), eq(merchants.teamId, teamId)));
}

/**
 * Mark merchant enrichment as failed
 */
export async function markMerchantEnrichmentFailed(
  db: Database,
  merchantId: string,
): Promise<void> {
  await db
    .update(merchants)
    .set({ enrichmentStatus: "failed" })
    .where(eq(merchants.id, merchantId));
}

/**
 * Get merchants that need enrichment (have website but not yet enriched)
 */
export async function getMerchantsNeedingEnrichment(
  db: Database,
  params: { teamId: string; limit?: number },
): Promise<MerchantForEnrichment[]> {
  return db
    .select({
      id: merchants.id,
      name: merchants.name,
      website: merchants.website,
      teamId: merchants.teamId,
      // Additional context for LLM
      email: merchants.email,
      country: merchants.country,
      countryCode: merchants.countryCode,
      city: merchants.city,
      state: merchants.state,
      addressLine1: merchants.addressLine1,
      phone: merchants.phone,
      vatNumber: merchants.vatNumber,
      note: merchants.note,
      contact: merchants.contact,
    })
    .from(merchants)
    .where(
      and(
        eq(merchants.teamId, params.teamId),
        eq(merchants.enrichmentStatus, "pending"),
      ),
    )
    .limit(params.limit ?? 50);
}

/**
 * Clear all enrichment data for a merchant
 */
export async function clearMerchantEnrichment(
  db: Database,
  params: { merchantId: string; teamId: string },
): Promise<void> {
  await db
    .update(merchants)
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
        eq(merchants.id, params.merchantId),
        eq(merchants.teamId, params.teamId),
      ),
    );
}
