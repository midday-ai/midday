"use server";

import { engineClient } from "@/utils/engine-client";
import { getSession } from "@midday/supabase/cached-queries";

export const createPlaidLinkTokenAction = async (accessToken?: string) => {
  const {
    data: { session },
  } = await getSession();

  const plaidResponse = await engineClient.auth.plaid.link.$post({
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
