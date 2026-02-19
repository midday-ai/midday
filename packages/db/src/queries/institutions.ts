import { and, arrayContains, eq, inArray, notInArray, sql } from "drizzle-orm";
import type { Database, DatabaseOrTransaction } from "../client";
import { type bankProvidersEnum, institutions } from "../schema";

const excludedInstitutions = [
  "ins_56", // Chase - Plaid
];

type BankProvider = (typeof bankProvidersEnum.enumValues)[number];

export type GetInstitutionsParams = {
  countryCode: string;
  q?: string;
  limit?: number;
  excludeProviders?: BankProvider[];
};

export async function getInstitutions(
  db: Database,
  params: GetInstitutionsParams,
) {
  const { countryCode, q, limit = 50, excludeProviders } = params;

  const conditions = [
    eq(institutions.status, "active"),
    arrayContains(institutions.countries, [countryCode]),
  ];

  if (excludedInstitutions.length > 0) {
    conditions.push(notInArray(institutions.id, excludedInstitutions));
  }

  if (excludeProviders && excludeProviders.length > 0) {
    conditions.push(notInArray(institutions.provider, excludeProviders));
  }

  const hasSearch = q && q !== "*";

  if (hasSearch) {
    conditions.push(
      sql`(
        ${institutions.name} ILIKE ${`%${q}%`}
        OR word_similarity(${q}, ${institutions.name}) > 0.3
      )`,
    );
  }

  return db
    .select({
      id: institutions.id,
      name: institutions.name,
      logo: institutions.logo,
      popularity: institutions.popularity,
      availableHistory: institutions.availableHistory,
      maximumConsentValidity: institutions.maximumConsentValidity,
      provider: institutions.provider,
      type: institutions.type,
      countries: institutions.countries,
    })
    .from(institutions)
    .where(and(...conditions))
    .orderBy(
      ...(hasSearch
        ? [
            sql`word_similarity(${q}, ${institutions.name}) DESC`,
            sql`${institutions.popularity} DESC`,
          ]
        : [sql`${institutions.popularity} DESC`]),
    )
    .limit(limit);
}

export type GetInstitutionByIdParams = {
  id: string;
};

export async function getInstitutionById(
  db: Database,
  params: GetInstitutionByIdParams,
) {
  const [result] = await db
    .select()
    .from(institutions)
    .where(eq(institutions.id, params.id))
    .limit(1);

  return result ?? null;
}

export type UpdateInstitutionUsageParams = {
  id: string;
};

export async function updateInstitutionUsage(
  db: Database,
  params: UpdateInstitutionUsageParams,
) {
  const [result] = await db
    .update(institutions)
    .set({
      popularity: sql`${institutions.popularity} + 1`,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(institutions.id, params.id))
    .returning();

  return result ?? null;
}

// --- Sync operations ---

export type UpsertInstitutionData = {
  id: string;
  name: string;
  logo: string | null;
  provider: "gocardless" | "plaid" | "teller" | "enablebanking";
  countries: string[];
  availableHistory: number | null;
  maximumConsentValidity: number | null;
  popularity: number;
  type: string | null;
};

export async function upsertInstitutions(
  db: DatabaseOrTransaction,
  data: UpsertInstitutionData[],
  batchSize = 500,
): Promise<number> {
  let total = 0;

  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);

    const result = await db
      .insert(institutions)
      .values(
        batch.map((inst) => ({
          id: inst.id,
          name: inst.name,
          logo: inst.logo,
          provider: inst.provider,
          countries: inst.countries,
          availableHistory: inst.availableHistory,
          maximumConsentValidity: inst.maximumConsentValidity,
          popularity: inst.popularity,
          type: inst.type,
          status: "active" as const,
          updatedAt: new Date().toISOString(),
        })),
      )
      .onConflictDoUpdate({
        target: institutions.id,
        set: {
          name: sql`excluded.name`,
          logo: sql`excluded.logo`,
          countries: sql`excluded.countries`,
          availableHistory: sql`excluded.available_history`,
          maximumConsentValidity: sql`excluded.maximum_consent_validity`,
          type: sql`excluded.type`,
          status: sql`'active'`,
          updatedAt: new Date().toISOString(),
        },
      })
      .returning({ id: institutions.id });

    total += result.length;
  }

  return total;
}

export async function getActiveInstitutionIds(
  db: DatabaseOrTransaction,
  providers?: BankProvider[],
): Promise<string[]> {
  const conditions = [eq(institutions.status, "active")];

  if (providers && providers.length > 0) {
    conditions.push(inArray(institutions.provider, providers));
  }

  const results = await db
    .select({ id: institutions.id })
    .from(institutions)
    .where(and(...conditions));

  return results.map((r) => r.id);
}

export async function markInstitutionsRemoved(
  db: DatabaseOrTransaction,
  ids: string[],
): Promise<number> {
  if (ids.length === 0) return 0;

  const result = await db
    .update(institutions)
    .set({
      status: "removed",
      updatedAt: new Date().toISOString(),
    })
    .where(inArray(institutions.id, ids))
    .returning({ id: institutions.id });

  return result.length;
}
