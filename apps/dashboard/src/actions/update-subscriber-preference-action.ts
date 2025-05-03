"use server";

import { updateSubscriberPreference } from "@midday/notification";
import { revalidatePath as revalidatePathFunc } from "next/cache";
import { z } from "zod";
import { authActionClient } from "./safe-action";

export const updateSubscriberPreferenceAction = authActionClient
  .schema(
    z.object({
      templateId: z.string(),
      teamId: z.string(),
      revalidatePath: z.string(),
      subscriberId: z.string(),
      type: z.string(),
      enabled: z.boolean(),
    }),
  )
  .metadata({
    name: "update-subscriber-preference",
  })
  .action(async ({ parsedInput: { revalidatePath, ...data } }) => {
    const preference = await updateSubscriberPreference(data);

    revalidatePathFunc(revalidatePath);

    return preference;
  });
