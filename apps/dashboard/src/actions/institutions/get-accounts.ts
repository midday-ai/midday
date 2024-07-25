"use server";

import { engine } from "@/utils/engine";

type GetAccountParams = {
  id?: string;
  accessToken?: string;
  institutionId?: string; // Plaid
  provider: "gocardless" | "teller" | "plaid";
};

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
