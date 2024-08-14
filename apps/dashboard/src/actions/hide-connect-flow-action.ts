"use server";

import { Cookies } from "@/utils/constants";
import { addYears } from "date-fns";
import { cookies } from "next/headers";
import { authActionClient } from "./safe-action";

export const hideConnectFlowAction = authActionClient
  .metadata({
    name: "hide-connect-flow",
  })
  .action(async () => {
    cookies().set({
      name: Cookies.HideConnectFlow,
      value: "true",
      expires: addYears(new Date(), 1),
    });
  });
