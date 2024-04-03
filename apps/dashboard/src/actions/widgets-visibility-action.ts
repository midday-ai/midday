"use server";

import { Cookies } from "@/utils/constants";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { action } from "./safe-action";
import { widgetsVisibilitySchema } from "./schema";

export const widgetsVisibilityAction = action(
  widgetsVisibilitySchema,
  (widgets) => {
    cookies().set({
      name: Cookies.Widgets,
      value: JSON.stringify(widgets),
    });

    revalidatePath("/");
  }
);
