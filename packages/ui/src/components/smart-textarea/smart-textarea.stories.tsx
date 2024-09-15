// SmartTextarea.stories.tsx

import { Meta, StoryObj } from "@storybook/react";

import { SmartTextarea } from "./smart-textarea";

const meta: Meta<typeof SmartTextarea> = {
  component: SmartTextarea,
  args: {
    context: {},
    sampleQuestions: ["What is the weather today?", "How far is the moon?"], // You can provide default sample questions for the story.
    placeholder: "Type your text here...",
    globalFinancialContext: {},
    userAccount: {},
  },
} as Meta;

export default meta;

type Story = StoryObj<typeof SmartTextarea>;

export const Primary: Story = {
  args: {
    userId: "1234",
    userName: "John Doe",
  },
};
