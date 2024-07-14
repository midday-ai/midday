"use server";

import Midday from "@midday-ai/engine";

type GetAccountParams = {
  countryCode: string;
  query?: string;
};

const engine = new Midday();

export async function getInstitutions({
  countryCode,
  query,
}: GetAccountParams) {
  return engine.institutions.list({
    countryCode,
    q: query,
  });
}
