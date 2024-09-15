import { formatDate } from "../../../../lib/converters/date-formater";
import { Badge } from "../../../../components/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "../../../../components/table";
import { Transaction } from "client-typescript-sdk";
import React from "react";

interface TransactionsByMonthProps {
  transactionsByMonth: Record<string, Transaction[]>;
}

const TransactionsByMonth: React.FC<TransactionsByMonthProps> = ({
  transactionsByMonth,
}) => {
  const calculateMonthTotal = (transactions: Transaction[]): number => {
    return transactions.reduce(
      (acc, transaction) => acc + (transaction.amount || 0),
      0,
    );
  };

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold">Transactions by Month</h2>
      {Object.entries(transactionsByMonth).length > 0 ? (
        Object.entries(transactionsByMonth).map(
          ([month, monthTransactions]) => (
            <MonthlyTransactions
              key={month}
              month={month}
              transactions={monthTransactions}
            />
          ),
        )
      ) : (
        <p>No transactions available.</p>
      )}
    </div>
  );
};

interface MonthlyTransactionsProps {
  month: string;
  transactions: Transaction[];
}

const MonthlyTransactions: React.FC<MonthlyTransactionsProps> = ({
  month,
  transactions,
}) => {
  const monthTotal = calculateMonthTotal(transactions);

  return (
    <div className="space-y-4 py-3">
      <div className="flex justify-between items-center p-2">
        <h3 className="text-xl font-semibold">{month}</h3>
        <p className="text-xl">${monthTotal.toFixed(2)}</p>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableBody>
            {transactions.map((transaction, index) => (
              <TransactionRow key={index} transaction={transaction} />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

interface TransactionRowProps {
  transaction: Transaction;
}

const TransactionRow: React.FC<TransactionRowProps> = ({ transaction }) => (
  <TableRow className="rounded-2xl">
    <TableCell>{formatDate(transaction.currentDate || "")}</TableCell>
    <TableCell>{transaction.accountId}</TableCell>
    <TableCell>{transaction.name}</TableCell>
    <TableCell>${transaction.amount?.toFixed(2)}</TableCell>
    <TableCell>
      <Badge variant="outline" className="p-2">
        {transaction.personalFinanceCategoryPrimary}
      </Badge>
    </TableCell>
  </TableRow>
);

const calculateMonthTotal = (transactions: Transaction[]): number => {
  return transactions.reduce(
    (acc, transaction) => acc + (transaction.amount || 0),
    0,
  );
};

export {
  calculateMonthTotal,
  MonthlyTransactions,
  TransactionRow,
  TransactionsByMonth,
};
