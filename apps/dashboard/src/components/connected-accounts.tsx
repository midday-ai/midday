import { AddAccountButton } from "@/components/add-account-button";
import {
  BankAccountList,
  BankAccountListSkeleton,
} from "@/components/bank-account-list";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@midday/ui/card";
import { Suspense } from "react";

export function ConnectedAccounts() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Accounts</CardTitle>
        <CardDescription>
          Manage bank accounts, update or connect new ones.
        </CardDescription>
      </CardHeader>

      <Suspense fallback={<BankAccountListSkeleton />}>
        <BankAccountList />
      </Suspense>

      <CardFooter className="flex justify-between">
        <div />

        <AddAccountButton />
      </CardFooter>
    </Card>
  );
}
