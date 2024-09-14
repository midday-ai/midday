import { Transaction } from "client-typescript-sdk";
import React, { useMemo } from 'react';
import { Button } from "../../../../components/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../../../../components/card";
import { FinancialMetricsTransactionConverter } from "../../../../lib/converters/expense-and-income-metrics-converter";
import { MonthlyTransactions } from "./transactions-chart";

export interface TransactionsToReviewProps {
    transactions: Transaction[];
}

const TransactionsToReview: React.FC<TransactionsToReviewProps> = ({ transactions }) => {
    const transactionsByMonth = useMemo(() => {
        return transactions ? FinancialMetricsTransactionConverter.breakTransactionsByMonth(transactions) : {};
    }, [transactions]);

    return (
        <Card className="space-y-4">
            <CardHeader>
                <CardTitle className="text-3xl font-semibold">Transactions to Review</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    {Object.entries(transactionsByMonth).length > 0 ? (
                        Object.entries(transactionsByMonth).map(([month, monthTransactions]) => (
                            <MonthlyTransactions key={month} month={month} transactions={monthTransactions} />
                        ))
                    ) : (
                        <p>No transactions available.</p>
                    )}
                </div>
            </CardContent>
            <CardFooter>
                <div className="flex flex-1 justify-between">
                    <p>Total: ${transactions.reduce((acc, transaction) => acc + (transaction.amount || 0), 0).toFixed(2)}</p>
                    <Button>View All</Button>
                </div>
            </CardFooter>
        </Card>
    );
};

export { TransactionsToReview };
