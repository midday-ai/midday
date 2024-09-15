"use client";

import { ArrowRightIcon } from "@radix-ui/react-icons";
import { CreditAccount, FinancialUserProfile, MelodyFinancialContext, Transaction } from "client-typescript-sdk";
import { useState } from "react";
import { FinancialDataGenerator } from "../../lib/random/financial-data-generator";
import { cn } from "../../utils/cn";
import { Button } from "../button";
import { Card, CardContent, CardHeader } from "../card";
import { CreditAccountCard } from "../cards/credit-account-card";
import { Dialog, DialogContent, DialogTrigger } from "../dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../tabs";
import { columns, DataTable } from "../transaction-table";

interface CreditAccountPortalViewProps {
    financialProfile?: FinancialUserProfile;
    financialContext?: MelodyFinancialContext;
    className?: string;
    transactions?: Transaction[];
    demoMode?: boolean;
}

/**
 * CreditAccountsOverviewSummary component displays an overview of all bank accounts.
 * It shows a header with the total count of bank accounts and a list of bank account cards.
 *
 * @param props - The props for the component.
 * @returns A React functional component.
 */
const CreditAccountsOverviewSummary: React.FC<CreditAccountPortalViewProps> = ({ financialProfile, financialContext, className, transactions, demoMode = false }) => {
    if (!financialProfile || !financialContext || demoMode) {
        financialProfile = FinancialDataGenerator.generateFinancialProfile();
        financialContext = FinancialDataGenerator.generateFinancialContext();
        transactions = FinancialDataGenerator.generateRandomTransactions(50);
    };
    
    // get the current financial profile
    const linkedInstitutions =
        financialProfile.link !== undefined ? financialProfile.link : [];

    // get all bank accounts from link
    let CreditAccounts = linkedInstitutions
        ? linkedInstitutions
            .filter((link) => link.creditAccounts !== undefined)
            .map((link) => link.creditAccounts)
            .flat()
        : [];

    const validAccounts: Array<CreditAccount> = CreditAccounts.filter(
        (account) => account !== undefined,
    );

    const [selectedAccount, setSelectedAccount] = useState<CreditAccount | undefined>(CreditAccounts[0]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    if (validAccounts.length === 0) {
        return (
            <Card className="p-[2%]">
                <CardHeader>
                    <h3 className="text-3xl font-bold">Bank Accounts</h3>
                </CardHeader>
                <CardContent>
                    <p>No bank accounts connected.</p>
                </CardContent>
            </Card>
        );
    }

    if (!selectedAccount) {
        return null;
    }

    return (
        <div className={cn("h-screen w-full bg-background text-foreground", className)}>
            <Card className="p-[2%] h-full flex flex-col">
                <h3 className="text-3xl font-bold mb-4">Credit Accounts</h3>
                <div className="flex-grow overflow-hidden">
                    <Tabs
                        defaultValue={validAccounts[0]?.name as string}
                        className="flex h-full"
                    >
                        <TabsList className="p-[1%] flex-col items-start justify-start h-[40%] overflow-y-auto scrollbar-hide w-fit mr-4 bg-black text-white rounded-2xl">
                            {validAccounts.map((account, idx) => (
                                <TabsTrigger
                                    value={account.name as string}
                                    className="text-xs font-bold text-white text-left mb-2 w-full"
                                    key={idx}
                                    onClick={() => setSelectedAccount(account)}
                                >
                                    <div className="flex flex-col items-start justify-start gap-1">
                                        <p>Account #{account.number}</p>
                                        <span style={{ fontSize: "0.5rem" }}>
                                            {account.name}
                                        </span>
                                    </div>
                                </TabsTrigger>
                            ))}
                        </TabsList>
                        <Card className="overflow-y-auto scrollbar-hide w-full">
                            {validAccounts.map((account, idx) => (
                                <TabsContent
                                    value={account.name as string}
                                    key={idx}
                                    className="px-4"
                                >
                                    <CreditAccountCard
                                        className="border-none bg-white shadow-none"
                                        financialProfile={financialProfile} 
                                        creditAccount={account} 
                                        institutionName={""}
                                    />
                                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                        <DialogTrigger asChild>
                                            <Button className="mt-4 px-4 py-2" variant="outline">
                                                View Transactions
                                                <ArrowRightIcon className="ml-2" />
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="h-[80%] w-full min-w-[90%] overflow-y-auto scrollbar-hide p-[2%] rounded-2xl">
                                            <h2 className="pt-6 text-lg font-bold tracking-tight">
                                                {selectedAccount.name?.toUpperCase()}{" "}
                                                <span className="ml-1 text-xs"> {selectedAccount.number}</span>
                                            </h2>
                                            <p className="pb-5 text-4xl font-bold tracking-tight">
                                                ${selectedAccount.balance?.toFixed(2)}{" "}
                                                <span className="ml-1 text-xs"> {selectedAccount.subtype}</span>
                                            </p>
                                            {transactions && (
                                                <div className="flex flex-col gap-3 p-[2%]">
                                                    <h2 className="ml-5 text-3xl font-bold tracking-tight">
                                                        Most Recent Transactions{" "}
                                                        <span className="ml-1 text-xs">({transactions.length}) </span>
                                                    </h2>
                                                    <DataTable data={transactions} columns={columns} />
                                                </div>
                                            )}
                                        </DialogContent>
                                    </Dialog>
                                </TabsContent>
                            ))}
                        </Card>
                    </Tabs>
                </div>
            </Card>
        </div>
    );
};

export { CreditAccountsOverviewSummary };
