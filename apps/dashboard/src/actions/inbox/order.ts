"use server";

import { authActionClient } from "@/actions/safe-action";
import { inboxOrder } from "@/actions/schema";
import { Cookies } from "@/utils/constants";
import { addYears } from "date-fns";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export const inboxOrderAction = authActionClient
  .schema(inboxOrder)
  .metadata({
    name: "inbox-order",
  })
  .action(({ parsedInput: value }) => {
    cookies().set({
      name: Cookies.InboxOrder,
      value: value.toString(),
      expires: addYears(new Date(), 1),
    });

    revalidatePath("/inbox");

    return Promise.resolve(value);
  });
