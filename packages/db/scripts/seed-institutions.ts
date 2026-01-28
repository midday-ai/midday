#!/usr/bin/env bun
/**
 * One-time script to seed institutions from all banking providers.
 * This script fetches institutions from Plaid, GoCardless, Teller, and EnableBanking,
 * uploads logos to R2, and inserts them into the PostgreSQL database.
 *
 * Run with: bun run packages/db/scripts/seed-institutions.ts
 */

import {
  EnableBankingProvider,
  GoCardLessProvider,
  PlaidProvider,
  TellerProvider,
} from "@midday/banking";
import { db } from "../src/client";
import { upsertInstitutions, type CreateInstitutionParams } from "../src/queries/institutions";

type ProviderName = "gocardless" | "plaid" | "teller" | "enablebanking";

type SeedResult = {
  provider: ProviderName;
  count: number;
  errors: number;
};

async function seedProvider(providerName: ProviderName): Promise<SeedResult> {
  console.log(`\nFetching institutions from ${providerName}...`);
  const result: SeedResult = { provider: providerName, count: 0, errors: 0 };

  try {
    const institutions = await fetchInstitutionsFromProvider(providerName);
    console.log(`  Found ${institutions.length} institutions`);

    // Prepare data for upsert
    const institutionsToUpsert: CreateInstitutionParams[] = institutions.map(
      (inst) => ({
        id: inst.id,
        name: inst.name,
        logoUrl: inst.logoUrl,
        countries: inst.countries,
        provider: providerName,
        popularity: inst.popularity ?? 0,
        availableHistory: inst.availableHistory,
        maximumConsentValidity: inst.maximumConsentValidity,
        type: inst.type,
        enabled: true,
      }),
    );

    // Upsert in batches
    const batchSize = 100;
    for (let i = 0; i < institutionsToUpsert.length; i += batchSize) {
      const batch = institutionsToUpsert.slice(i, i + batchSize);
      try {
        await upsertInstitutions(db, batch);
        result.count += batch.length;
        console.log(
          `  Upserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(institutionsToUpsert.length / batchSize)} (${batch.length} institutions)`,
        );
      } catch (error) {
        console.error(`  Error upserting batch:`, error);
        result.errors += batch.length;
      }
    }
  } catch (error) {
    console.error(`  Error fetching from ${providerName}:`, error);
    result.errors++;
  }

  return result;
}

async function fetchInstitutionsFromProvider(
  providerName: ProviderName,
): Promise<
  Array<{
    id: string;
    name: string;
    logoUrl?: string | null;
    countries: string[];
    popularity?: number;
    availableHistory?: number | null;
    maximumConsentValidity?: number | null;
    type?: "personal" | "business" | null;
  }>
> {
  switch (providerName) {
    case "plaid": {
      const provider = new PlaidProvider();
      const institutions = await provider.getInstitutions({});
      return institutions.map((inst) => ({
        id: inst.id,
        name: inst.name,
        logoUrl: inst.logo,
        countries: ["US", "CA"],
      }));
    }

    case "gocardless": {
      const provider = new GoCardLessProvider();
      const countries = [
        "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR",
        "DE", "GR", "HU", "IS", "IE", "IT", "LV", "LI", "LT", "LU",
        "MT", "NL", "NO", "PL", "PT", "RO", "SK", "SI", "ES", "SE", "GB",
      ];

      const allInstitutions: Map<
        string,
        {
          id: string;
          name: string;
          logoUrl?: string | null;
          countries: string[];
        }
      > = new Map();

      for (const country of countries) {
        try {
          console.log(`  Fetching GoCardless institutions for ${country}...`);
          const institutions = await provider.getInstitutions({
            countryCode: country,
          });
          for (const inst of institutions) {
            if (allInstitutions.has(inst.id)) {
              const existing = allInstitutions.get(inst.id)!;
              if (!existing.countries.includes(country)) {
                existing.countries.push(country);
              }
            } else {
              allInstitutions.set(inst.id, {
                id: inst.id,
                name: inst.name,
                logoUrl: inst.logo,
                countries: [country],
              });
            }
          }
        } catch (error) {
          console.warn(
            `  Failed to fetch GoCardless institutions for ${country}:`,
            error,
          );
        }
      }

      return Array.from(allInstitutions.values());
    }

    case "teller": {
      const provider = new TellerProvider();
      const institutions = await provider.getInstitutions({});
      return institutions.map((inst) => ({
        id: inst.id,
        name: inst.name,
        logoUrl: inst.logo,
        countries: ["US"],
      }));
    }

    case "enablebanking": {
      const provider = new EnableBankingProvider();
      const institutions = await provider.getInstitutions({});
      return institutions.map((inst) => ({
        id: inst.id,
        name: inst.name,
        logoUrl: inst.logo,
        countries: [], // EnableBanking doesn't provide country in standard response
      }));
    }

    default:
      return [];
  }
}

async function main() {
  console.log("Starting institution seed...\n");
  console.log("This will fetch institutions from all banking providers");
  console.log("and insert them into the PostgreSQL database.\n");

  const results: SeedResult[] = [];

  // Note: Teller requires mTLS certificates, so it may fail in local environments
  // without proper certificate setup
  const providers: ProviderName[] = [
    "plaid",
    "gocardless",
    // "teller", // Uncomment if you have Teller certificates configured
    "enablebanking",
  ];

  for (const provider of providers) {
    const result = await seedProvider(provider);
    results.push(result);
  }

  // Summary
  console.log("\n========================================");
  console.log("Seed Summary:");
  console.log("========================================");

  let totalCount = 0;
  let totalErrors = 0;

  for (const result of results) {
    console.log(`${result.provider}: ${result.count} institutions`);
    if (result.errors > 0) {
      console.log(`  (${result.errors} errors)`);
    }
    totalCount += result.count;
    totalErrors += result.errors;
  }

  console.log("----------------------------------------");
  console.log(`Total: ${totalCount} institutions`);
  if (totalErrors > 0) {
    console.log(`Total errors: ${totalErrors}`);
  }
  console.log("========================================\n");

  console.log("Seed completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
