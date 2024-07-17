import { GoCardLessApi } from "@/providers/gocardless/gocardless-api";
import { PlaidApi } from "@/providers/plaid/plaid-api";
import {
  getFileExtension,
  getLogoURL,
  getPopularity,
  getTellerData,
  matchLogoURL,
} from "./utils";

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
      logo: getLogoURL(institution.id, ext),
      countries: institution.countries,
      available_history: institution.transaction_total_days,
      popularity: getPopularity(institution.id),
      provider: "gocardless",
    };
  });
}

export async function getTellerInstitutions() {
  const data = await getTellerData();

  return data.map((institution) => ({
    id: institution.id,
    name: institution.name,
    logo: getLogoURL(institution.id),
    countries: ["US"],
    popularity: getPopularity(institution.id) ?? 10, // Make Teller higher priority,
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

  console.log(data.length);

  return data.map((institution) => {
    return {
      id: institution.institution_id,
      name: institution.name,
      logo: institution.logo
        ? getLogoURL(institution.institution_id)
        : matchLogoURL(institution.institution_id),
      countries: institution.country_codes,
      popularity: getPopularity(institution.institution_id),
      routing_numbers: institution.routing_numbers,
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
