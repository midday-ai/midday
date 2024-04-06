"use server";

import { Cookies } from "@/utils/constants";
import { addYears } from "date-fns";
import { cookies } from "next/headers";
import { action } from "./safe-action";
import { updaterMenuSchema } from "./schema";

export const updateMenuAction = action(updaterMenuSchema, async (value) => {
  cookies().set({
    name: Cookies.MenuConfig,
    value: JSON.stringify(value),
    expires: addYears(new Date(), 1),
  });

  return value;
});
