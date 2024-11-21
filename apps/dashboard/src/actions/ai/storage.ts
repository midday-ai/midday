"use server";

import { client as RedisClient } from "@midday/kv";
import { getSession, getUser } from "@midday/supabase/cached-queries";
import type { Chat, SettingsResponse } from "./types";

export async function getAssistantSettings(): Promise<SettingsResponse> {
  const user = await getUser();

  const teamId = user?.data?.team_id;
  const userId = user?.data?.id;

  const defaultSettings: SettingsResponse = {
    enabled: true,
  };

  const settings = await RedisClient.get(
    `assistant:${teamId}:user:${userId}:settings`,
  );

  return {
    ...defaultSettings,
    ...(settings || {}),
  };
}

type SetAassistant = {
  settings: SettingsResponse;
  userId: string;
  teamId: string;
  params: {
    enabled?: boolean | undefined;
  };
};

export async function setAssistantSettings({
  settings,
  params,
  userId,
  teamId,
}: SetAassistant) {
  return RedisClient.set(`assistant:${teamId}:user:${userId}:settings`, {
    ...settings,
    ...params,
  });
}

export async function clearChats({
  teamId,
  userId,
}: { teamId: string; userId: string }) {
  const chats: string[] = await RedisClient.zrange(
    `chat:${teamId}:user:${userId}`,
    0,
    -1,
  );

  const pipeline = RedisClient.pipeline();

  for (const chat of chats) {
    pipeline.del(chat);
    pipeline.zrem(`chat:${teamId}:user:${userId}`, chat);
  }

  await pipeline.exec();
}

export async function getLatestChat() {
  const settings = await getAssistantSettings();
  if (!settings?.enabled) return null;

  const user = await getUser();

  const teamId = user?.data?.team_id;
  const userId = user?.data?.id;

  try {
    const chat: string[] = await RedisClient.zrange(
      `chat:${teamId}:user:${userId}`,
      0,
      1,
      {
        rev: true,
      },
    );

    const lastId = chat.at(0);

    if (lastId) {
      return RedisClient.hgetall(lastId);
    }
  } catch (error) {
    return null;
  }
}

export async function getChats() {
  const user = await getUser();

  const teamId = user?.data?.team_id;
  const userId = user?.data?.id;

  try {
    const pipeline = RedisClient.pipeline();
    const chats: string[] = await RedisClient.zrange(
      `chat:${teamId}:user:${userId}`,
      0,
      -1,
      {
        rev: true,
      },
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

  const userId = session?.user?.id;

  const chat = await RedisClient.hgetall<Chat>(`chat:${id}`);

  if (!chat || (userId && chat.userId !== userId)) {
    return null;
  }

  return chat;
}

export async function saveChat(chat: Chat) {
  const pipeline = RedisClient.pipeline();
  pipeline.hmset(`chat:${chat.id}`, chat);

  const chatKey = `chat:${chat.teamId}:user:${chat.userId}`;

  pipeline
    .zadd(chatKey, {
      score: Date.now(),
      member: `chat:${chat.id}`,
    })
    // Expire in 30 days
    .expire(chatKey, 2592000);

  await pipeline.exec();
}
