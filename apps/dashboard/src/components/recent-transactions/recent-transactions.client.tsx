'use client';

import { columns } from "@/components/tables/transactions/columns";
import { DataTable } from "@/components/tables/transactions/data-table";
import { NoResults } from "@/components/tables/transactions/empty-states";
import { BankAccountWithTeam, TransactionSchema } from "@midday/supabase/types";
import { Badge } from "@midday/ui/badge";
import { Button } from "@midday/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@midday/ui/card";
import { cn } from "@midday/ui/cn";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@midday/ui/dropdown-menu";
import { Icons } from "@midday/ui/icons";
import { ScrollArea, ScrollBar } from "@midday/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@midday/ui/tooltip";
import { format } from "date-fns";
import { CreditCard } from "lucide-react";
import { useState } from 'react';
import { TransactionAnalytics } from "../bank-account/transaction-analytics";

interface Account {
    id: string;
    name: string;
    balance?: number;
    currency?: string;
}

interface RecentTransactionsClientProps {
    initialTransactions: TransactionSchema[];
    accounts: Account[];
    title: string;
    description: string;
    className?: string;
    initialColumnVisibility: any;
    limit: number;
    recurringTransactionFrequency?: string;
    onLoadMore: (accountId?: string) => Promise<TransactionSchema[]>;
    onAccountSelect: (accountId?: string) => Promise<TransactionSchema[]>;
}

export function RecentTransactionsClient({
    initialTransactions,
    accounts,
    title,
    description,
    className,
    initialColumnVisibility,
    limit,
    recurringTransactionFrequency,
    onLoadMore,
    onAccountSelect,
}: RecentTransactionsClientProps) {
    const [transactions, setTransactions] = useState<TransactionSchema[]>(initialTransactions);
    const [selectedAccount, setSelectedAccount] = useState<string | undefined>(undefined);

    async function loadMore() {
        const newTransactions = await onLoadMore(selectedAccount);
        setTransactions(prevTransactions => [...prevTransactions, ...newTransactions]);
    }

    async function handleAccountSelect(accountId: string | undefined) {
        setSelectedAccount(accountId);
        const newTransactions = await onAccountSelect(accountId);
        setTransactions(newTransactions);
    }

    if (!transactions.length) {
        return (
            <NoResults hasFilters={recurringTransactionFrequency !== undefined || selectedAccount !== undefined} />
        );
    }

    const formatDate = (date: string) => {
        return format(new Date(date), "MMMM d, yyyy");
    };

    let dateRange = "No transactions";
    if (transactions && transactions.length > 0) {
        const lastTransactionDate = formatDate(transactions[0]!.date);
        const firstTransactionDate = formatDate(transactions[transactions.length - 1]!.date);
        dateRange = `${firstTransactionDate} - ${lastTransactionDate}`;
    }

    console.log("these are the accounts of interest", accounts);

    return (
        <Card
            className={cn("min-h-[530px] overflow-y-auto scrollbar-hide", className)}
        >
            <div className="p-[2%]">
                <div className="mx-auto w-full">
                    <h2 className="mt-2 text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
                        {title}
                        <span className="ml-1 text-xs">{transactions.length} transactions</span>
                    </h2>
                    <div className="flex justify-between">
                        <p className="mt-6 text-lg leading-8 text-foreground/3">
                            {description}
                        </p>
                        <div>
                            <div className="flex flex-1 gap-2">
                                <TransactionAnalytics transactions={transactions} />
                                {accounts.length > 0 && (
                                    <AccountSelection
                                        accounts={accounts}
                                        selectedAccount={selectedAccount}
                                        onAccountSelect={handleAccountSelect}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <DataTable
                data={transactions as any ?? []}
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
}

interface AccountSelectionProps {
    accounts: Account[];
    selectedAccount: string | undefined;
    onAccountSelect: (accountId: string | undefined) => void;
}

export function AccountSelection({ accounts, selectedAccount, onAccountSelect }: AccountSelectionProps) {
    const [isOpen, setIsOpen] = useState(false);

    const selectedAccountData = selectedAccount
        ? accounts.find(account => account.id === selectedAccount)
        : null;


    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="md:max-w-[300px] justify-start">
                    <CreditCard className="mr-2 h-4 w-4" />
                    {selectedAccountData ? (
                        <span className="truncate">{selectedAccountData.name}</span>
                    ) : (
                        <span>All Accounts</span>
                    )}
                    <Icons.ChevronDown className={cn("ml-auto h-4 w-4 transition-transform duration-200", {
                        "transform rotate-180": isOpen
                    })} />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="md:max-w-[300px]">
                <DropdownMenuLabel>Select Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={() => {
                        onAccountSelect(undefined);
                        setIsOpen(false);
                    }}
                >
                    <CreditCard className="mr-2 h-4 w-4" />
                    <span>All Accounts</span>
                </DropdownMenuItem>
                {accounts.map((account) => (
                    <DropdownMenuItem
                        key={account.id}
                        onClick={() => {
                            onAccountSelect(account.id);
                            setIsOpen(false);
                        }}
                    >
                        <CreditCard className="mr-2 h-4 w-4" />
                        <span className="flex-grow truncate">{account.name}</span>
                        {account.balance !== undefined && account.currency && (
                            <span className="ml-2 text-sm opacity-60">
                                {account.currency} {account.balance.toFixed(2)}
                            </span>
                        )}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}