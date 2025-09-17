import { useChatParams } from "./use-chat-params";

export function useChatInterface() {
  const { chatId, setChatId } = useChatParams();

  const isHome = !chatId;
  const isChatPage = Boolean(chatId);

  return {
    isHome,
    isChatPage,
    chatId,
    setChatId,
  };
}
