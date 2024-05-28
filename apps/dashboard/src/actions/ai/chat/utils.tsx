import { BotMessage, UserMessage } from "@/components/chat/messages";
import type { Chat } from "../types";
import { BurnRateUI } from "./tools/ui/burn-rate-ui";

function getUIComponentFromMessage(message) {
  if (message.role === "user") {
    return <UserMessage>{message.content}</UserMessage>;
  }

  if (message.role === "assistant" && typeof message.content === "string") {
    return <BotMessage content={message.content} />;
  }

  if (message.role === "tool") {
    message.content.map((tool) => {
      switch (tool.toolName) {
        case "get_spending":
          return null;
        case "get_burn_rate":
          return <BurnRateUI {...tool.result} />;
        default:
          return null;
      }
    });
  }
}

export const getUIStateFromAIState = (aiState: Chat) => {
  return aiState?.messages
    .filter((message) => message.role !== "system")
    .map((message, index) => ({
      id: `${aiState.chatId}-${index}`,
      display: getUIComponentFromMessage(message),
    }));
};
