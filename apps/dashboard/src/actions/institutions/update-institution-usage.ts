"use server";

import Midday from "@midday-ai/engine";
import { authActionClient } from "../safe-action";
import { updateInstitutionUsageSchema } from "../schema";

const engine = new Midday();

export const updateInstitutionUsageAction = authActionClient
  .schema(updateInstitutionUsageSchema)
  .action(async ({ parsedInput: { institutionId } }) => {
    return engine.institutions.usage.update(institutionId);
  });
