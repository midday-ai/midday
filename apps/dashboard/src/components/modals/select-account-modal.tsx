"use client";

import { getAccessToken, getAccounts } from "@/actions/gocardless";
import { Avatar, AvatarImage } from "@midday/ui/avatar";
import { Button } from "@midday/ui/button";
import { Checkbox } from "@midday/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@midday/ui/dialog";
import { Skeleton } from "@midday/ui/skeleton";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

function RowsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-9 w-9 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-[210px]" />
          <Skeleton className="h-2.5 w-[180px]" />
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <Skeleton className="h-9 w-9 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-[250px]" />
          <Skeleton className="h-2.5 w-[200px]" />
        </div>
      </div>
    </div>
  );
}

function Row({ name, iban, logo, availableBalance, onSelect }) {
  const formattedAmount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: availableBalance.currency,
  }).format(availableBalance.amount);

  return (
    <div className="flex justify-between">
      <div className="flex items-between">
        <Avatar className="flex h-9 w-9 items-center justify-center space-y-0 border">
          <AvatarImage src={logo} alt={name} />
        </Avatar>
        <div className="ml-4 space-y-1">
          <p className="text-sm font-medium leading-none mb-1">{iban}</p>
          <p className="text-xs text-muted-foreground">
            {name} - {formattedAmount}
          </p>
        </div>
      </div>
      <Checkbox id="terms1" />
    </div>
  );
}

export default function ConnectBankModal() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const { access } = await getAccessToken();
      const accounts = await getAccounts({
        token: access,
        id: searchParams.get("ref"),
      });

      setAccounts(accounts);
      setLoading(false);
    }

    fetchData();
  }, []);

  return (
    <Dialog defaultOpen onOpenChange={() => router.back()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select accounts</DialogTitle>
          <DialogDescription>
            Select the accounts you want to sync with Midday.
          </DialogDescription>
        </DialogHeader>

        <div className="my-8">
          <div className="space-y-6">
            {loading && <RowsSkeleton />}

            {accounts.map((account) => (
              <Row
                key={account.id}
                name={account.bank.name}
                logo={account.bank.logo}
                iban={account.iban}
                availableBalance={account.balances.available}
              />
            ))}
          </div>
        </div>

        <Button className="w-full">Save</Button>
      </DialogContent>
    </Dialog>
  );
}
