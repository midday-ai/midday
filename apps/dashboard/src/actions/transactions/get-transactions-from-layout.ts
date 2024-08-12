"use server";

import { z } from "zod";
import { authActionClient } from "../safe-action";

export const getTransactionsFromLayout = authActionClient
  .schema(
    z.object({
      filePath: z.string(),
    }),
  )
  .metadata({
    name: "get-transactions-from-layout",
  })
  .action(async ({ parsedInput: params, ctx: { user } }) => {});
