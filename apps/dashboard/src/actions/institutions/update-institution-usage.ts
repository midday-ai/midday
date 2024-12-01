"use server";

import { client } from "@midday/engine/client";
import { authActionClient } from "../safe-action";
import { updateInstitutionUsageSchema } from "../schema";

export const updateInstitutionUsageAction = authActionClient
  .schema(updateInstitutionUsageSchema)
  .metadata({
    name: "update-institution-usage",
  })
  .action(async ({ parsedInput: { institutionId } }) => {
    const usageResponse = await client.institutions[":id"].usage.$put({
      param: {
        id: institutionId,
      },
    });

    if (!usageResponse.ok) {
      throw new Error("Failed to update institution usage");
    }

    return usageResponse.json();
  });
