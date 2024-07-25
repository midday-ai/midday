"use server";

import { engine } from "@/utils/engine";
import { redirect } from "next/navigation";
import { authActionClient } from "../safe-action";
import { createGoCardLessLinkSchema } from "../schema";

export const createGoCardLessLinkAction = authActionClient
  .schema(createGoCardLessLinkSchema)
  .metadata({
    name: "create-gocardless-link",
  })
  .action(
    async ({
      parsedInput: {
        institutionId,
        availableHistory,
        redirectBase,
        step = "account",
      },
    }) => {
      await engine.institutions.usage.update(institutionId);

      const redirectTo = new URL(redirectBase);

      redirectTo.searchParams.append("step", step);
      redirectTo.searchParams.append("provider", "gocardless");

      const { data: agreementData } =
        await engine.auth.gocardless.agreement.create({
          institutionId,
          transactionTotalDays: availableHistory,
        });

      const { data } = await engine.auth.gocardless.link({
        agreement: agreementData.id,
        institutionId,
        redirect: redirectTo.toString(),
      });

      return redirect(data.link);
    },
  );
