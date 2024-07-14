import { GoCardLessApi } from "@/providers/gocardless/gocardless-api";
import { PlaidApi } from "@/providers/plaid/plaid-api";
import { getFileExtension } from "./utils";

const TELLER_ENDPOINT = "https://api.teller.io/institutions";

type TellerResponse = {
  id: string;
  name: string;
  capabilities: string[];
};

export async function getGoCardLessInstitutions() {
  const provider = new GoCardLessApi({
    // @ts-ignore
    envs: {
      GOCARDLESS_SECRET_ID: process.env.GOCARDLESS_SECRET_ID!,
      GOCARDLESS_SECRET_KEY: process.env.GOCARDLESS_SECRET_KEY!,
    },
  });

  const data = await provider.getInstitutions();

  return data.map((institution) => {
    const ext = getFileExtension(institution.logo);

    return {
      id: institution.id,
      name: institution.name,
      logo: `https://cdn-engine.midday.ai/${institution.id}.${ext}`,
      countries: institution.countries,
      available_history: institution.transaction_total_days,
      provider: "gocardless",
    };
  });
}

export async function getTellerInstitutions() {
  const response = await fetch(TELLER_ENDPOINT);

  const data: TellerResponse[] = await response.json();

  return data.map((institution) => ({
    id: institution.id,
    name: institution.name,
    logo: `https://cdn-engine.midday.ai/${institution.id}.jpg`,
    countries: ["US"],
    provider: "teller",
  }));
}

export async function getPlaidInstitutions() {
  const provider = new PlaidApi({
    // @ts-ignore
    envs: {
      PLAID_CLIENT_ID: process.env.PLAID_CLIENT_ID!,
      PLAID_SECRET: process.env.PLAID_SECRET!,
    },
  });

  const data = await provider.getInstitutions();

  return data.map((institution) => {
    return {
      id: institution.institution_id,
      name: institution.name,
      logo: institution.logo
        ? `https://cdn-engine.midday.ai/${institution.institution_id}.jpg`
        : null,
      countries: institution.country_codes,
      provider: "plaid",
    };
  });
}

export async function getInstitutions() {
  const data = await Promise.all([
    getGoCardLessInstitutions(),
    getTellerInstitutions(),
    getPlaidInstitutions(),
  ]);

  return data.flat();
}
