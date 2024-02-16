import {
  BankAccountList,
  BankAccountListSkeleton,
} from "@/components/bank-account-list";
import { Button } from "@midday/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@midday/ui/card";
import Link from "next/link";
import { Suspense } from "react";

export async function ConnectedAccounts() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Connected Accounts</CardTitle>
        <CardDescription>
          Manage bank accounts, update or connect new ones.
        </CardDescription>
      </CardHeader>

      <Suspense fallback={<BankAccountListSkeleton />}>
        <BankAccountList />
      </Suspense>

      <CardFooter className="flex justify-between">
        <div />
        <Link href="?step=bank">
          <Button data-event="Connect Bank" data-icon="🏦" data-channel="bank">
            Connect bank
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
