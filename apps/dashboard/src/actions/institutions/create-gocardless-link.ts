"use server";

import Midday from "@midday-ai/engine";
import { redirect } from "next/navigation";
import { authActionClient } from "../safe-action";
import { createGoCardLessLinkSchema } from "../schema";

const engine = new Midday();

export const createGoCardLessLinkAction = authActionClient
  .schema(createGoCardLessLinkSchema)
  .action(
    async ({
      parsedInput: {
        institutionId,
        availableHistory,
        countryCode,
        redirectBase,
        step = "account",
      },
    }) => {
      try {
        await engine.institutions.usage.update(institutionId);

        const redirectTo = new URL(redirectBase);

        redirectTo.searchParams.append("step", step);
        redirectTo.searchParams.append("provider", "gocardless");

        if (countryCode) {
          redirectTo.searchParams.append("countryCode", countryCode);
        }

        const { data: agreementData } =
          await engine.auth.gocardless.agreement.create({
            institution_id: institutionId,
            transactionTotalDays: availableHistory,
          });

        const { data } = await engine.auth.gocardless.link({
          agreement: agreementData.id,
          institution_id: institutionId,
          redirect: redirectTo.toString(),
        });

        return redirect(data.link);
      } catch (error) {
        console.log(error);

        throw Error("Something went wrong.");
      }
    },
  );
