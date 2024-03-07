"use server";

import { GoCardLessApi } from "@midday/providers/src/gocardless/gocardless-api";
import { redirect } from "next/navigation";
import { action } from "../safe-action";
import { createEndUserAgreementSchema } from "../schema";

export const createEndUserAgreementAction = action(
  createEndUserAgreementSchema,
  async ({ institutionId, redirect: redirectTo }) => {
    const api = new GoCardLessApi();

    const data = await api.createEndUserAgreement(institutionId);

    const { link } = await api.buildLink({
      redirect: redirectTo,
      institutionId,
      agreement: data.id,
    });

    redirect(link);
  }
);
