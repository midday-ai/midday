import {
  EnableBankingProvider,
  GoCardLessProvider,
  PlaidProvider,
  TellerProvider,
} from "@midday/banking";
import {
  disableInstitutions,
  getInstitutionIdsByProvider,
  upsertInstitutions,
  type CreateInstitutionParams,
} from "@midday/db/queries";
import type { Job } from "bullmq";
import type {
  InstitutionsSyncResult,
  InstitutionsSyncSchedulerPayload,
} from "../../schemas/institutions";
import { getDb } from "../../utils/db";
import { isProduction } from "../../utils/env";
import {
  fileExists,
  getPublicUrl,
  uploadInstitutionLogo,
} from "../../utils/storage";
import { BaseProcessor } from "../base";

type ProviderName = "gocardless" | "plaid" | "teller" | "enablebanking";

/**
 * Scheduled task that runs daily to sync institutions from all banking providers.
 * - Fetches institutions from Plaid, GoCardless, Teller, and EnableBanking
 * - Uploads new logos to R2
 * - Inserts new institutions and updates existing ones
 * - Disables institutions that are no longer available from providers
 */
export class SyncInstitutionsProcessor extends BaseProcessor<InstitutionsSyncSchedulerPayload> {
  async process(
    job: Job<InstitutionsSyncSchedulerPayload>,
  ): Promise<InstitutionsSyncResult> {
    // Only run in production
    if (!isProduction()) {
      this.logger.info(
        "Skipping institutions sync in non-production environment",
      );
      return {
        added: 0,
        updated: 0,
        disabled: 0,
        errors: 0,
        providers: {
          plaid: { added: 0, updated: 0, errors: 0 },
          gocardless: { added: 0, updated: 0, errors: 0 },
          teller: { added: 0, updated: 0, errors: 0 },
          enablebanking: { added: 0, updated: 0, errors: 0 },
        },
      };
    }

    const db = getDb();
    this.logger.info("Starting institutions sync");

    const result: InstitutionsSyncResult = {
      added: 0,
      updated: 0,
      disabled: 0,
      errors: 0,
      providers: {
        plaid: { added: 0, updated: 0, errors: 0 },
        gocardless: { added: 0, updated: 0, errors: 0 },
        teller: { added: 0, updated: 0, errors: 0 },
        enablebanking: { added: 0, updated: 0, errors: 0 },
      },
    };

    // Sync each provider
    await this.syncProvider("plaid", result, db);
    await this.syncProvider("gocardless", result, db);
    await this.syncProvider("teller", result, db);
    await this.syncProvider("enablebanking", result, db);

    this.logger.info("Institutions sync completed", result);

    return result;
  }

  private async syncProvider(
    providerName: ProviderName,
    result: InstitutionsSyncResult,
    db: ReturnType<typeof getDb>,
  ): Promise<void> {
    this.logger.info(`Syncing ${providerName} institutions`);

    try {
      // Get existing institution IDs for this provider
      const existingIds = await getInstitutionIdsByProvider(db, providerName);
      const existingIdsSet = new Set(existingIds);

      // Fetch institutions from provider
      const fetchedInstitutions = await this.fetchInstitutionsFromProvider(
        providerName,
      );
      const fetchedIdsSet = new Set(fetchedInstitutions.map((i) => i.id));

      this.logger.info(`Fetched ${fetchedInstitutions.length} institutions from ${providerName}`);

      // Find new institutions (not in existing)
      const newInstitutions = fetchedInstitutions.filter(
        (i) => !existingIdsSet.has(i.id),
      );

      // Find removed institutions (in existing but not in fetched)
      const removedIds = existingIds.filter((id) => !fetchedIdsSet.has(id));

      // Process new institutions - upload logos and prepare for insert
      const institutionsToUpsert: CreateInstitutionParams[] = [];

      for (const inst of fetchedInstitutions) {
        try {
          let logoUrl = inst.logoUrl;

          // If institution is new and has a logo source, upload it
          if (!existingIdsSet.has(inst.id) && inst.logoSource) {
            const logoExists = await fileExists(
              `institutions/${inst.id}.${inst.logoExtension || "jpg"}`,
            );

            if (!logoExists) {
              logoUrl = await uploadInstitutionLogo(
                inst.id,
                inst.logoSource,
                inst.logoExtension || "jpg",
              );
            } else {
              logoUrl = getPublicUrl(
                `institutions/${inst.id}.${inst.logoExtension || "jpg"}`,
              );
            }
          }

          institutionsToUpsert.push({
            id: inst.id,
            name: inst.name,
            logoUrl,
            countries: inst.countries,
            provider: providerName,
            popularity: inst.popularity ?? 0,
            availableHistory: inst.availableHistory,
            maximumConsentValidity: inst.maximumConsentValidity,
            type: inst.type,
            enabled: true,
          });
        } catch (error) {
          this.logger.error(`Failed to process institution ${inst.id}`, {
            error: error instanceof Error ? error.message : "Unknown error",
          });
          result.providers[providerName].errors++;
          result.errors++;
        }
      }

      // Upsert all institutions
      if (institutionsToUpsert.length > 0) {
        await upsertInstitutions(db, institutionsToUpsert);
        result.providers[providerName].added += newInstitutions.length;
        result.providers[providerName].updated +=
          institutionsToUpsert.length - newInstitutions.length;
        result.added += newInstitutions.length;
        result.updated += institutionsToUpsert.length - newInstitutions.length;
      }

      // Disable removed institutions
      if (removedIds.length > 0) {
        await disableInstitutions(db, removedIds);
        result.disabled += removedIds.length;
      }

      this.logger.info(`Completed syncing ${providerName}`, {
        added: newInstitutions.length,
        updated: institutionsToUpsert.length - newInstitutions.length,
        disabled: removedIds.length,
      });
    } catch (error) {
      this.logger.error(`Failed to sync ${providerName} institutions`, {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      result.providers[providerName].errors++;
      result.errors++;
    }
  }

  private async fetchInstitutionsFromProvider(
    providerName: ProviderName,
  ): Promise<
    Array<{
      id: string;
      name: string;
      logoUrl?: string | null;
      logoSource?: string | null;
      logoExtension?: string;
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
          logoSource: inst.logo,
          logoExtension: "jpg",
          countries: ["US", "CA"], // Plaid primarily supports US and CA
        }));
      }

      case "gocardless": {
        const provider = new GoCardLessProvider();
        // GoCardless requires country code, fetch for all supported countries
        const countries = [
          "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR",
          "DE", "GR", "HU", "IS", "IE", "IT", "LV", "LI", "LT", "LU",
          "MT", "NL", "NO", "PL", "PT", "RO", "SK", "SI", "ES", "SE", "GB",
        ];
        
        const allInstitutions: Map<string, {
          id: string;
          name: string;
          logoUrl?: string | null;
          logoSource?: string | null;
          logoExtension?: string;
          countries: string[];
          availableHistory?: number | null;
          maximumConsentValidity?: number | null;
        }> = new Map();

        for (const country of countries) {
          try {
            const institutions = await provider.getInstitutions({ countryCode: country });
            for (const inst of institutions) {
              if (allInstitutions.has(inst.id)) {
                // Add country to existing institution
                const existing = allInstitutions.get(inst.id)!;
                if (!existing.countries.includes(country)) {
                  existing.countries.push(country);
                }
              } else {
                allInstitutions.set(inst.id, {
                  id: inst.id,
                  name: inst.name,
                  logoUrl: inst.logo,
                  logoSource: inst.logo,
                  logoExtension: inst.logo?.split(".").pop() || "jpg",
                  countries: [country],
                });
              }
            }
          } catch (error) {
            this.logger.warn(`Failed to fetch GoCardless institutions for ${country}`, {
              error: error instanceof Error ? error.message : "Unknown error",
            });
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
          logoSource: inst.logo,
          logoExtension: "jpg",
          countries: ["US"], // Teller is US only
        }));
      }

      case "enablebanking": {
        const provider = new EnableBankingProvider();
        const institutions = await provider.getInstitutions({});
        return institutions.map((inst) => ({
          id: inst.id,
          name: inst.name,
          logoUrl: inst.logo,
          logoSource: inst.logo,
          logoExtension: "png",
          countries: [], // EnableBanking institutions don't have country in the standard response
        }));
      }

      default:
        return [];
    }
  }
}
