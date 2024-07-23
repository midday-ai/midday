"use server";

import { Cookies } from "@/utils/constants";
import { addYears } from "date-fns";
import { cookies } from "next/headers";
import { authActionClient } from "./safe-action";
import { updaterMenuSchema } from "./schema";

export const updateMenuAction = authActionClient
  .schema(updaterMenuSchema)
  .metadata({
    name: "update-menu",
  })
  .action(async ({ parsedInput: value }) => {
    cookies().set({
      name: Cookies.MenuConfig,
      value: JSON.stringify(value),
      expires: addYears(new Date(), 1),
    });

    return value;
  });
