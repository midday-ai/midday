import * as React from "react";
import { AccountBalanceHistory } from "client-typescript-sdk";
import { cn } from "../../../utils/cn";
import { Card, CardHeader, CardTitle } from "../../card";
import { AccountBalanceChart } from "../../charts/financials/account-balance";

export interface AccountBalanceOverTimeCardProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /*
   * The account balance history data for the account.
   *
   * @type {Array<AccountBalanceHistory>}
   * @memberOf AccountBalanceOverTimeCardProps
   * */
  accountBalanceHistory: Array<AccountBalanceHistory>;
  className?: string;
}

/**
 * `AccountBalanceOverTimeCard` renders a card component displaying the historical account balance
 * of a given bank account identified by `plaidAccountId`.
 *
 * It fetches the account's balance history data using `useGetAccountBalanceHistoryQuery` and
 * displays it using `HistoricalAccountBalanceChart`. The component shows a spinner while the data
 * is loading, an error message if the data fetching fails, and a message prompting the user to wait
 * if the data is still being fetched.
 *
 * @param props - The props for the component.
 * @param props.accountBalanceHistory - The account balance history data for the account.
 * @returns A React functional component that displays the historical balance of a bank account.
 */
export const AccountBalanceOverTimeCard: React.FC<
  AccountBalanceOverTimeCardProps
> = ({ accountBalanceHistory, className }) => {
  if (accountBalanceHistory.length === 0) {
    return (
      <div className={cn("p-[1%]", className)}>
        <Card className="py-2">
          <CardHeader>
            <CardTitle>We are still pulling in your data!</CardTitle>
            <p>Sit tight and relax. We are still pulling in your data.</p>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("p-[1%]", className)}>
      <AccountBalanceChart data={accountBalanceHistory} currency={"USD"} />
    </div>
  );
};
