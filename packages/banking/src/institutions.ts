import { createHash } from "node:crypto";
import { env } from "./env";
import { EnableBankingApi } from "./providers/enablebanking/enablebanking-api";
import { GoCardLessApi } from "./providers/gocardless/gocardless-api";
import { PlaidApi } from "./providers/plaid/plaid-api";
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

/**
 * Extract domain from a URL for logo.dev fallback.
 * e.g. "https://www.wellsfargo.com/" -> "wellsfargo.com"
 */
function extractDomain(url: string): string | null {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

/**
 * Build a logo.dev URL for a given domain.
 * Used as fallback when Plaid doesn't return a logo.
 */
function getLogoDevURL(domain: string): string {
  return `https://img.logo.dev/${domain}?token=${env.LOGO_DEV_TOKEN}&format=png&size=256&retina=true`;
}

async function fetchPlaidInstitutions(): Promise<InstitutionRecord[]> {
  const api = new PlaidApi();
  const data = await api.getInstitutions();

  return data.map((institution) => {
    const hasLogo = !!institution.logo;
    const domain = institution.url ? extractDomain(institution.url) : null;

    let logo: string | null;
    let sourceLogo: string | null;

    if (hasLogo) {
      logo = getLogoURL(institution.institution_id);
      sourceLogo = institution.logo!;
    } else if (domain) {
      logo = getLogoURL(institution.institution_id);
      sourceLogo = getLogoDevURL(domain);
    } else {
      logo = null;
      sourceLogo = null;
    }

    return {
      id: institution.institution_id,
      name: institution.name,
      logo,
      sourceLogo,
      provider: "plaid" as const,
      countries: institution.country_codes as string[],
      availableHistory: null,
      maximumConsentValidity: null,
      popularity: 0,
      type: null,
    };
  });
}

async function fetchTellerInstitutions(): Promise<InstitutionRecord[]> {
  // Teller's /institutions endpoint is public and doesn't require mTLS
  const response = await fetch("https://api.teller.io/institutions");
  const data = (await response.json()) as { id: string; name: string }[];

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
