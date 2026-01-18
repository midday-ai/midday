import { FormatAmount } from "@/components/format-amount";
import { useChatInterface } from "@/hooks/use-chat-interface";
import { useMetricsFilter } from "@/hooks/use-metrics-filter";
import { useI18n } from "@/locales/client";
import { useTRPC } from "@/trpc/client";
import { useChatActions, useChatId } from "@ai-sdk-tools/store";
import { Icons } from "@midday/ui/icons";
import { useQuery } from "@tanstack/react-query";
import { BaseWidget } from "./base";
import { WIDGET_POLLING_CONFIG } from "./widget-config";
import { WidgetSkeleton } from "./widget-skeleton";

export function AccountBalancesWidget() {
  const t = useI18n();
  const trpc = useTRPC();
  const { sendMessage } = useChatActions();
  const chatId = useChatId();
  const { setChatId } = useChatInterface();
  const { currency } = useMetricsFilter();

  // Fetch combined account balances
  const { data, isLoading } = useQuery({
    ...trpc.widgets.getAccountBalances.queryOptions({
      currency,
    }),
    ...WIDGET_POLLING_CONFIG,
  });

  if (isLoading) {
    return (
      <WidgetSkeleton
        title={t("widgets.account_balances.title")}
        icon={<Icons.Accounts className="size-4" />}
      />
    );
  }

  const balanceData = data?.result;
  const totalBalance = balanceData?.totalBalance ?? 0;
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
      return t("widgets.account_balances.no_accounts");
    }

    return `${accountCount} ${t("widgets.account_balances.accounts")}`;
  };

  return (
    <BaseWidget
      title={t("widgets.account_balances.title")}
      icon={<Icons.Accounts className="size-4" />}
      description={getDescription()}
      onClick={handleOpenAccounts}
      actions={t("widgets.account_balances.action")}
    >
      {balanceData && (
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-normal">
            <FormatAmount
              currency={currency || "USD"}
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
