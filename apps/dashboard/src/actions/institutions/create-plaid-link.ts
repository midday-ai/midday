"use server";

import Midday from "@midday-ai/engine";
import { getSession } from "@midday/supabase/cached-queries";

const engine = new Midday();

export const createPlaidLinkTokenAction = async () => {
  try {
    const {
      data: { session },
    } = await getSession();

    const { data } = await engine.auth.plaid.link({
      userId: session?.user.id,
    });

    return data.link_token;
  } catch (error) {
    console.log(error);

    throw Error("Something went wrong.");
  }
};
