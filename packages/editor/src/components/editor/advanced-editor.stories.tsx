// BankAccountCardHeader.stories.tsx

import type { Meta, StoryObj } from "@storybook/react";

import { AdvancedEditor } from "./advanced-editor";

const meta: Meta<typeof AdvancedEditor> = {
  component: AdvancedEditor,
  decorators: [(Story) => <Story />],
};

export default meta;

type Story = StoryObj<typeof AdvancedEditor>;

export const Default: Story = {};

export const WithButton: Story = {
  args: {
    label: "save",
    callback: (content: string) => {
      console.log(content);
    },
  },
};
