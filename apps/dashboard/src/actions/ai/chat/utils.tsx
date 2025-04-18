import { BotMessage, UserMessage } from "@/components/chat/messages";
import type { Chat } from "../types";
import { BurnRateUI } from "./tools/ui/burn-rate-ui";
import { DocumentsUI } from "./tools/ui/documents-ui";
import { ProfitUI } from "./tools/ui/profit-ui";
import { ReportUI } from "./tools/ui/report-ui";
import { RevenueUI } from "./tools/ui/revenue-ui";
import { RunwayUI } from "./tools/ui/runway-ui";
import { SpendingUI } from "./tools/ui/spending-ui";
import { TransactionsUI } from "./tools/ui/transactions-ui";

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

function getUIComponentFromMessage(message) {
  if (message.role === "user") {
    return <UserMessage>{message.content}</UserMessage>;
  }

  if (message.role === "assistant" && typeof message.content === "string") {
    return <BotMessage content={message.content} />;
  }

  if (message.role === "tool") {
    return message.content.map((tool, idx) => {
      switch (tool.toolName) {
        case "getRunway": {
          return <RunwayUI {...tool.result} key={idx.toString()} />;
        }

        case "getBurnRate": {
          return <BurnRateUI {...tool.result} key={idx.toString()} />;
        }

        case "getSpending": {
          return <SpendingUI {...tool.result} key={idx.toString()} />;
        }

        case "getTransactions": {
          return <TransactionsUI {...tool.result} key={idx.toString()} />;
        }

        case "getDocuments": {
          return <DocumentsUI {...tool.result} key={idx.toString()} />;
        }

        case "createReport": {
          return <ReportUI {...tool.result} key={idx.toString()} />;
        }

        case "getProfit": {
          return <ProfitUI {...tool.result} key={idx.toString()} />;
        }

        case "getRevenue": {
          return <RevenueUI {...tool.result} key={idx.toString()} />;
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
