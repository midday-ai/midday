import type { Meta, StoryObj } from "@storybook/react";

import { Accordion } from "./accordion";

const meta: Meta<typeof Accordion> = {
  component: Accordion,
};
export default meta;

type Story = StoryObj<typeof Accordion>;

export const Primary: Story = {};
