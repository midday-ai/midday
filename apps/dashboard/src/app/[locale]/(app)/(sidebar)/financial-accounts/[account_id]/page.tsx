import { BankConnections } from "@/components/bank-connections";
import { default as BankAccountBalanceChart } from "@/components/charts/account-balance/account-balance-chart";
import { ContentLayout } from "@/components/panel/content-layout";
import RecentTransactions from "@/components/recent-transactions/recent-transactions";
import { RecentTransactionsServer } from "@/components/recent-transactions/recent-transactions.server";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getBankAccountByAccountId, getBankConnectionById, getUser } from "@midday/supabase/cached-queries";
import { CardDescription } from "@midday/ui/card";
import { Skeleton } from '@midday/ui/skeleton';
import { a } from "framer-motion/client";
import { Suspense } from 'react';

async function LoadBankAccountData({ accountId, currency, connectionId, accountName }: { accountId: string, currency: string, connectionId: string, accountName: string }) {
    const bankConnection = await getBankConnectionById(connectionId ?? "");

    try {
        return (
            <Card className="w-full border-none bg-background text-foreground">
                <CardHeader>
                    <CardTitle className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">{accountName || "Bank Account"}</CardTitle>
                    <CardDescription>
                        Connected bank account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <BankAccountBalanceChart
                        accountId={accountId}
                        currency={currency ?? "USD"}
                        className="p-1"

                    />

                </CardContent>
            </Card>
        );
    } catch (error) {
        return (
            <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                    {error instanceof Error ? error.message : "An unexpected error occurred"}
                </AlertDescription>
            </Alert>
        );
    }
}

function LoadingSkeleton() {
    return (
        <div className="space-y-4">
            <Skeleton className="h-8 w-[250px]" />
            <Skeleton className="h-[200px] w-full" />
        </div>
    );
}

function LoadingTableSkeleton() {
    return (
        <div className="space-y-4">
            <Skeleton className="h-8 w-[250px]" />
            <Skeleton className="h-[200px] w-full" />
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr>
                            <th className="p-2"><Skeleton className="h-6 w-full" /></th>
                            <th className="p-2"><Skeleton className="h-6 w-full" /></th>
                            <th className="p-2"><Skeleton className="h-6 w-full" /></th>
                        </tr>
                    </thead>
                    <tbody>
                        {[...Array(12)].map((_, index) => (
                            <tr key={index}>
                                <td className="p-2"><Skeleton className="h-4 w-full" /></td>
                                <td className="p-2"><Skeleton className="h-4 w-full" /></td>
                                <td className="p-2"><Skeleton className="h-4 w-full" /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default async function FinancialAccount({
    params,
    searchParams,
}: {
    params: { account_id: string };
    searchParams: Record<string, string>;
}) {
    const bankAccountId = params.account_id;
    const bankAccount = await getBankAccountByAccountId(bankAccountId)

    return (
        <ContentLayout title="Financial Accounts">
            <div className="flex flex-col h-screen overflow-hidden">
                <div className="flex-grow overflow-auto scrollbar-hide">
                    <div className="space-y-6 mt-[2%]">
                        <Suspense fallback={<LoadingSkeleton />}>
                            <LoadBankAccountData 
                                accountId={bankAccountId}
                                currency={bankAccount?.data?.currency as string} 
                                connectionId={bankAccount?.data?.bank_connection_id as string} 
                                accountName={bankAccount?.data?.name as string} />
                        </Suspense>
                        <Suspense fallback={<LoadingTableSkeleton />}>
                            <RecentTransactions
                                limit={150}
                                accountId={bankAccount?.data?.id}
                                title={`${bankAccount?.data?.name} Transactions`}
                                description={`Recent transactions for the bank account`}
                                className="border-none shadow-none"
                            />
                        </Suspense>
                    </div>
                </div>
            </div>
        </ContentLayout>
    );
}
