// BankAccountCardHeader.stories.tsx

import type { Meta, StoryObj } from "@storybook/react";

import { MarkdownPreview } from "./markdown-preview";

const meta: Meta<typeof MarkdownPreview> = {
  component: MarkdownPreview,
  decorators: [(Story) => <Story />],
};

export default meta;

type Story = StoryObj<typeof MarkdownPreview>;

export const Default: Story = {};

export const WithButton: Story = {
  args: {
    callback: (content: string) => {
      console.log(content);
    },
    aiAppId: "123",
    aiBaseUrl: "https://example.com",
    aiToken: "abc",
  },
};

export const WithContent: Story = {
  args: {
    content: "Hello World",
    aiAppId: "123",
    aiBaseUrl: "https://example.com",
    aiToken: "abc",
  },
};
