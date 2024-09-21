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

export const metadata: Metadata = {
  title: "Transactions | Midday",
};

export default async function Transactions({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
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
  } = searchParamsCacheRecurring.parse(searchParams);

  // Move this in a suspense
  const [accountsData, categoriesData, teamMembersData, userData] =
    await Promise.all([
      getTeamBankAccounts(),
      getCategories(),
      getTeamMembers(),
      getUser(),
    ]);

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

  const sort = searchParams?.sort?.split(":");
  const hideConnectFlow = cookies().has(Cookies.HideConnectFlow);

  const isOpen = Boolean(searchParams.step);
  const isEmpty = !accountsData?.data?.length && !isOpen;
  const loadingKey = JSON.stringify({
    page,
    filter,
    sort,
    query,
  });

  return (
    <>
      <div className="flex justify-between py-6">
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
                  {accountsData?.data?.length} Linked Accounts
                </span>
              </h2>
            </div>
          </div>
        </div>
        <TransactionsSearchFilter
          placeholder="Search or type filter"
          categories={[
            ...categoriesData?.data?.map((category) => ({
              slug: category.slug,
              name: category.name,
            })),
            {
              // TODO, move this to the database
              id: "uncategorized",
              name: "Uncategorized",
              slug: "uncategorized",
            },
          ]}
          accounts={accountsData?.data?.map((account) => ({
            id: account.id,
            name: account.name,
            currency: account.currency,
          }))}
          members={teamMembersData?.data?.map((member) => ({
            id: member?.user?.id,
            name: member.user?.full_name,
          }))}
          hideRecurring={true}
        />
        <TransactionsActions isEmpty={isEmpty} />
      </div>

      {isEmpty ? (
        <div className="relative h-[calc(100vh-200px)] overflow-hidden">
          <NoAccounts />
          <Loading isEmpty />
        </div>
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
        accountId={accountsData?.data?.at(0)?.id ?? ""}
        currency={accountsData?.data?.at(0)?.currency ?? ""}
      />
    </>
  );
}
