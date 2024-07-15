"use server";

import { revalidatePath } from "next/cache";
import { actionClient } from "../safe-action";
import { assistantSettingsSchema } from "../schema";
import { getAssistantSettings, setAssistantSettings } from "./storage";

export const assistantSettingsAction = actionClient
  .schema(assistantSettingsSchema)
  .action(async ({ parsedInput }) => {
    const params = parsedInput;

    const settings = await getAssistantSettings();
    await setAssistantSettings({ settings, params });

    revalidatePath("/account/assistant");

    return params;
  });
