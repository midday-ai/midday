"use server";

import Midday from "@midday-ai/engine";

const engine = new Midday();

export const exchangePublicToken = async (token: string) => {
  const { data } = await engine.auth.plaid.exchange({ token });

  return data.access_token;
};
