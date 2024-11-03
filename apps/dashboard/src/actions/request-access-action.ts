"use server";

import { Cookies } from "@/utils/constants";
import { cookies } from "next/headers";
import { authActionClient } from "./safe-action";

export const requestAccessAction = authActionClient
  .metadata({
    name: "request-access",
  })
  .action(async () => {
    cookies().set(Cookies.RequestAccess, "true");

    return true;
  });
