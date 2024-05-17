"use server";

import { Cookies } from "@/utils/constants";
import { cookies } from "next/headers";
import { z } from "zod";
import { action } from "./safe-action";

export const changeCountryCodeAction = action(z.string(), async (value) => {
  cookies().set({
    name: Cookies.CountryCode,
    value,
  });

  return value;
});
