import { useChatInterface } from "@/hooks/use-chat-interface";
import { useTRPC } from "@/trpc/client";
import { useChatActions, useChatId } from "@ai-sdk-tools/store";
import { Icons } from "@midday/ui/icons";
import { useQuery } from "@tanstack/react-query";
import { endOfMonth, startOfMonth, subMonths } from "date-fns";
import { BaseWidget } from "./base";

export function RunwayWidget() {
  const trpc = useTRPC();
  const { sendMessage } = useChatActions();
  const chatId = useChatId();
  const { setChatId } = useChatInterface();

  const { data } = useQuery(
    trpc.widgets.getRunway.queryOptions({
      from: subMonths(startOfMonth(new Date()), 12).toISOString(),
      to: endOfMonth(new Date()).toISOString(),
    }),
  );

  const handleToolCall = (params: {
    toolName: string;
    toolParams: Record<string, any>;
    text: string;
  }) => {
    if (!chatId) return;

    setChatId(chatId);

    sendMessage({
      role: "user",
      parts: [{ type: "text", text: params.text }],
      metadata: {
        toolCall: {
          toolName: params.toolName,
          toolParams: params.toolParams,
        },
      },
    });
  };

  return (
    <BaseWidget
      title="Cash Runway"
      icon={<Icons.Time className="size-4" />}
      description="Your cash runway in months"
      onClick={() => {
        handleToolCall({
          toolName: "getBurnRateAnalysis",
          toolParams: {
            from: subMonths(startOfMonth(new Date()), 12).toISOString(),
            to: endOfMonth(new Date()).toISOString(),
            currency: "USD",
          },
          text: "View burn rate",
        });
      }}
      actions="View burn rate"
    >
      <h2 className="text-2xl font-normal text-[24px] mb-2">
        {data?.result} months
      </h2>
    </BaseWidget>
  );
}
