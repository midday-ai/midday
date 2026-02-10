"use server";

import { addYears } from "date-fns";
import { cookies } from "next/headers";
import { Cookies } from "@/utils/constants";
import { authActionClient } from "./safe-action";

export const hideConnectFlowAction = authActionClient
  .metadata({
    name: "hide-connect-flow",
  })
  .action(async () => {
    (await cookies()).set({
      name: Cookies.HideConnectFlow,
      value: "true",
      expires: addYears(new Date(), 1),
    });
  });
