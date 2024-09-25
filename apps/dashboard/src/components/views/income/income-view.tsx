import { IncomeSection } from "@/components/cash-flow/income-section";
import { useIncomeViewStore } from "@/store/income-view";
import { getTeamBankAccounts, getUser } from "@midday/supabase/cached-queries";
import { UserTier } from "@midday/supabase/types";
import { startOfMonth, subMonths } from "date-fns";

/**
 * IncomeView Component
 *
 * This server component renders the income view section of the application.
 * It fetches user and account data, and provides this information to the IncomeSection component.
 *
 * @component
 * @async
 * @example
 * ```tsx
 * <IncomeView />
 * ```
 */
export default async function IncomeView() {
  // Fetch user data and team bank accounts
  const [user, accounts] = await Promise.all([
    getUser(),
    getTeamBankAccounts(),
  ]);

  const defaultDateRange = {
    from: subMonths(startOfMonth(new Date()), 12).toISOString(),
    to: new Date().toISOString(),
    period: "monthly",
  };

  const { period } = defaultDateRange;
  // Determine if there are any accounts
  const isEmpty = !accounts?.data?.length;

  // Set the user tier, defaulting to 'free' if not available
  const tier: UserTier = user?.data?.tier ?? "free";

  return (
    <IncomeSection
      isEmpty={isEmpty}
      accounts={accounts}
      user={user}
      tier={tier}
      value={{ ...defaultDateRange, period, type: "income" }}
      defaultValue={{ ...defaultDateRange, period, type: "income" }}
      description={`
                Effective income management is the lifeblood of any evolving business venture, serving as a critical determinant of profitability and financial resilience. In today's dynamic market landscape, astute entrepreneurs recognize that meticulous oversight and strategic adjustment of income streams are not merely beneficial—they are imperative.
            `}
      type="income"
    />
  );
}
