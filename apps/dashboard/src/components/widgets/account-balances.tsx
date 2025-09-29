import { useTRPC } from "@/trpc/client";
import { formatAmount } from "@/utils/format";
import { Icons } from "@midday/ui/icons";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { BaseWidget } from "./base";
import { WIDGET_POLLING_CONFIG } from "./widget-config";

export function AccountBalancesWidget() {
  const trpc = useTRPC();
  const router = useRouter();

  // Fetch combined account balances
  const { data } = useQuery({
    ...trpc.widgets.getAccountBalances.queryOptions({}),
    ...WIDGET_POLLING_CONFIG,
  });

  const balanceData = data?.result;
  const totalBalance = balanceData?.totalBalance ?? 0;
  const currency = balanceData?.currency ?? "USD";
  const accountCount = balanceData?.accountCount ?? 0;

  const handleOpenAccounts = () => {
    router.push("/accounts");
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

  const getAccountTypeBreakdown = () => {
    if (!balanceData?.accountBreakdown) return null;

    // Group accounts by type and calculate totals
    const typeBreakdown = balanceData.accountBreakdown.reduce(
      (acc, account) => {
        const type = account.type;
        if (!acc[type]) {
          acc[type] = { count: 0, balance: 0 };
        }
        acc[type].count += 1;
        acc[type].balance += account.convertedBalance;
        return acc;
      },
      {} as Record<string, { count: number; balance: number }>,
    );

    // Get the primary account type (highest balance)
    const primaryType = Object.entries(typeBreakdown).sort(
      ([, a], [, b]) => b.balance - a.balance,
    )[0];

    if (!primaryType) return null;

    const [type, data] = primaryType;
    const typeLabel = type === "depository" ? "checking/savings" : type;

    if (data.count === 1) {
      return `${typeLabel} account`;
    }

    return `${data.count} ${typeLabel} accounts`;
  };

  return (
    <BaseWidget
      title="Account Balances"
      icon={<Icons.Accounts className="size-4" />}
      description={getDescription()}
      onClick={handleOpenAccounts}
      actions="View accounts"
    >
      <div className="space-y-1">
        <h2 className="text-2xl font-normal text-[24px]">
          {formatAmount({
            currency,
            amount: totalBalance,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}
        </h2>
      </div>
    </BaseWidget>
  );
}
