import { createHash } from "node:crypto";
import { EnableBankingApi } from "./providers/enablebanking/enablebanking-api";
import { GoCardLessApi } from "./providers/gocardless/gocardless-api";
import { PlaidApi } from "./providers/plaid/plaid-api";
import { TellerApi } from "./providers/teller/teller-api";
import type { Providers } from "./types";
import { getFileExtension, getLogoURL } from "./utils/logo";

const TELLER_CDN = "https://teller.io/images/banks";

export type InstitutionRecord = {
  id: string;
  name: string;
  logo: string | null;
  sourceLogo: string | null;
  provider: Providers;
  countries: string[];
  availableHistory: number | null;
  maximumConsentValidity: number | null;
  popularity: number;
  type: string | null;
};

export type FetchInstitutionsResult = {
  institutions: InstitutionRecord[];
  errors: { provider: string; error: string }[];
  succeededProviders: Providers[];
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
      sourceLogo: institution.logo ?? null,
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
      sourceLogo: institution.logo ?? null,
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
    sourceLogo: institution.logo ?? null,
    provider: "plaid" as const,
    countries: institution.country_codes as string[],
    availableHistory: null,
    maximumConsentValidity: null,
    popularity: 0,
    type: null,
  }));
}

async function fetchTellerInstitutions(): Promise<InstitutionRecord[]> {
  const api = new TellerApi();
  const data = await api.getInstitutions();

  return data.map((institution) => ({
    id: institution.id,
    name: institution.name,
    logo: getLogoURL(institution.id),
    sourceLogo: `${TELLER_CDN}/${institution.id}.jpg`,
    provider: "teller" as const,
    countries: ["US"],
    availableHistory: null,
    maximumConsentValidity: null,
    popularity: 10,
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
    fetchTellerInstitutions(),
  ]);

  const institutions: InstitutionRecord[] = [];
  const errors: { provider: string; error: string }[] = [];
  const succeededProviders: Providers[] = [];
  const providers: Providers[] = [
    "enablebanking",
    "gocardless",
    "plaid",
    "teller",
  ];

  for (let i = 0; i < results.length; i++) {
    const result = results[i]!;
    if (result.status === "fulfilled") {
      institutions.push(...result.value);
      succeededProviders.push(providers[i]!);
    } else {
      errors.push({
        provider: providers[i]!,
        error: result.reason?.message ?? "Unknown error",
      });
    }
  }

  return { institutions, errors, succeededProviders };
}
