"use client";

import { getBackendClient } from "@/utils/backend";
import { AccountBalanceChart } from "@midday/ui/charts/financials";
import { useToast } from "@midday/ui/use-toast";
import {
  AccountBalanceHistory,
  GetAccountBalanceHistoryRequest,
} from "@solomon-ai/client-typescript-sdk";
import { useEffect, useState } from "react";

interface AccountBalanceChartProps
  extends React.HTMLAttributes<HTMLDivElement> {
  accountId: string;
  currency: string;
}

const BankAccountBalanceChart = ({
  accountId,
  currency,
  ...props
}: AccountBalanceChartProps) => {
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(100);
  const [accountBalance, setAccountBalance] =
    useState<Array<AccountBalanceHistory> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast, dismiss } = useToast();

  useEffect(() => {
    const fetchAccountBalance = async () => {
      setIsLoading(true);
      setError(null);
      const backendClient = getBackendClient();

      const req: GetAccountBalanceHistoryRequest = {
        plaidAccountId: accountId,
        pageNumber: pageNumber.toString(),
        pageSize: pageSize.toString(),
      };

      try {
        const result =
          await backendClient.financialServiceApi.getAccountBalanceHistory(req);
        setAccountBalance(result.accountBalanceHistory || []);
      } catch (error) {
        console.error(error);
        setError("Failed to fetch account balance history");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAccountBalance();
  }, [accountId, pageNumber, pageSize]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    toast({
      duration: 3500,
      variant: "error",
      title: "Something went wrong please try again.",
    });

    return <div />;
  }

  return (
    <div {...props}>
      {accountBalance ? (
        // Render your chart component here using the accountBalance data
        <div className="hidden md:block">
          <AccountBalanceChart
            data={accountBalance}
            currency={currency}
            height={500}
            className="p-1"
            hideTitle
            hideDescription
          />
        </div>
      ) : (
        <div>No account balance data available</div>
      )}
    </div>
  );
};

export default BankAccountBalanceChart;
