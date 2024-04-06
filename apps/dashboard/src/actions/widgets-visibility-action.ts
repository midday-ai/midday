"use server";

import { Cookies } from "@/utils/constants";
import { addYears } from "date-fns";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { action } from "./safe-action";
import { widgetsVisibilitySchema } from "./schema";

export const widgetsVisibilityAction = action(
  widgetsVisibilitySchema,
  async (widgets) => {
    cookies().set({
      name: Cookies.Widgets,
      value: JSON.stringify(widgets),
      expires: addYears(new Date(), 1),
    });

    revalidatePath("/");
  }
);
