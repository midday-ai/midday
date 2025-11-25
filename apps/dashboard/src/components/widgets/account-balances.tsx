import { FormatAmount } from "@/components/format-amount";
import { useChatInterface } from "@/hooks/use-chat-interface";
import { useTRPC } from "@/trpc/client";
import { useChatActions, useChatId } from "@ai-sdk-tools/store";
import { Icons } from "@midday/ui/icons";
import { useQuery } from "@tanstack/react-query";
import { BaseWidget } from "./base";
import { WIDGET_POLLING_CONFIG } from "./widget-config";

export function AccountBalancesWidget() {
  const trpc = useTRPC();
  const { sendMessage } = useChatActions();
  const chatId = useChatId();
  const { setChatId } = useChatInterface();

  // Fetch combined account balances
  const { data } = useQuery({
    ...trpc.widgets.getAccountBalances.queryOptions({}),
    ...WIDGET_POLLING_CONFIG,
  });

  const balanceData = data?.result;
  const totalBalance = balanceData?.totalBalance ?? 0;
  const currency = balanceData?.currency ?? "USD";
  const accountCount = balanceData?.accountCount ?? 0;

  const handleToolCall = (params: {
    toolName: string;
    toolParams?: Record<string, any>;
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

  const handleOpenAccounts = () => {
    handleToolCall({
      toolName: "getAccountBalances",
      text: "Show account balances",
    });
  };

  const getDescription = () => {
    if (accountCount === 0) {
      return "No accounts connected";
    }

    if (accountCount === 1) {
      return "Combined balance from 1 account";
    }

    return `Combined balance from ${accountCount} accounts`;
  };

  return (
    <BaseWidget
      title="Account Balances"
      icon={<Icons.Accounts className="size-4" />}
      description={getDescription()}
      onClick={handleOpenAccounts}
      actions="View account balances"
    >
      {balanceData && (
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-normal">
            <FormatAmount
              currency={currency}
              amount={totalBalance}
              minimumFractionDigits={0}
              maximumFractionDigits={0}
            />
          </h2>
        </div>
      )}
    </BaseWidget>
  );
}
