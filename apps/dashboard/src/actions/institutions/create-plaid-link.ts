"use server";

import Midday from "@midday-ai/engine";
import { getSession } from "@midday/supabase/cached-queries";

const engine = new Midday();

export const createPlaidLinkTokenAction = async (accessToken?: string) => {
  const {
    data: { session },
  } = await getSession();

  const { data } = await engine.auth.plaid.link({
    userId: session?.user.id,
    accessToken,
  });

  return data.link_token;
};
