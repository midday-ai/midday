import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Icons } from "@midday/ui/icons";
import { Suspense } from "react";
import {
  TransactionsList,
  TransactionsListHeader,
  TransactionsListSkeleton,
} from "./transactions-list";

export function LatestTransactions() {
  return (
    <div className="flex-1 border p-8">
      <div className="mb-4">
        <DropdownMenu>
          <DropdownMenuTrigger>
            <div className="flex items-center space-x-2">
              <h2 className="text-2xl">Transactions</h2>
              <Icons.ChevronDown />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuCheckboxItem checked>Latest</DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem>Income</DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem>Outcome</DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <TransactionsListHeader />
      <Suspense fallback={<TransactionsListSkeleton />}>
        <TransactionsList />
      </Suspense>
    </div>
  );
}
