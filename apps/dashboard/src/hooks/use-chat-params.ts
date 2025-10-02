import { useQueryState } from "nuqs";
import { createLoader, parseAsString } from "nuqs/server";

const chatParamsSchema = {
  chatId: parseAsString,
};

export function useChatParams() {
  const [chatId, setChatId] = useQueryState("chatId");

  return {
    chatId,
    setChatId,
  };
}

export const loadChatParams = createLoader(chatParamsSchema);
