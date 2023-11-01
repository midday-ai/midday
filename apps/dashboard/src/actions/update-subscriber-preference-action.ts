"use server";

import { updateSubscriberPreference } from "@midday/notification";
import { revalidatePath as revalidatePathFunc } from "next/cache";
import { action } from "./safe-action";
import { updateSubscriberPreferenceSchema } from "./schema";

export const updateSubscriberPreferenceAction = action(
  updateSubscriberPreferenceSchema,
  async ({ revalidatePath, ...data }) => {
    const preference = await updateSubscriberPreference(data);

    revalidatePathFunc(revalidatePath);

    return preference;
  },
);
