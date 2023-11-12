"use server";

import { getUser } from "@midday/supabase/cached-queries";
import { revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import { action } from "./safe-action";
import { changeTransactionsPeriodSchema } from "./schema";

export const changeTransactionsPeriodAction = action(
  changeTransactionsPeriodSchema,
  async (value) => {
    const user = await getUser();

    cookies().set({
      name: "transactions-period",
      value,
    });

    revalidateTag(`transactions_${user.data.team_id}`);

    return value;
  },
);
