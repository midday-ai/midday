"use server";

import { engine } from "@/utils/engine";

type GetAccountParams = {
  countryCode: string;
  query?: string;
};

export async function getInstitutions({
  countryCode,
  query,
}: GetAccountParams) {
  return engine.institutions.list({
    countryCode,
    q: query,
  });
}
