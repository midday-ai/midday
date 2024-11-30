"use server";

import { client } from "@midday/engine/client";

export const exchangePublicToken = async (token: string) => {
  const plaidResponse = await client.auth.plaid.exchange.$post({
    json: { token },
  });

  if (!plaidResponse.ok) {
    throw new Error("Failed to exchange public token");
  }

  const { data } = await plaidResponse.json();

  return data;
};
