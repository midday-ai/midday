"use server";

import { Cookies } from "@/utils/constants";
import { getUser } from "@midday/supabase/cached-queries";
import { addYears } from "date-fns";
import { revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import { action } from "./safe-action";
import { changeTransactionsPeriodSchema } from "./schema";

export const changeTransactionsPeriodAction = action(
  changeTransactionsPeriodSchema,
  async (value) => {
    const user = await getUser();

    cookies().set({
      name: Cookies.TransactionsPeriod,
      value,
      expires: addYears(new Date(), 1),
    });

    revalidateTag(`transactions_${user.data.team_id}`);

    return value;
  }
);
