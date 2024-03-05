"use server";

import { Provider } from "@midday/providers";

type GetAccountParams = {
  id: string;
  countryCode?: string;
  accessToken?: string;
  provider: "gocardless" | "teller" | "plaid";
};

export async function getAccounts({
  id,
  countryCode,
  provider,
  accessToken,
}: GetAccountParams) {
  const api = new Provider({ provider });

  const data = await api.getAccounts({
    id,
    countryCode,
    accessToken,
  });

  return data;
}
