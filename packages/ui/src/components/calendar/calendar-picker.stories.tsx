// CalendarDatePicker.stories.tsx

import type { Meta, StoryObj } from "@storybook/react";

import { CalendarPicker } from "./calendar-picker";

const meta: Meta<typeof CalendarPicker> = {
  component: CalendarPicker,
  tags: ["autodocs"],
  argTypes: {
    initialFrom: {
      control: "date",
    },
    initialTo: {
      control: "date",
    },
    className: {
      control: "text",
    },
    onClick: { action: "clicked" },
    onDateChange: { action: "date changed" },
  },
};

export default meta;
type Story = StoryObj<typeof CalendarPicker>;

export const Default: Story = {
  args: {},
};

export const WithInitialDateRange: Story = {
  args: {
    initialFrom: new Date(2024, 0, 1), // January 1, 2024
    initialTo: new Date(2024, 11, 31), // December 31, 2024
  },
};

export const WithCustomClassName: Story = {
  args: {
    className: "bg-gray-100 rounded-lg shadow-md",
  },
};

export const WithCallbacks: Story = {
  args: {
    onClick: () => console.log("CalendarPicker clicked"),
    onDateChange: (from, to) => console.log("Date range changed:", from, to),
  },
};
