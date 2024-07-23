"use server";

import { revalidatePath } from "next/cache";
import { authActionClient } from "../safe-action";
import { assistantSettingsSchema } from "../schema";
import { getAssistantSettings, setAssistantSettings } from "./storage";

export const assistantSettingsAction = authActionClient
  .schema(assistantSettingsSchema)
  .metadata({
    name: "assistant-settings",
  })
  .action(async ({ parsedInput }) => {
    const params = parsedInput;

    const settings = await getAssistantSettings();
    await setAssistantSettings({ settings, params });

    revalidatePath("/account/assistant");

    return params;
  });
