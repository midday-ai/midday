"use server";

import { action } from "@/actions/safe-action";
import { inboxFilterSchema } from "@/actions/schema";
import { Cookies } from "@/utils/constants";
import { addYears } from "date-fns";
import { cookies } from "next/headers";

export const changeInboxFilterAction = action(
  inboxFilterSchema,
  async (status) => {
    cookies().set({
      name: Cookies.InboxFilter,
      value: status,
      expires: addYears(new Date(), 1),
    });

    return status;
  }
);
