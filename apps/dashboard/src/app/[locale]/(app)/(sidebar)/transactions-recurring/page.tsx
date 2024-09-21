import { ErrorFallback } from "@/components/error-fallback";
import { TransactionsModal } from "@/components/modals/transactions-modal";
import { CreateTransactionSheet } from "@/components/sheets/create-transaction-sheet";
import { Table } from "@/components/tables/transactions";
import { NoAccounts } from "@/components/tables/transactions/empty-states";
import { Loading } from "@/components/tables/transactions/loading";
import { TransactionsActions } from "@/components/transactions-actions";
import { TransactionsSearchFilter } from "@/components/transactions-search-filter";
import { Cookies } from "@/utils/constants";
import {
  getCategories,
  getTeamBankAccounts,
  getTeamMembers,
  getUser,
} from "@midday/supabase/cached-queries";
import type { Metadata } from "next";
import { ErrorBoundary } from "next/dist/client/components/error-boundary";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { searchParamsCacheRecurring } from "./search-params";

/**
 * Metadata for the Recurring Transactions page.
 */
export const metadata: Metadata = {
  title: "Recurring Transactions | Midday",
};

/**
 * Recurring Transactions page component.
 * This component renders the main view for recurring transactions, including filters, table, and related actions.
 *
 * @param {Object} props - The component props.
 * @param {Record<string, string | string[] | undefined>} props.searchParams - The search parameters from the URL.
 * @returns {Promise<JSX.Element>} The rendered component.
 */
export default async function Transactions({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}): Promise<JSX.Element> {
  // Parse search parameters
  const {
    q: query,
    page,
    attachments,
    start,
    end,
    categories,
    assignees,
    statuses,
    recurring,
    accounts,
    sort: sortParam,
  } = searchParamsCacheRecurring.parse(searchParams);

  // Fetch necessary data concurrently
  const [accountsData, categoriesData, teamMembersData, userData] =
    await Promise.all([
      getTeamBankAccounts(),
      getCategories(),
      getTeamMembers(),
      getUser(),
    ]);

  // Construct filter object from search parameters
  const filter = {
    attachments,
    start,
    end,
    categories,
    assignees,
    statuses,
    recurring,
    accounts,
  };

  // Parse sort parameter
  const sort = Array.isArray(sortParam)
    ? sortParam[0]?.split(":")
    : sortParam?.split(":");
  const hideConnectFlow = cookies().has(Cookies.HideConnectFlow);

  const isEmpty = !accountsData?.data?.length;
  const loadingKey = JSON.stringify({
    page,
    filter,
    sort,
    query,
  });

  const defaultAccount = accountsData?.data?.[0];

  return (
    <>
      <div className="flex justify-between py-6">
        <PageHeader accountsCount={accountsData?.data?.length ?? 0} />
        <TransactionsSearchFilter
          placeholder="Search or type filter"
          categories={getCategoriesForFilter(categoriesData)}
          accounts={getAccountsForFilter(accountsData)}
          members={getMembersForFilter(teamMembersData)}
          hideRecurring={true}
        />
        <TransactionsActions isEmpty={isEmpty} />
      </div>

      {isEmpty ? (
        <EmptyState />
      ) : (
        <ErrorBoundary errorComponent={ErrorFallback}>
          <Suspense fallback={<Loading />} key={loadingKey}>
            <Table filter={filter} page={page} sort={sort} query={query} />
          </Suspense>
        </ErrorBoundary>
      )}

      <TransactionsModal defaultOpen={isEmpty && !hideConnectFlow} />
      <CreateTransactionSheet
        categories={categoriesData?.data}
        userId={userData?.data?.id ?? ""}
        accountId={defaultAccount?.id ?? ""}
        currency={defaultAccount?.currency ?? ""}
      />
    </>
  );
}

/**
 * Renders the header for the Recurring Transactions page.
 *
 * @param {Object} props - The component props.
 * @param {number} props.accountsCount - The number of linked accounts.
 * @returns {JSX.Element} The rendered header component.
 */
function PageHeader({ accountsCount }: { accountsCount: number }): JSX.Element {
  return (
    <div className="p-[2%] md:p-[4%]">
      <div className="mx-auto w-full">
        <div className="flex flex-row justify-between">
          <p className="text-base font-semibold leading-7 text-blue-600 md:pt-[5%]">
            Solomon AI
          </p>
        </div>
        <h2 className="mt-2 text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
          Recurring Transactions
        </h2>
        <p className="mt-6 text-lg leading-8 text-foreground/3">
          Detected recurring transactions across your accounts
        </p>
        <div>
          <h2 className="py-5 text-2xl font-bold tracking-tight">
            Overview{" "}
            <span className="ml-1 text-xs">
              {" "}
              {accountsCount} Linked Accounts
            </span>
          </h2>
        </div>
      </div>
    </div>
  );
}

/**
 * Renders the empty state when no transactions are available.
 *
 * @returns {JSX.Element} The rendered empty state component.
 */
function EmptyState(): JSX.Element {
  return (
    <div className="relative h-[calc(100vh-200px)] overflow-hidden">
      <NoAccounts />
      <Loading isEmpty />
    </div>
  );
}

/**
 * Prepares category data for the TransactionsSearchFilter component.
 *
 * @param {any} categoriesData - The raw categories data from the API.
 * @returns {Array<{slug: string, name: string} | {id: string, name: string, slug: string}>} An array of category objects for the filter.
 */
function getCategoriesForFilter(
  categoriesData: any,
): Array<
  { slug: string; name: string } | { id: string; name: string; slug: string }
> {
  const categories =
    categoriesData?.data?.map((category: any) => ({
      slug: category.slug,
      name: category.name,
    })) ?? [];

  return [
    ...categories,
    {
      id: "uncategorized",
      name: "Uncategorized",
      slug: "uncategorized",
    },
  ];
}

/**
 * Prepares account data for the TransactionsSearchFilter component.
 *
 * @param {any} accountsData - The raw accounts data from the API.
 * @returns {Array<{id: string, name: string, currency: string}>} An array of account objects for the filter.
 */
function getAccountsForFilter(
  accountsData: any,
): Array<{ id: string; name: string; currency: string }> {
  return (
    accountsData?.data?.map((account: any) => ({
      id: account.id,
      name: account.name ?? "",
      currency: account.currency ?? "",
    })) ?? []
  );
}

/**
 * Prepares team member data for the TransactionsSearchFilter component.
 *
 * @param {any} teamMembersData - The raw team members data from the API.
 * @returns {Array<{id: string, name: string}>} An array of team member objects for the filter.
 */
function getMembersForFilter(
  teamMembersData: any,
): Array<{ id: string; name: string }> {
  return (
    teamMembersData?.data?.map((member: any) => ({
      id: member?.user?.id ?? "",
      name: member.user?.full_name ?? "",
    })) ?? []
  );
}
