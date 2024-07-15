"use server";

import Midday from "@midday-ai/engine";
import { authActionClient } from "../safe-action";
import { updateInstitutionUsageSchema } from "../schema";

const engine = new Midday();

export const updateInstitutionUsageAction = authActionClient
  .schema(updateInstitutionUsageSchema)
  .action(async ({ parsedInput: { institutionId } }) => {
    try {
      await engine.institutions.usage.update(institutionId);
    } catch (error) {
      console.log(error);

      throw Error("Something went wrong.");
    }
  });
