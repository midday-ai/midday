"use server";

import Midday from "@midday-ai/engine";
import { redirect } from "next/navigation";
import { action } from "../safe-action";
import { createAuthLinkSchema } from "../schema";

const engine = new Midday();

export const createAuthLinkAction = action(
  createAuthLinkSchema,
  async ({ institutionId, availableHistory, countryCode, redirectBase }) => {
    console.log(await engine.institutions.usage());
    // const data = await api.createAuthLink({
    //   institutionId,
    //   availableHistory,
    // });
    // const redirectTo = `${redirectBase}/${pathname}?step=account&countryCode=${countryCode}&provider=gocardless`;
    // const { link } = await api.buildLink({
    //   redirect: redirectTo,
    //   institutionId,
    //   agreement: data.id,
    // });
    // redirect(link);
  },
);
