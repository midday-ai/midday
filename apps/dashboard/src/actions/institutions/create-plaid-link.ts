"use server";

import { engine } from "@/utils/engine";
import { getSession } from "@midday/supabase/cached-queries";

export const createPlaidLinkTokenAction = async (accessToken?: string) => {
  const {
    data: { user },
  } = await getSession();

  const { data } = await engine.auth.plaid.link({
    userId: user.id,
    accessToken,
  });

  return data.link_token;
};
