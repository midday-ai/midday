import type { Database } from "@db/client";
import { chatFeedback } from "@db/schema";
import { and, desc, eq, sql } from "drizzle-orm";

export const createChatFeedback = async (
  db: Database,
  data: {
    chatId: string;
    messageId: string;
    teamId: string;
    userId: string;
    type: "positive" | "negative" | "other";
    comment?: string;
  },
) => {
  const [newFeedback] = await db
    .insert(chatFeedback)
    .values({
      chatId: data.chatId,
      messageId: data.messageId,
      teamId: data.teamId,
      userId: data.userId,
      type: data.type,
      comment: data.comment,
    })
    .returning();

  return newFeedback;
};
