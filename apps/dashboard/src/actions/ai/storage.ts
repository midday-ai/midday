"use server";

import { client as RedisClient } from "@midday/kv";
import { getCountryCode, isEUCountry } from "@midday/location";
import { getSession } from "@midday/supabase/cached-queries";
import type { Chat, SettingsResponse } from "./types";

export async function getAssistantSettings(): Promise<SettingsResponse> {
  const {
    data: { session },
  } = await getSession();

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
  const {
    data: { session },
  } = await getSession();

  const userId = session?.user.id;

  return RedisClient.set(`assistant:user:${userId}:settings`, {
    ...settings,
    ...params,
  });
}

export async function clearChats() {
  const {
    data: { session },
  } = await getSession();

  const userId = session?.user.id;

  const chats: string[] = await RedisClient.zrange(
    `user:chat:${userId}`,
    0,
    -1
  );

  const pipeline = RedisClient.pipeline();

  for (const chat of chats) {
    pipeline.del(chat);
    pipeline.zrem(`user:chat:${userId}`, chat);
  }

  await pipeline.exec();
}

export async function getLatestChat() {
  const {
    data: { session },
  } = await getSession();

  const userId = session?.user.id;

  try {
    const chat: string[] = await RedisClient.zrange(
      `user:chat:${userId}`,
      0,
      1,
      {
        rev: true,
      }
    );

    return RedisClient.hgetall(chat.at(0));
  } catch (error) {
    return null;
  }
}

export async function getChats() {
  const {
    data: { session },
  } = await getSession();

  const userId = session?.user.id;

  try {
    const pipeline = RedisClient.pipeline();
    const chats: string[] = await RedisClient.zrange(
      `user:chat:${userId}`,
      0,
      -1,
      {
        rev: true,
      }
    );

    for (const chat of chats) {
      pipeline.hgetall(chat);
    }

    const results = await pipeline.exec();

    return results as Chat[];
  } catch (error) {
    return [];
  }
}

export async function getChat(id: string) {
  const {
    data: { session },
  } = await getSession();

  const userId = session?.user.id;

  const chat = await RedisClient.hgetall<Chat>(`chat:${id}`);

  if (!chat || (userId && chat.userId !== userId)) {
    return null;
  }

  return chat;
}

export async function saveChat(chat: Chat) {
  const pipeline = RedisClient.pipeline();
  pipeline.hmset(`chat:${chat.id}`, chat);

  const chatKey = `user:chat:${chat.userId}`;
  pipeline
    .zadd(chatKey, {
      score: Date.now(),
      member: `chat:${chat.id}`,
    })
    // Expire in 30 days
    .expire(chatKey, 2592000);

  await pipeline.exec();
}
