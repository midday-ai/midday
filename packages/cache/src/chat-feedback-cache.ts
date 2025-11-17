import { RedisCache } from "./redis-client";

// No expiration - feedback is stored permanently
const feedbackCache = new RedisCache("chat:feedback", 0);

export interface ChatFeedback {
  type: "positive" | "negative" | "other";
  comment?: string;
  createdAt: string;
  userId: string;
  teamId: string;
  chatId: string;
  messageId: string;
}

export const chatFeedbackCache = {
  set: (
    chatId: string,
    messageId: string,
    userId: string,
    feedback: Omit<ChatFeedback, "chatId" | "messageId" | "userId">,
  ): Promise<void> => {
    const key = `${chatId}:${messageId}:${userId}`;
    const fullFeedback: ChatFeedback = {
      ...feedback,
      chatId,
      messageId,
      userId,
    };

    return feedbackCache.set(key, fullFeedback, 0);
  },

  delete: (
    chatId: string,
    messageId: string,
    userId: string,
  ): Promise<void> => {
    const key = `${chatId}:${messageId}:${userId}`;
    return feedbackCache.delete(key);
  },
};
