import { columns } from "@/components/tables/transactions/columns";
import { DataTable } from "@/components/tables/transactions/data-table";
import { NoResults } from "@/components/tables/transactions/empty-states";
import { Cookies } from "@/utils/constants";
import { getRecentTransactions } from "@midday/supabase/cached-queries";
import {
  GetRecentTransactionsParams,
  RecurringTransactionFrequency,
} from "@midday/supabase/queries";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@midday/ui/accordion";
import { Card, CardFooter } from "@midday/ui/card";
import { cn } from "@midday/ui/cn";
import { format } from "date-fns";
import { cookies } from "next/headers";
import { TransactionAnalytics } from "./bank-account/transaction-analytics";

/**
 * Props for the RecentTransactions component.
 * @interface RecentTransactionsProps
 * @extends {React.HTMLAttributes<HTMLDivElement>}
 */
interface RecentTransactionsProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The maximum number of transactions to fetch (optional) */
  limit?: number;
  /** The ID of the account to filter transactions (optional) */
  accountId?: string;
  /** The frequency of recurring transactions to filter (optional) */
  recurringTransactionFrequency?: RecurringTransactionFrequency;
  title: string;
  description: string;
  className?: string;
}

/**
 * RecentTransactions component displays a table of recent transactions with pagination.
 *
 * @async
 * @param {RecentTransactionsProps} props - The component props
 * @param {number} [props.limit] - The maximum number of transactions to fetch
 * @param {string} [props.accountId] - The ID of the account to filter transactions
 * @param {RecurringTransactionFrequency} [props.recurringTransactionFrequency] - The frequency of recurring transactions to filter
 * @returns {Promise<JSX.Element>} A Promise that resolves to the rendered component
 */
const RecentTransactions: React.FC<RecentTransactionsProps> = async ({
  limit = 15,
  accountId,
  recurringTransactionFrequency,
  title,
  description,
  className,
}) => {
  // Retrieve the initial column visibility settings from cookies
  const initialColumnVisibility = JSON.parse(
    cookies().get(Cookies.TransactionsColumns)?.value || "[]",
  );

  // Fetch recent transactions based on the provided parameters
  // NOTE: the query auto handler querying the transactions from the proper team id
  const transactions = await getRecentTransactions({
    limit,
    accountId,
    recurring: recurringTransactionFrequency,
  });

  const { data } = transactions ?? {};

  /**
   * Server action to load more transactions.
   * @async
   * @param {{ from: number; to: number }} params - Pagination parameters
   * @returns {Promise<GetRecentTransactionsParams>} A Promise that resolves to the new transaction data
   */
  async function loadMore() {
    "use server";
    return getRecentTransactions({
      limit: (limit ?? 15) + 10,
      accountId,
      recurring: recurringTransactionFrequency,
    });
  }

  // If no transactions are found, display the NoResults component
  if (!data?.length || !transactions) {
    return (
      <NoResults hasFilters={recurringTransactionFrequency !== undefined} />
    );
  }

  // Format the dates
  const formatDate = (date: string) => {
    return format(new Date(date), "MMMM d, yyyy");
  };

  // NOTE: the last transaction is the most recent (meaning higher date)
  const lastTransactionDate = formatDate(data[0].date);
  const firstTransactionDate = formatDate(data[data.length - 1].date);
  const dateRange = `${firstTransactionDate} - ${lastTransactionDate}`;

  // Render the DataTable component with the fetched transactions
  return (
    <Card
      className={cn("min-h-[530px] overflow-y-auto scrollbar-hide", className)}
    >
      <div className="p-[2%]">
        <div className="mx-auto w-full">
          <h2 className="mt-2 text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
            {title}
            <span className="ml-1 text-xs">{data?.length} transactions</span>
          </h2>
          <p className="mt-6 text-lg leading-8 text-foreground/3">
            {description}
          </p>
        </div>
      </div>
      <div className="p-[2%]">
        <Accordion type="single" collapsible>
          <AccordionItem value="analytics">
            <AccordionTrigger className="text-3xl font-bold mb-4">
              Transaction Details
            </AccordionTrigger>
            <AccordionContent>
              <TransactionAnalytics transactions={data ?? []} />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
      <DataTable
        data={data ?? []}
        loadMore={loadMore}
        columns={columns}
        pageSize={0}
        meta={{}}
        initialColumnVisibility={initialColumnVisibility}
      />
      <CardFooter className="p-[2%]">
        <div className="flex flex-row justify-between">
          <p className="text-base font-semibold leading-7 text-foreground md:pt-[5%]">
            Transactions spanning {dateRange}
          </p>
        </div>
      </CardFooter>
    </Card>
  );
};

export default RecentTransactions;
