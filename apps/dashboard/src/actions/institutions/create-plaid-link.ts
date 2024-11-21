"use server";

import { engine } from "@/utils/engine";
import { getSession } from "@midday/supabase/cached-queries";

export const createPlaidLinkTokenAction = async (accessToken?: string) => {
  const {
    data: { session },
  } = await getSession();

  const { data } = await engine.auth.plaid.link({
    userId: session?.user?.id,
    accessToken,
  });

  return data.link_token;
};
