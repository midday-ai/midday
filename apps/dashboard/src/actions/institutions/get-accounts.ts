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
  const { data } = await engine.accounts.list({
    id,
    provider,
    accessToken,
    institutionId,
  });

  return {
    data: data.sort((a, b) => b.balance.amount - a.balance.amount),
  };
}
