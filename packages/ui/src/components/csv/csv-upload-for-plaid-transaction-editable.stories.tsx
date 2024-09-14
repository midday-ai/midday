import { type Meta, type StoryObj } from "@storybook/react";

import { EditableCsvUploaderForPlaidTransactions } from "./csv-upload-for-plaid-transaction-editable";

const meta: Meta<typeof EditableCsvUploaderForPlaidTransactions> = {
  component: EditableCsvUploaderForPlaidTransactions,
  argTypes: {},
};

export default meta;

type Story = StoryObj<typeof EditableCsvUploaderForPlaidTransactions>;

export const Default: Story = {};

export const EditableCsvUpload: Story = {
  args: {
    className: "w-full rounded-2xl border-black",
  },
};
