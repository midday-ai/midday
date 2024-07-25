"use server";

import { engine } from "@/utils/engine";

export const exchangePublicToken = async (token: string) => {
  const { data } = await engine.auth.plaid.exchange({ token });

  return data.access_token;
};
