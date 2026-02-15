import { createHash } from "node:crypto";
import { EnableBankingApi } from "./providers/enablebanking/enablebanking-api";
import { GoCardLessApi } from "./providers/gocardless/gocardless-api";
import { PlaidApi } from "./providers/plaid/plaid-api";
import { getFileExtension, getLogoURL } from "./utils/logo";

export type InstitutionRecord = {
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

export type FetchInstitutionsResult = {
  institutions: InstitutionRecord[];
  errors: { provider: string; error: string }[];
};

async function fetchEnableBankingInstitutions(): Promise<InstitutionRecord[]> {
  const api = new EnableBankingApi();
  const data = await api.getInstitutions();

  return data.flatMap((institution) => {
    const hashId = createHash("md5")
      .update(`${institution.name}-${institution.country}`)
      .digest("hex")
      .slice(0, 12);

    const logo = getLogoURL(encodeURIComponent(institution.name), "png");

    return (institution.psu_types ?? []).map((psuType: string) => ({
      id: psuType === "business" ? hashId : `${hashId}-personal`,
      name: institution.name,
      logo,
      provider: "enablebanking" as const,
      countries: [institution.country],
      availableHistory: null,
      maximumConsentValidity: institution.maximum_consent_validity ?? null,
      popularity: 10000,
      type: psuType,
    }));
  });
}

async function fetchGoCardLessInstitutions(): Promise<InstitutionRecord[]> {
  const api = new GoCardLessApi();
  const data = await api.getInstitutions();

  return data.map((institution) => {
    const ext = getFileExtension(institution.logo);

    return {
      id: institution.id,
      name: institution.name,
      logo: getLogoURL(institution.id, ext),
      provider: "gocardless" as const,
      countries: institution.countries,
      availableHistory: institution.transaction_total_days
        ? Number(institution.transaction_total_days)
        : null,
      maximumConsentValidity: null,
      popularity: 0,
      type: null,
    };
  });
}

async function fetchPlaidInstitutions(): Promise<InstitutionRecord[]> {
  const api = new PlaidApi();
  const data = await api.getInstitutions();

  return data.map((institution) => ({
    id: institution.institution_id,
    name: institution.name,
    logo: institution.logo ? getLogoURL(institution.institution_id) : null,
    provider: "plaid" as const,
    countries: institution.country_codes as string[],
    availableHistory: null,
    maximumConsentValidity: null,
    popularity: 0,
    type: null,
  }));
}

/**
 * Fetch institutions from all banking providers.
 * Each provider resolves its own env vars internally.
 * Returns both the fetched institutions and any errors that occurred.
 */
export async function fetchAllInstitutions(): Promise<FetchInstitutionsResult> {
  const results = await Promise.allSettled([
    fetchEnableBankingInstitutions(),
    fetchGoCardLessInstitutions(),
    fetchPlaidInstitutions(),
  ]);

  const institutions: InstitutionRecord[] = [];
  const errors: { provider: string; error: string }[] = [];
  const providers = ["enablebanking", "gocardless", "plaid"];

  for (let i = 0; i < results.length; i++) {
    const result = results[i]!;
    if (result.status === "fulfilled") {
      institutions.push(...result.value);
    } else {
      errors.push({
        provider: providers[i]!,
        error: result.reason?.message ?? "Unknown error",
      });
    }
  }

  return { institutions, errors };
}
