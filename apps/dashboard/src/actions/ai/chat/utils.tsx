import { BotCard, BotMessage, UserMessage } from "@/components/chat/messages";
import type { Chat } from "../types";
import { BurnRateUI } from "./tools/ui/burn-rate-ui";
import { RunwayUI } from "./tools/ui/runway-ui";
import { SpendingUI } from "./tools/ui/spending-ui";

function getUIComponentFromMessage(message) {
  if (message.role === "user") {
    return <UserMessage>{message.content}</UserMessage>;
  }

  if (message.role === "assistant" && typeof message.content === "string") {
    return <BotMessage content={message.content} />;
  }

  if (message.role === "tool") {
    return message.content.map((tool) => {
      switch (tool.toolName) {
        case "runway": {
          return <RunwayUI {...tool.result} />;
        }

        case "burn_rate": {
          return <BurnRateUI {...tool.result} />;
        }

        case "get_spending": {
          return <SpendingUI {...tool.result} />;
        }
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
      id: `${aiState.id}-${index}`,
      display: getUIComponentFromMessage(message),
    }));
};
