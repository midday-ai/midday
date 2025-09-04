import type { Database } from "@db/client";
import { chats } from "@db/schema";
import type { UIMessage } from "ai";
import { and, desc, eq } from "drizzle-orm";

export const getChatById = async (
  db: Database,
  chatId: string,
  teamId: string,
) => {
  const [chat] = await db
    .select()
    .from(chats)
    .where(and(eq(chats.id, chatId), eq(chats.teamId, teamId)))
    .limit(1);

  return chat;
};

export const getChatsByTeam = async (
  db: Database,
  teamId: string,
  userId: string,
  limit = 50,
) => {
  return await db
    .select({
      id: chats.id,
      title: chats.title,
      createdAt: chats.createdAt,
      updatedAt: chats.updatedAt,
    })
    .from(chats)
    .where(and(eq(chats.teamId, teamId), eq(chats.userId, userId)))
    .orderBy(desc(chats.updatedAt))
    .limit(limit);
};

export const saveChat = async (
  db: Database,
  data: {
    chatId: string;
    messages: UIMessage[];
    teamId: string;
    userId: string;
  },
) => {
  const [chat] = await db
    .insert(chats)
    .values({
      id: data.chatId,
      teamId: data.teamId,
      userId: data.userId,
      messages: data.messages,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: chats.id,
      set: {
        messages: data.messages,
        updatedAt: new Date(),
      },
    })
    .returning();

  return chat;
};

export const updateChatTitle = async (
  db: Database,
  chatId: string,
  title: string,
  teamId: string,
) => {
  const [chat] = await db
    .update(chats)
    .set({
      title,
      updatedAt: new Date(),
    })
    .where(and(eq(chats.id, chatId), eq(chats.teamId, teamId)))
    .returning();

  return chat;
};

export const deleteChat = async (
  db: Database,
  chatId: string,
  teamId: string,
) => {
  await db
    .delete(chats)
    .where(and(eq(chats.id, chatId), eq(chats.teamId, teamId)));
};
