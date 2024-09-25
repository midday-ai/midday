"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import React from "react";

interface Account {
  id: string;
  name: string;
}

interface ScrollableTransactionSelectorProps {
  accounts: Account[];
  selectedAccountId: string | null;
  onAccountChange: (accountId: string | null) => void;
}

const ScrollableTransactionSelector: React.FC<
  ScrollableTransactionSelectorProps
> = ({ accounts, selectedAccountId, onAccountChange }) => {
  return (
    <Select
      onValueChange={(value) => onAccountChange(value || null)}
      value={selectedAccountId || undefined}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select an account" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">All Accounts</SelectItem>
        {accounts.map((account) => (
          <SelectItem key={account.id} value={account.id}>
            {account.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default ScrollableTransactionSelector;
