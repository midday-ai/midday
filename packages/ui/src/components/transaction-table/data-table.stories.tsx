import { Meta, StoryObj } from "@storybook/react";
import { ColumnDef } from "@tanstack/react-table";
import { Transaction } from "client-typescript-sdk";
import { FinancialDataGenerator } from "../../lib/random/financial-data-generator";
import { columns } from "./data-columns";
import { DataTable } from "./data-table";

const meta: Meta<typeof DataTable> = {
  component: DataTable,
} as Meta;

export default meta;

type Story = StoryObj<typeof DataTable>;

const transactions: Transaction[] =
  FinancialDataGenerator.generateRandomTransactions(100);

const txnWithProperDate = transactions.map((txn) => {
  return {
    ...txn,
    // randomly generate a date between 1/1/2020 and today
    authorizedDate: new Date(
      Math.random() *
        (new Date().getTime() - new Date(2023, 10, 29).getTime()) +
        new Date(2023, 10, 29).getTime(),
    ).toLocaleDateString(),
    // generate a random amount in the range of 100 to 10000
    amount: Math.floor(Math.random() * (10000 - 100) + 100),
    // generata a random set of tags which are random strigns
    tags: Array.from({ length: 5 }, () => Math.random().toString(36)),
    // generate a random transaction nae and emrchant name
    name: Math.random().toString(36),
    merchantName: Math.random().toString(36),
  };
});

export const Default: Story = {};
Default.args = {
  data: txnWithProperDate,
  columns: columns as ColumnDef<unknown, unknown>[],
};
