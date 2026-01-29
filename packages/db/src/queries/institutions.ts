import type { Database } from "@db/client";
import { institutions } from "@db/schema";
import { and, arrayContains, desc, eq, ilike, or, sql } from "drizzle-orm";

export type GetInstitutionsParams = {
  countryCode?: string;
  query?: string;
  provider?: "gocardless" | "plaid" | "teller" | "enablebanking";
  enabled?: boolean;
  limit?: number;
  offset?: number;
};

/**
 * Get institutions with full-text search support using pg_trgm.
 * Supports filtering by country, provider, and fuzzy name search.
 */
export async function getInstitutions(
  db: Database,
  params: GetInstitutionsParams = {},
) {
  const {
    countryCode,
    query,
    provider,
    enabled = true,
    limit = 50,
    offset = 0,
  } = params;

  const conditions = [];

  // Filter by enabled status
  if (enabled !== undefined) {
    conditions.push(eq(institutions.enabled, enabled));
  }

  // Filter by country code (array contains)
  if (countryCode) {
    conditions.push(arrayContains(institutions.countries, [countryCode]));
  }

  // Filter by provider
  if (provider) {
    conditions.push(eq(institutions.provider, provider));
  }

  // Fuzzy search by name using pg_trgm similarity
  if (query?.trim()) {
    conditions.push(
      sql`${institutions.name} ILIKE ${`%${query}%`}`,
    );
  }

  const results = await db
    .select()
    .from(institutions)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(
      // If query is provided, order by similarity score descending
      query
        ? sql`similarity(${institutions.name}, ${query}) DESC`
        : desc(institutions.popularity),
    )
    .limit(limit)
    .offset(offset);

  return results;
}

export type GetInstitutionByIdParams = {
  id: string;
};

/**
 * Get a single institution by ID.
 */
export async function getInstitutionById(
  db: Database,
  id: string,
) {
  const [result] = await db
    .select()
    .from(institutions)
    .where(eq(institutions.id, id))
    .limit(1);

  return result;
}

export type CreateInstitutionParams = {
  id: string;
  name: string;
  logoUrl?: string | null;
  countries: string[];
  provider: "gocardless" | "plaid" | "teller" | "enablebanking";
  popularity?: number;
  availableHistory?: number | null;
  maximumConsentValidity?: number | null;
  type?: "personal" | "business" | null;
  enabled?: boolean;
};

/**
 * Insert a new institution.
 */
export async function createInstitution(
  db: Database,
  params: CreateInstitutionParams,
) {
  const [result] = await db
    .insert(institutions)
    .values({
      id: params.id,
      name: params.name,
      logoUrl: params.logoUrl,
      countries: params.countries,
      provider: params.provider,
      popularity: params.popularity ?? 0,
      availableHistory: params.availableHistory,
      maximumConsentValidity: params.maximumConsentValidity,
      type: params.type,
      enabled: params.enabled ?? true,
    })
    .returning();

  return result;
}

export type UpdateInstitutionParams = {
  id: string;
  name?: string;
  logoUrl?: string | null;
  countries?: string[];
  popularity?: number;
  availableHistory?: number | null;
  maximumConsentValidity?: number | null;
  type?: "personal" | "business" | null;
  enabled?: boolean;
};

/**
 * Update an existing institution.
 */
export async function updateInstitution(
  db: Database,
  params: UpdateInstitutionParams,
) {
  const { id, ...data } = params;

  const [result] = await db
    .update(institutions)
    .set({
      ...data,
      updatedAt: sql`NOW()`,
    })
    .where(eq(institutions.id, id))
    .returning();

  return result;
}

/**
 * Disable institutions by IDs (soft delete).
 * Used when institutions are removed from provider.
 */
export async function disableInstitutions(
  db: Database,
  ids: string[],
) {
  if (ids.length === 0) return [];

  const results = await db
    .update(institutions)
    .set({
      enabled: false,
      updatedAt: sql`NOW()`,
    })
    .where(
      sql`${institutions.id} = ANY(${ids})`,
    )
    .returning();

  return results;
}

/**
 * Increment institution popularity (when selected by user).
 */
export async function incrementInstitutionPopularity(
  db: Database,
  id: string,
) {
  const [result] = await db
    .update(institutions)
    .set({
      popularity: sql`${institutions.popularity} + 1`,
      updatedAt: sql`NOW()`,
    })
    .where(eq(institutions.id, id))
    .returning();

  return result;
}

/**
 * Get all institution IDs for a specific provider.
 * Used for sync comparison.
 */
export async function getInstitutionIdsByProvider(
  db: Database,
  provider: "gocardless" | "plaid" | "teller" | "enablebanking",
  enabled = true,
) {
  const results = await db
    .select({ id: institutions.id })
    .from(institutions)
    .where(
      and(
        eq(institutions.provider, provider),
        eq(institutions.enabled, enabled),
      ),
    );

  return results.map((r) => r.id);
}

/**
 * Bulk insert institutions (for initial seed).
 * Uses ON CONFLICT to update existing records.
 */
export async function upsertInstitutions(
  db: Database,
  data: CreateInstitutionParams[],
) {
  if (data.length === 0) return [];

  const results = await db
    .insert(institutions)
    .values(
      data.map((item) => ({
        id: item.id,
        name: item.name,
        logoUrl: item.logoUrl,
        countries: item.countries,
        provider: item.provider,
        popularity: item.popularity ?? 0,
        availableHistory: item.availableHistory,
        maximumConsentValidity: item.maximumConsentValidity,
        type: item.type,
        enabled: item.enabled ?? true,
      })),
    )
    .onConflictDoUpdate({
      target: institutions.id,
      set: {
        name: sql`EXCLUDED.name`,
        logoUrl: sql`EXCLUDED.logo_url`,
        countries: sql`EXCLUDED.countries`,
        availableHistory: sql`EXCLUDED.available_history`,
        maximumConsentValidity: sql`EXCLUDED.maximum_consent_validity`,
        type: sql`EXCLUDED.type`,
        updatedAt: sql`NOW()`,
      },
    })
    .returning();

  return results;
}
