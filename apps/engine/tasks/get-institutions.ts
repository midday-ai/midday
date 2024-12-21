import { GoCardLessApi } from "@/providers/gocardless/gocardless-api";
import { PlaidApi } from "@/providers/plaid/plaid-api";
import { PluggyApi } from "@/providers/pluggy/pluggy-api";
import { getFileExtension, getLogoURL } from "@/utils/logo";
import { getPopularity, getTellerData, matchLogoURL, slugify } from "./utils";

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

  return data.map((institution) => {
    return {
      id: institution.institution_id,
      name: institution.name,
      logo: institution.logo
        ? getLogoURL(institution.institution_id)
        : matchLogoURL(institution.institution_id),
      countries: institution.country_codes,
      popularity: getPopularity(institution.institution_id),
      provider: "plaid",
    };
  });
}

export async function getPluggyInstitutions() {
  const provider = new PluggyApi({
    // @ts-ignore
    envs: {
      PLUGGY_CLIENT_ID: process.env.PLUGGY_CLIENT_ID!,
      PLUGGY_SECRET: process.env.PLUGGY_SECRET!,
    },
  });

  const data = await provider.getInstitutions({ countries: ["BR"] });

  return data.map((institution) => {
    const extension = getFileExtension(institution.imageUrl);

    return {
      id: institution.id.toString(),
      name: institution.name,
      logo: getLogoURL(slugify(institution.name), extension),
      countries: ["BR"],
      popularity: getPopularity(institution.id.toString()),
      provider: "pluggy",
    };
  });
}

export async function getInstitutions() {
  const data = await Promise.all([
    // getGoCardLessInstitutions(),
    // getTellerInstitutions(),
    // getPlaidInstitutions(),
    getPluggyInstitutions(),
  ]);

  return data.flat();
}
