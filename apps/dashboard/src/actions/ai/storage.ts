import { client as RedisClient } from "@midday/kv";
import { getCountryCode, isEUCountry } from "@midday/location";
import { createClient } from "@midday/supabase/server";

type SettingsResponse = {
  provider: "openai" | "mistralai";
  enabled: boolean;
};

export async function getAssistantSettings(): Promise<SettingsResponse> {
  const supabase = createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const defaultSettings = {
    enabled: true,
    provider: isEUCountry(getCountryCode()) ? "mistralai" : "openai",
  };

  const userId = session?.user.id;
  const settings = await RedisClient.get(`assistant:user:${userId}:settings`);

  return {
    ...defaultSettings,
    ...settings,
  };
}

type SetAassistant = {
  settings: SettingsResponse;
  params: {
    provider?: "openai" | "mistralai" | undefined;
    enabled?: boolean | undefined;
  };
};

export async function setAssistantSettings({
  settings,
  params,
}: SetAassistant) {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const userId = session?.user.id;

  return RedisClient.set(`assistant:user:${userId}:settings`, {
    ...settings,
    ...params,
  });
}

export async function deleteHistory() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const userId = session?.user.id;

  return RedisClient.del(`assistant:user:${userId}:history`);
}

export async function getHistory() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const userId = session?.user.id;

  return RedisClient.get(`assistant:user:${userId}:history`);
}
