import type { UIChatMessage } from "@api/ai/types";
import type { Database } from "@db/client";
import { chats } from "@db/schema";
import { and, desc, eq, ilike } from "drizzle-orm";

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
  search?: string,
) => {
  const baseConditions = [eq(chats.teamId, teamId), eq(chats.userId, userId)];

  if (search) {
    baseConditions.push(ilike(chats.title, `%${search}%`));
  }

  return await db
    .select({
      id: chats.id,
      title: chats.title,
      createdAt: chats.createdAt,
      updatedAt: chats.updatedAt,
    })
    .from(chats)
    .where(and(...baseConditions))
    .orderBy(desc(chats.updatedAt))
    .limit(limit);
};

export const saveChat = async (
  db: Database,
  data: {
    chatId: string;
    messages: UIChatMessage[];
    teamId: string;
    userId: string;
    title?: string | null;
  },
) => {
  const [chat] = await db
    .insert(chats)
    .values({
      id: data.chatId,
      teamId: data.teamId,
      userId: data.userId,
      messages: data.messages,
      title: data.title,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: chats.id,
      set: {
        messages: data.messages,
        ...(data.title && { title: data.title }),
        updatedAt: new Date(),
      },
    })
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
