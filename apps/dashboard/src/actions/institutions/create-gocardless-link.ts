"use server";

import Midday from "@midday-ai/engine";
import { redirect } from "next/navigation";
import { action } from "../safe-action";
import { createGoCardLessLinkSchema } from "../schema";

const engine = new Midday();

export const createGoCardLessLinkAction = action(
  createGoCardLessLinkSchema,
  async ({ institutionId, availableHistory, countryCode, redirectBase }) => {
    await engine.institutions.usage.update(institutionId);

    const redirectTo = new URL(redirectBase);

    redirectTo.searchParams.append("step", "account");
    redirectTo.searchParams.append("countryCode", countryCode);
    redirectTo.searchParams.append("provider", "gocardless");

    const { data: agreementData } =
      await engine.auth.gocardless.agreement.create({
        institution_id: institutionId,
        transactionTotalDays: availableHistory,
      });

    console.log(agreementData);

    const { data } = await engine.auth.gocardless.link({
      agreement: agreementData.id,
      institution_id: institutionId,
      redirect: redirectTo.toString(),
    });

    return redirect(data.link);
  },
);
