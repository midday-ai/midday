"use server";

import { actionClient } from "@/actions/safe-action";
import { inboxOrder } from "@/actions/schema";
import { Cookies } from "@/utils/constants";
import { addYears } from "date-fns";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export const inboxOrderAction = actionClient
  .schema(inboxOrder)
  .action(({ parsedInput }) => {
    cookies().set({
      name: Cookies.InboxOrder,
      value: parsedInput.toString(),
      expires: addYears(new Date(), 1),
    });

    revalidatePath("/inbox");

    return parsedInput;
  });
