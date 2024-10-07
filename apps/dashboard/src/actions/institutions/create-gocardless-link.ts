"use server";

import { engine } from "@/utils/engine";
import { LogEvents } from "@midday/events/events";
import { nanoid } from "nanoid";
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
      ctx: { analytics, user },
    }) => {
      await engine.institutions.usage.update(institutionId);

      const reference = `${user.team_id}_${nanoid()}`;

      const redirectTo = new URL(redirectBase);

      redirectTo.searchParams.append("step", step);
      redirectTo.searchParams.append("provider", "gocardless");

      analytics.track({
        event: LogEvents.GoCardLessLinkCreated.name,
        institutionId,
        availableHistory,
        redirectBase,
        step,
        reference,
      });

      const { data: agreementData } =
        await engine.auth.gocardless.agreement.create({
          institutionId,
          transactionTotalDays: availableHistory,
          reference,
        });

      const { data } = await engine.auth.gocardless.link({
        agreement: agreementData.id,
        institutionId,
        redirect: redirectTo.toString(),
      });

      return redirect(data.link);
    },
  );
