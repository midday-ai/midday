"use server";

import { action } from "@/actions/safe-action";
import { inboxOrder } from "@/actions/schema";
import { Cookies } from "@/utils/constants";
import { addYears } from "date-fns";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export const inboxOrderAction = action(inboxOrder, async (ascending) => {
  cookies().set({
    name: Cookies.InboxOrder,
    value: ascending.toString(),
    expires: addYears(new Date(), 1),
  });

  revalidatePath("/inbox");

  return ascending;
});
