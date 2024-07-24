"use server";

import Midday from "@midday-ai/engine";

type GetAccountParams = {
  id?: string;
  accessToken?: string;
  institutionId?: string; // Plaid
  provider: "gocardless" | "teller" | "plaid";
};

const engine = new Midday();

export async function getAccounts({
  id,
  provider,
  accessToken,
  institutionId,
}: GetAccountParams) {
  return engine.accounts.list({
    id,
    provider,
    accessToken,
    institutionId,
  });
}
