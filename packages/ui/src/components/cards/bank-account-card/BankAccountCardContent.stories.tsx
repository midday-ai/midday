// BankAccountCardHeader.stories.tsx
import { StoryObj, type Meta } from "@storybook/react";
import { FinancialDataGenerator } from "../../../lib/random/financial-data-generator";

import { BankAccountContext } from "./BankAccountCard";
import { BankAccountCardContent } from "./BankAccountCardContent";
// Mock data for the bank account
const mockBankAccount = FinancialDataGenerator.generateRandomBankAccount();

const meta: Meta<typeof BankAccountCardContent> = {
  component: BankAccountCardContent,
  argTypes: {
    className: {
      control: {
        type: "text",
      },
      defaultValue: "",
    },
  },
  decorators: [
    (Story) => (
      <BankAccountContext.Provider value={mockBankAccount}>
        <Story />
      </BankAccountContext.Provider>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof BankAccountCardContent>;

export const Default: Story = {
  args: {},
};

export const BankAccountCardContentWithClassName: Story = {
  args: {
    className: "border rounded-md",
  },
};
