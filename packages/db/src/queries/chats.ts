import type { Database } from "@db/client";
import { chatMessages, chats } from "@db/schema";
import type { UIMessage } from "ai";
import { and, desc, eq } from "drizzle-orm";

export interface ChatWithMessages {
  id: string;
  teamId: string;
  userId: string;
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
  messages: UIMessage[];
}

export const createChat = async (
  db: Database,
  data: {
    id: string;
    teamId: string;
    userId: string;
    title?: string;
  },
) => {
  const [chat] = await db
    .insert(chats)
    .values({
      id: data.id,
      teamId: data.teamId,
      userId: data.userId,
      title: data.title || null,
    })
    .returning();

  return chat;
};

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

export const getChatWithMessages = async (
  db: Database,
  chatId: string,
  teamId: string,
): Promise<ChatWithMessages | null> => {
  const [chat] = await db
    .select()
    .from(chats)
    .where(and(eq(chats.id, chatId), eq(chats.teamId, teamId)))
    .limit(1);

  if (!chat) {
    return null;
  }

  const messages = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.chatId, chatId))
    .orderBy(chatMessages.createdAt);

  return {
    ...chat,
    messages,
  };
};

export const getChatsByTeam = async (
  db: Database,
  teamId: string,
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
    .where(eq(chats.teamId, teamId))
    .orderBy(desc(chats.updatedAt))
    .limit(limit);
};

export const saveChatMessage = async (
  db: Database,
  data: {
    id: string;
    chatId: string;
    role: "user" | "assistant" | "system";
    content: any; // UIMessage parts
  },
) => {
  const [message] = await db
    .insert(chatMessages)
    .values({
      id: data.id,
      chatId: data.chatId,
      role: data.role,
      content: data.content,
    })
    .returning();

  return message;
};

export const updateChatTitle = async (
  db: Database,
  chatId: string,
  title: string,
) => {
  const [chat] = await db
    .update(chats)
    .set({
      title,
      updatedAt: new Date(),
    })
    .where(eq(chats.id, chatId))
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
