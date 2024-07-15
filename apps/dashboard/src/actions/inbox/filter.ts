"use server";

import { actionClient } from "@/actions/safe-action";
import { inboxFilterSchema } from "@/actions/schema";
import { Cookies } from "@/utils/constants";
import { addYears } from "date-fns";
import { cookies } from "next/headers";

export const changeInboxFilterAction = actionClient
  .schema(inboxFilterSchema)
  .action(({ parsedInput }) => {
    cookies().set({
      name: Cookies.InboxFilter,
      value: parsedInput,
      expires: addYears(new Date(), 1),
    });

    return parsedInput;
  });
