import { createClient } from "@midday/supabase/client";
import { getTransactionsByBankAccountQuery } from "@midday/supabase/queries";
import { Tables, TransactionSchema } from "@midday/supabase/types";
import { Drawer, DrawerContent } from "@midday/ui/drawer";
import { useMediaQuery } from "@midday/ui/hooks";
import { Sheet, SheetContent } from "@midday/ui/sheet";
import React, { useEffect, useState } from "react";
import { BankAccountDetails } from "../bank-account-details";

type BankAccount = Tables<"bank_accounts">;
type BankConnection = Tables<"bank_connections">;

type Props = {
  setOpen: (open: boolean) => void;
  isOpen: boolean;
  bankAccount: BankAccount;
  bankConnection?: BankConnection;
  userName: string;
};

export function BankAccountSheet({
  setOpen,
  isOpen,
  bankAccount,
  bankConnection,
  userName,
}: Props) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [transactions, setTransactions] = useState<TransactionSchema[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchTransactions() {
      if (bankAccount.id) {
        setTransactionsLoading(true);
        const data = await getTransactionsByBankAccountQuery(supabase, {
          bankAccountId: bankAccount.id,
          limit: 15,
        });
        if (data) {
          setTransactions(data);
        } else {
          setTransactions([]);
        }
        setTransactionsLoading(false);
      }
    }

    if (isOpen) {
      fetchTransactions();
    }
  }, [bankAccount.id, isOpen]);

  const content = (
    <BankAccountDetails
      bankAccount={bankAccount}
      bankConnection={bankConnection}
      userName={userName}
      transactions={transactions}
      transactionsLoading={transactionsLoading}
    />
  );

  if (isDesktop) {
    return (
      <Sheet open={isOpen} onOpenChange={setOpen}>
        <SheetContent>{content}</SheetContent>
      </Sheet>
    );
  }

  return (
    <Drawer
      open={isOpen}
      onOpenChange={(open: boolean) => {
        if (!open) {
          setOpen(false);
        }
      }}
    >
      <DrawerContent className="p-6">{content}</DrawerContent>
    </Drawer>
  );
}
