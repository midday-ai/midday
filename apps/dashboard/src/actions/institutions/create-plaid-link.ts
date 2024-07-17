"use server";

import Midday from "@midday-ai/engine";
import { getSession } from "@midday/supabase/cached-queries";
import { z } from "zod";
import { authActionClient } from "../safe-action";

const engine = new Midday();

export const createPlaidLinkTokenAction = authActionClient
  .schema(
    z.object({
      routingNumber: z.string().optional(),
    }),
  )
  .action(async ({ parsedInput: { routingNumber } }) => {
    console.log(routingNumber);
    try {
      const {
        data: { session },
      } = await getSession();

      const { data } = await engine.auth.plaid.link({
        userId: session?.user.id,
        routingNumber,
        // institutionId
      });

      return data.link_token;
    } catch (error) {
      console.log(error);

      throw Error("Something went wrong.");
    }
  });
