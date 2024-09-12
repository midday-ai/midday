// BankAccountCardHeader.stories.tsx

import type { Meta, StoryObj } from "@storybook/react";

import { BasicEditor } from "./basicEditor";

const meta: Meta<typeof BasicEditor> = {
  component: BasicEditor,
  decorators: [(Story) => <Story />],
};

export default meta;

type Story = StoryObj<typeof BasicEditor>;

export const Default: Story = {};
