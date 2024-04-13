import type { Meta, StoryObj } from "@storybook/react";
import { Calendar } from "./calendar";

const meta: Meta<typeof Calendar> = {
  component: () => (
    <Calendar
      mode="single"
      selected={new Date("2024-01-01")}
      onSelect={() => {}}
      className="rounded-md border"
    />
  ),
};

export default meta;

type Story = StoryObj<typeof Calendar>;

export const Default: Story = {};
