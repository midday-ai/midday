"use server";

import { GoCardLessApi } from "@midday/providers/src/gocardless/gocardless-api";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { action } from "../safe-action";
import { createEndUserAgreementSchema } from "../schema";

export const createEndUserAgreementAction = action(
  createEndUserAgreementSchema,
  async ({ institutionId, transactionTotalDays, isDesktop }) => {
    const api = new GoCardLessApi();
    const headersList = headers();

    const domain = headersList.get("x-forwarded-host") || "";
    const protocol = headersList.get("x-forwarded-proto") || "";
    const pathname = headersList.get("x-invoke-path") || "";

    const data = await api.createEndUserAgreement({
      institutionId,
      transactionTotalDays,
    });

    const url = `${protocol}://${domain}`;
    const redirectBase = isDesktop ? "midday://" : url;
    const redirectTo = encodeURIComponent(
      `${redirectBase}/${pathname}?step=account&provider=gocardless`
    );

    const { link } = await api.buildLink({
      redirect: redirectTo,
      institutionId,
      agreement: data.id,
    });

    redirect(link);
  }
);
