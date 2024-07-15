"use server";

import Midday from "@midday-ai/engine";
import { redirect } from "next/navigation";
import { action } from "../safe-action";
import { createGoCardLessLinkSchema } from "../schema";

const engine = new Midday();

export const createGoCardLessLinkAction = action(
  createGoCardLessLinkSchema,
  async ({ institutionId, availableHistory, countryCode, redirectBase }) => {
    await engine.institutions.usage(institutionId);

    const redirectTo = new URL(redirectBase);

    redirectTo.searchParams.append("step", "account");
    redirectTo.searchParams.append("countryCode", countryCode);
    redirectTo.searchParams.append("provider", "gocardless");

    const { data: agreementData } = await engine.auth.gocardless.agreement({
      institution_id: institutionId,
      redirect: redirectTo.toString(),
    });

    const { data } = await engine.auth.gocardless.link({
      agreement: agreementData.id,
      institution_id: institutionId,
      redirect: redirectTo.toString(),
    });

    return redirect(data.link);
  },
);
