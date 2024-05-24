"use server";

import { revalidatePath } from "next/cache";
import { action } from "../safe-action";
import { assistantSettingsSchema } from "../schema";
import { getAssistantSettings, setAssistantSettings } from "./storage";

export const assistantSettingsAction = action(
  assistantSettingsSchema,
  async (params) => {
    const settings = await getAssistantSettings();
    await setAssistantSettings({ settings, params });

    revalidatePath("/account/assistant");

    return params;
  }
);
