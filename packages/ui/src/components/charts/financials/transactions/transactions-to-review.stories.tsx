import { Meta, StoryFn } from "@storybook/react";
import { FinancialDataGenerator } from "../../../../lib/random/financial-data-generator";
import AssistantProviderWrapper from "../../../../wrapper/assistant-provider-wrapper";
import {
  TransactionsToReview,
  TransactionsToReviewProps,
} from "./transactions-to-review";

const transactions = FinancialDataGenerator.generateRandomTransactions(100);

export default {
  component: TransactionsToReview,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    currency: {
      control: "select",
      options: ["USD", "EUR", "GBP", "JPY"],
    },
    height: {
      control: { type: "range", min: 200, max: 600, step: 10 },
    },
    enableAssistantMode: {
      control: "boolean",
    },
    locale: {
      control: "select",
      options: ["en-US", "de-DE", "fr-FR", "ja-JP"],
    },
  },
  decorators: [
    (Story) => (
      <AssistantProviderWrapper>
        <Story />
      </AssistantProviderWrapper>
    ),
  ],
} as Meta;

const Template: StoryFn<TransactionsToReviewProps> = (
  args: JSX.IntrinsicAttributes & TransactionsToReviewProps,
) => (
  <div className="w-[900px]">
    <TransactionsToReview {...args} />
  </div>
);

export const Default = Template.bind({});
Default.args = {
  transactions: transactions,
};
