// CalendarDatePicker.stories.tsx

import type { Meta, StoryObj } from "@storybook/react";
import { addDays } from "date-fns";

import { CalendarDatePicker } from "./calendar-date-picker";

const meta: Meta<typeof CalendarDatePicker> = {
  component: CalendarDatePicker,
  tags: ["autodocs"],
  argTypes: {
    id: { control: "text" },
    className: { control: "text" },
    closeOnSelect: { control: "boolean" },
    numberOfMonths: {
      control: { type: "radio", options: [1, 2] },
    },
    yearsRange: { control: "number" },
    variant: {
      control: {
        type: "select",
        options: [
          "default",
          "destructive",
          "outline",
          "secondary",
          "ghost",
          "link",
        ],
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof CalendarDatePicker>;

const today = new Date();

export const Default: Story = {
  args: {
    id: "default-picker",
    date: { from: today, to: addDays(today, 7) },
    onDateSelect: (range) => console.log("Date selected:", range),
  },
};

export const SingleMonth: Story = {
  args: {
    ...Default.args,
    id: "single-month-picker",
    numberOfMonths: 1,
    date: { from: today, to: today },
  },
};

export const CustomYearsRange: Story = {
  args: {
    ...Default.args,
    id: "custom-years-range-picker",
    yearsRange: 20,
  },
};

export const CloseOnSelect: Story = {
  args: {
    ...Default.args,
    id: "close-on-select-picker",
    closeOnSelect: true,
  },
};

export const CustomVariant: Story = {
  args: {
    ...Default.args,
    id: "custom-variant-picker",
    variant: "outline",
  },
};

export const CustomClassName: Story = {
  args: {
    ...Default.args,
    id: "custom-class-picker",
    className: "bg-blue-100 p-4 rounded-lg",
  },
};
