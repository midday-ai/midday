"use server";

import { engine } from "@/utils/engine";
import { authActionClient } from "../safe-action";
import { updateInstitutionUsageSchema } from "../schema";

export const updateInstitutionUsageAction = authActionClient
  .schema(updateInstitutionUsageSchema)
  .metadata({
    name: "update-institution-usage",
  })
  .action(async ({ parsedInput: { institutionId } }) => {
    return engine.institutions.usage.update(institutionId);
  });
