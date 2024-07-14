"use server";

import { Provider } from "@midday/providers";

type GetAccountParams = {
  id: string;
  countryCode?: string;
  accessToken?: string;
  institutionId?: string; // Plaid
  provider: "gocardless" | "teller" | "plaid";
};

export async function getAccounts({
  id,
  countryCode,
  provider,
  accessToken,
  institutionId,
}: GetAccountParams) {
  const api = new Provider({ provider });

  const data = await api.getAccounts({
    id,
    countryCode,
    accessToken,
    institutionId,
  });

  return data;
}
