"use server";

import { client } from "@midday/engine/client";
import { getSession } from "@midday/supabase/cached-queries";

export const createPlaidLinkTokenAction = async (accessToken?: string) => {
  const {
    data: { session },
  } = await getSession();

  const plaidResponse = await client.auth.plaid.link.$post({
    json: {
      userId: session?.user?.id,
      accessToken,
    },
  });

  if (!plaidResponse.ok) {
    throw new Error("Failed to create plaid link token");
  }

  const { data } = await plaidResponse.json();

  return data.link_token;
};
