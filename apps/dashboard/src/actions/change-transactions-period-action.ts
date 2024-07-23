"use server";

import { Cookies } from "@/utils/constants";
import { addYears } from "date-fns";
import { revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import { authActionClient } from "./safe-action";
import { changeTransactionsPeriodSchema } from "./schema";

export const changeTransactionsPeriodAction = authActionClient
  .schema(changeTransactionsPeriodSchema)
  .metadata({
    name: "change-transactions-period",
  })
  .action(async ({ parsedInput: value, ctx: { user } }) => {
    cookies().set({
      name: Cookies.TransactionsPeriod,
      value,
      expires: addYears(new Date(), 1),
    });

    revalidateTag(`transactions_${user.team_id}`);

    return value;
  });
