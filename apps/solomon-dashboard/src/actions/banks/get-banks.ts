"use server";

import { GoCardLessApi } from "@midday/providers/src/gocardless/gocardless-api";

type GetAccountParams = {
  countryCode: string;
};

export async function getBanks({ countryCode }: GetAccountParams) {
  const api = new GoCardLessApi();
  const data = await api.getBanks(countryCode);

  return data;
}
